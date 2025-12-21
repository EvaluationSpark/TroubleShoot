from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class RepairAnalysisRequest(BaseModel):
    image_base64: str
    image_mime_type: Optional[str] = "image/jpeg"  # MIME type for Gemini API
    language: str = "en"
    skill_level: Optional[str] = "diy"  # beginner, diy, pro
    model_number: Optional[str] = None  # PR #5: Model number for better accuracy

class CostEstimate(BaseModel):
    low: float
    typical: float
    high: float
    currency: str = "USD"
    parts_breakdown: List[Dict[str, Any]]
    tools_cost: float
    labor_hours_range: Dict[str, float]  # {"min": 1, "max": 2}
    assumptions: List[str]

class TimeEstimate(BaseModel):
    prep: float  # minutes
    active: float  # minutes
    cure: Optional[float] = None  # minutes (optional)
    total: float  # minutes
    unit: str = "minutes"

class RepairAnalysisResponse(BaseModel):
    repair_id: str
    item_type: str
    damage_description: str
    repair_difficulty: str  # easy, medium, hard
    estimated_time: str
    repair_steps: List[Any]  # Can be strings or objects with step details
    tools_needed: List[Any]  # Can be strings or dicts with cost info
    parts_needed: List[Any]  # More flexible for different data types
    safety_tips: List[str]
    risk_level: Optional[str] = "low"  # low, medium, high, critical
    confidence_score: Optional[int] = 85  # 0-100
    stop_and_call_pro: Optional[bool] = False
    assumptions: Optional[List[str]] = []
    diagram_base64: Optional[str] = None
    # NEW PR #4 fields
    cost_estimate: Optional[CostEstimate] = None
    time_estimate: Optional[TimeEstimate] = None
    # PR #5 field
    model_number: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TroubleshootQuestion(BaseModel):
    repair_id: str
    question: str
    user_answer: str

class SaveRepairSession(BaseModel):
    repair_id: str
    title: str
    notes: Optional[str] = None
    progress_percentage: int = 0
    status: Optional[str] = "saved"  # saved, in_progress, completed
    repair_data: Optional[Dict[str, Any]] = None  # Full repair analysis data

class CommunityPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    item_type: str
    before_image: str  # base64
    after_image: Optional[str] = None  # base64
    repair_steps_used: List[str]
    tips: Optional[str] = None
    user_name: str = "Anonymous"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    likes: int = 0

class ReportRequest(BaseModel):
    post_id: str
    reason: str  # inappropriate, spam, dangerous, misleading, other
    details: Optional[str] = None
    reporter_name: Optional[str] = "Anonymous"

class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    reason: str
    details: Optional[str] = None
    reporter_name: str = "Anonymous"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, reviewed, resolved

class ModeratePostRequest(BaseModel):
    action: str  # delete, approve, ignore
    admin_notes: Optional[str] = None

# Gamification Models
class GamificationProfile(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_xp: int = 0
    level: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    badges_earned: List[str] = []
    stats: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CompleteStepRequest(BaseModel):
    repair_id: str
    step_number: int

class CompleteRepairRequest(BaseModel):
    repair_id: str
    difficulty: str  # easy, medium, hard
    time_taken_minutes: int

class FeedbackRequest(BaseModel):
    repair_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    was_helpful: bool

class LocalVendorSearch(BaseModel):
    item_type: str
    location: str  # City or zip code
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocalVendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialization: str
    address: str
    phone: str
    email: Optional[str] = None
    rating: float  # 1-5
    reviews_count: int
    distance: str
    estimated_cost: str
    hours: str
    website: Optional[str] = None

# ============ HELPER FUNCTIONS ============

async def analyze_broken_item(image_base64: str, language: str = "en", skill_level: str = "diy", model_number: Optional[str] = None, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """Analyze a broken item using Gemini Vision API"""
    try:
        # Adapt instructions based on skill level
        skill_context = {
            "beginner": "This user is NEW TO REPAIRS. Provide VERY DETAILED, step-by-step instructions with extra safety warnings. Assume they only have basic household tools. Suggest alternatives for specialized tools. Use simple, non-technical language.",
            "diy": "This user has BASIC REPAIR EXPERIENCE. Provide clear, standard instructions. Assume they have a typical DIY toolkit. Use moderate technical terminology.",
            "pro": "This user is an EXPERIENCED TECHNICIAN. Provide CONCISE, professional-level instructions. Assume they have professional tools. Use technical terminology freely. Minimize basic warnings."
        }
        
        skill_prompt = skill_context.get(skill_level.lower(), skill_context["diy"])
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"analysis_{uuid.uuid4()}",
            system_message=f"""You are an expert repair technician with 20+ years of experience across electronics, appliances, furniture, automotive, and more. You have exceptional visual analysis skills and can identify problems from images with high accuracy.

Your expertise includes:
- Visual damage assessment and root cause analysis
- Material science (plastics, metals, fabrics, glass, wood)
- Electronics diagnosis (circuit boards, connections, components)
- Mechanical systems (motors, gears, bearings, hinges)
- Common failure modes and wear patterns
- Safety risk assessment
- Cost estimation based on current market prices

{skill_prompt}"""
        )
        
        chat.with_model("gemini", "gemini-2.5-flash-image-preview")
        
        model_context = f"\nMODEL NUMBER PROVIDED: {model_number}\nUse this model number to provide MORE ACCURATE parts specifications, compatibility information, and model-specific repair steps." if model_number else ""
        
        prompt = f"""
VISUAL ANALYSIS INSTRUCTIONS:
Carefully examine this image and perform a comprehensive visual inspection:

1. IDENTIFY THE ITEM:
   - What is the specific type of item? (be as specific as possible)
   - Brand/manufacturer (if visible in image)
   - Model/version indicators
   - Age/condition indicators (wear patterns, discoloration)

2. DAMAGE ASSESSMENT:
   - Primary damage: What's the main issue visible?
   - Secondary damage: Any related or consequential damage?
   - Root cause: What likely caused this damage?
   - Damage severity: Minor cosmetic vs. functional failure
   - Hidden damage potential: What might NOT be visible?
   
   **IMPORTANT**: If NO VISIBLE DAMAGE is detected:
   - Set "no_visible_damage" to true
   - Still identify the item type
   - Generate diagnostic_questions to help user identify the problem

3. MATERIAL ANALYSIS:
   - What materials are involved? (plastic type, metal type, glass, fabric, etc.)
   - Material condition (brittle, cracked, deformed, corroded)
   - Material-specific repair approaches

4. VISUAL CLUES:
   - Wear patterns suggesting usage/failure mode
   - Stress points, crack patterns, break locations
   - Missing parts or components
   - Signs of previous repair attempts
   - Environmental damage (water, heat, impact, etc.)

USER SKILL LEVEL: {skill_level.upper()}
{skill_prompt}{model_context}

CRITICAL SAFETY ASSESSMENT:
- Detect if repair involves: ELECTRICAL work (exposed wiring, batteries, circuits), GAS systems, HVAC, STRUCTURAL repairs (load-bearing), or HIGH-RISK scenarios
- Assess your CONFIDENCE level (0-100) in the diagnosis based on image clarity and visible evidence
- If confidence < 70% OR high-risk category detected OR unclear damage, set stop_and_call_pro = true
- Consider image quality: Is the damage clearly visible? Multiple angles needed?

IMPORTANT: ALWAYS provide complete repair instructions, even for critical/dangerous repairs.
- If stop_and_call_pro = true, STILL provide detailed repair steps
- Add extra safety warnings and disclaimers for dangerous repairs
- Clearly state risks at the beginning of repair_steps
- The user wants to see the process even if they should call a pro

**IF NO DAMAGE IS VISIBLE**: 
- Set "no_visible_damage": true
- Set "damage_description": "No visible damage detected"
- Include "diagnostic_questions": an array of 4-6 questions to help identify the problem
- Questions should be specific to the item type
- Example questions: "Does the device turn on?", "Are there any unusual sounds?", "When did the problem start?"

Please provide:
1. Item Type (e.g., 'Smartphone', 'Chair', 'Laptop', etc.)
2. Damage Description (what's broken) - or "No visible damage detected"
3. Repair Difficulty (easy/medium/hard)
4. COST ESTIMATE (USD):
   - Low: Minimum cost (parts only)
   - Typical: Most likely total cost (parts + tools)
   - High: Maximum cost (if complications arise)
   - Parts breakdown with individual prices
   - Tools cost (if new tools needed)
   - Labor hours range (for Pro mode: min-max hours)
   - Assumptions about pricing
5. TIME ESTIMATE (minutes):
   - Prep time: Setup, gathering tools/parts
   - Active time: Actual hands-on repair work
   - Cure time: Drying, setting, waiting (if applicable)
   - Total time: Sum of all phases
6. RISK LEVEL (low/medium/high/critical) - CRITICAL for electrical/gas/structural
7. CONFIDENCE SCORE (0-100) - How certain are you about this diagnosis?
8. STOP_AND_CALL_PRO (true/false) - Should user call a professional instead?
9. ASSUMPTIONS (list) - What are you assuming about the problem?
10. Step-by-step Repair Instructions:
   - Provide 5-15 clear, actionable steps
   - Each step should be a complete sentence explaining WHAT to do and WHY
   - Include visual checkpoints ("You should see...", "It should feel...")
   - Mention common mistakes to avoid for each critical step
   - Adapt detail level to skill level (beginner = very detailed, pro = concise)
   
11. Tools Needed:
   - List ALL tools required, including basics
   - Mark each as "required" or "optional" (for alternatives)
   - Include realistic estimated costs (new, not used prices)
   - Suggest alternatives for expensive specialized tools (beginner mode)
   
12. Parts Needed:
   - List specific part names with model numbers if applicable
   - Include realistic retail prices from major suppliers
   - Mark each as "required" or "optional"
   - Include Amazon/Home Depot links when possible
   - Specify exact specifications (size, voltage, thread pitch, etc.)
   
13. Safety Tips:
   - List 3-8 safety precautions specific to THIS repair
   - Prioritize life-threatening risks first (electrical shock, gas leak, etc.)
   - Include PPE requirements (gloves, goggles, respirator)
   - Mention long-term health risks (chemical exposure, repetitive strain)

RISK LEVEL GUIDELINES:
- LOW: Cosmetic repairs, simple replacements, no power/gas involved
- MEDIUM: Requires tools, some technical skill, minor risks
- HIGH: Complex repairs, potential for injury, requires expertise
- CRITICAL: ELECTRICAL/GAS/STRUCTURAL - ALWAYS recommend professional

Format your response as JSON with these exact keys:
{{
  "item_type": "...",
  "damage_description": "...",
  "no_visible_damage": false,
  "diagnostic_questions": [],
  "repair_difficulty": "...",
  "estimated_time": "...",
  "cost_estimate": {{
    "low": 25,
    "typical": 50,
    "high": 100,
    "currency": "USD",
    "parts_breakdown": [
      {{"name": "Part A", "cost": 20}},
      {{"name": "Part B", "cost": 15}}
    ],
    "tools_cost": 15,
    "labor_hours_range": {{"min": 1, "max": 2}},
    "assumptions": ["Using typical retail prices", "Assuming basic tools already owned"]
  }},
  "time_estimate": {{
    "prep": 10,
    "active": 30,
    "cure": 0,
    "total": 40,
    "unit": "minutes"
  }},
  "risk_level": "low|medium|high|critical",
  "confidence_score": 85,
  "stop_and_call_pro": false,
  "assumptions": ["assumption 1", "assumption 2"],
  "repair_steps": [...],
  "tools_needed": [{{"name": "...", "required": true, "estimated_cost": 10}}],
  "parts_needed": [{{"name": "...", "price": 20, "required": true, "link": "https://example.com"}}],
  "safety_tips": [...]
}}

**IF NO VISIBLE DAMAGE**, respond with:
{{
  "item_type": "identified item",
  "damage_description": "No visible damage detected",
  "no_visible_damage": true,
  "diagnostic_questions": [
    "What specific problem are you experiencing with this item?",
    "Does the device/item turn on or function at all?",
    "When did you first notice the problem?",
    "Are there any unusual sounds, smells, or behaviors?",
    "Has the item been dropped, exposed to water, or damaged recently?"
  ],
  "repair_difficulty": "unknown",
  "confidence_score": 0,
  "repair_steps": [],
  "tools_needed": [],
  "parts_needed": [],
  "safety_tips": []
}}
"""
        
        msg = UserMessage(
            text=prompt,
            file_contents=[ImageContent(image_base64=image_base64)]
        )
        
        response = await chat.send_message(msg)
        
        # Parse JSON response
        import json
        # Remove markdown code blocks if present
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

async def generate_repair_diagram(item_type: str, repair_steps: List[str]) -> Optional[str]:
    """Generate an infographic using OpenAI gpt-image-1"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        import base64
        
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        # Create a detailed prompt for an informative repair infographic
        steps_text = '\n'.join(f'{i+1}. {step}' for i, step in enumerate(repair_steps[:6]))
        
        prompt = f"""Create a professional repair infographic for {item_type}. 
Style: Clean, modern technical illustration with a white/light background.
Include:
- Title: "{item_type} Repair Guide" at the top
- Visual diagram showing the main components
- Key repair steps illustrated with icons and labels
- Color-coded sections (tools, parts, steps)
- Clear, easy-to-follow visual flow
- Professional layout suitable for printing

Main steps to illustrate:
{steps_text}

The infographic should be informative, visually appealing, and easy to understand at a glance."""
        
        logger.info(f"Generating repair infographic for {item_type}")
        
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Convert bytes to base64 string
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            logger.info(f"Successfully generated infographic for {item_type}")
            return image_base64
        
        return None
        
    except Exception as e:
        logger.error(f"Error generating infographic: {str(e)}")
        return None

# ============ ENDPOINTS ============

@api_router.post("/analyze-repair", response_model=RepairAnalysisResponse)
async def analyze_repair(request: RepairAnalysisRequest):
    """Analyze a broken item and provide repair instructions"""
    try:
        # Analyze the image with skill level, model number, and MIME type
        analysis = await analyze_broken_item(
            request.image_base64, 
            request.language,
            request.skill_level,
            request.model_number,
            request.image_mime_type
        )
        
        # Generate repair ID
        repair_id = str(uuid.uuid4())
        
        # Generate diagram (optional, can be slow)
        diagram_base64 = await generate_repair_diagram(
            analysis.get('item_type', 'item'),
            analysis.get('repair_steps', [])
        )
        
        # Create response
        response = RepairAnalysisResponse(
            repair_id=repair_id,
            item_type=analysis.get('item_type', 'Unknown'),
            damage_description=analysis.get('damage_description', ''),
            repair_difficulty=analysis.get('repair_difficulty', 'medium'),
            estimated_time=analysis.get('estimated_time', 'Unknown'),
            repair_steps=analysis.get('repair_steps', []),
            tools_needed=analysis.get('tools_needed', []),
            parts_needed=analysis.get('parts_needed', []),
            safety_tips=analysis.get('safety_tips', []),
            risk_level=analysis.get('risk_level', 'low'),
            confidence_score=analysis.get('confidence_score', 85),
            stop_and_call_pro=analysis.get('stop_and_call_pro', False),
            assumptions=analysis.get('assumptions', []),
            cost_estimate=analysis.get('cost_estimate'),
            time_estimate=analysis.get('time_estimate'),
            diagram_base64=diagram_base64,
            model_number=request.model_number  # PR #5
        )
        
        # Save to database
        await db.repairs.insert_one(response.dict())
        
        return response
        
    except Exception as e:
        logger.error(f"Error in analyze_repair: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/refine-diagnosis")
async def refine_diagnosis(request: Dict[str, Any]):
    """Refine diagnosis based on user answers to diagnostic questions"""
    try:
        item_type = request.get('item_type', '')
        initial_analysis = request.get('initial_analysis', {})
        diagnostic_answers = request.get('diagnostic_answers', {})
        
        # Build context from diagnostic answers
        answers_text = "\n".join([f"Q{qid}: {answer}" for qid, answer in diagnostic_answers.items()])
        
        # Use AI to refine the diagnosis
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"refine_{uuid.uuid4()}",
            system_message="You are an expert repair technician. Refine the repair diagnosis based on user's answers to diagnostic questions."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Based on the initial analysis and user's diagnostic answers, provide a refined, more accurate diagnosis and repair plan.

Initial Analysis:
Item Type: {item_type}
Damage: {initial_analysis.get('damage_description', 'Unknown')}
Initial Steps: {initial_analysis.get('repair_steps', [])}

User's Diagnostic Answers:
{answers_text}

Please provide:
1. Refined diagnosis (specific problem identified)
2. Updated repair steps (more targeted)
3. Specific parts or tools that are definitely needed
4. Any safety warnings specific to this diagnosis
5. Estimated difficulty and time

Format your response as JSON with these exact keys:
{{
  "refined_diagnosis": "specific problem description",
  "repair_steps": ["step 1", "step 2", ...],
  "tools_needed": ["tool 1", "tool 2", ...],
  "parts_needed": [{{"name": "part name", "link": "amazon link"}}, ...],
  "safety_tips": ["tip 1", "tip 2", ...],
  "repair_difficulty": "easy/medium/hard",
  "estimated_time": "XX-XX minutes",
  "confidence_level": "high/medium/low"
}}"""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        # Parse the response
        import json
        try:
            # Try to extract JSON from the response
            response_text = response if isinstance(response, str) else str(response)
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                refined_data = json.loads(json_str)
            else:
                # Fallback: return initial analysis with refinement note
                refined_data = {
                    **initial_analysis,
                    "refined_diagnosis": f"Based on your answers, the issue is: {response_text[:200]}"
                }
        except:
            # Fallback to initial analysis
            refined_data = {
                **initial_analysis,
                "refined_diagnosis": initial_analysis.get('damage_description', 'Analysis in progress')
            }
        
        # Merge with initial analysis
        refined_data['item_type'] = item_type
        refined_data['repair_id'] = initial_analysis.get('repair_id', str(uuid.uuid4()))
        
        return {"refined_diagnosis": refined_data}
        
    except Exception as e:
        logger.error(f"Error refining diagnosis: {str(e)}")
        # Return initial analysis on error
        return {"refined_diagnosis": request.get('initial_analysis', {})}

@api_router.post("/troubleshoot")
async def troubleshoot(question: TroubleshootQuestion):
    """Interactive troubleshooting based on user responses"""
    try:
        # Get repair details
        repair = await db.repairs.find_one({"repair_id": question.repair_id})
        if not repair:
            raise HTTPException(status_code=404, detail="Repair not found")
        
        # Use AI to provide follow-up guidance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"troubleshoot_{question.repair_id}",
            system_message="You are a helpful repair technician providing troubleshooting guidance."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        context = f"""Item: {repair.get('item_type')}
Damage: {repair.get('damage_description')}
Current Question: {question.question}
User Answer: {question.user_answer}"""
        
        prompt = f"{context}\n\nBased on this answer, provide specific next steps or ask a follow-up question to diagnose the issue better."
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        return {"guidance": response, "follow_up_question": None}
        
    except Exception as e:
        logger.error(f"Error in troubleshooting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/save-repair-session")
async def save_repair_session(session: SaveRepairSession):
    """Save repair session for progress tracking"""
    try:
        session_dict = session.dict()
        session_dict['id'] = str(uuid.uuid4())
        session_dict['updated_at'] = datetime.utcnow()
        
        result = await db.repair_sessions.insert_one(session_dict)
        return {"session_id": session_dict['id'], "message": "Session saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/repair-sessions")
async def get_repair_sessions():
    """Get all saved repair sessions"""
    try:
        sessions = await db.repair_sessions.find().sort("updated_at", -1).to_list(100)
        for session in sessions:
            session['_id'] = str(session['_id'])
        return sessions
        
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/repair-sessions/{session_id}")
async def delete_repair_session(session_id: str):
    """Delete a specific repair session"""
    try:
        result = await db.repair_sessions.delete_one({"repair_id": session_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/repair-sessions")
async def delete_all_repair_sessions():
    """Delete all repair sessions (admin/testing)"""
    try:
        result = await db.repair_sessions.delete_many({})
        return {"message": f"Deleted {result.deleted_count} session(s)"}
        
    except Exception as e:
        logger.error(f"Error deleting sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# PR #8: Repair History & Insights
@api_router.get("/repair-insights")
async def get_repair_insights():
    """Get aggregated insights from repair history"""
    try:
        # Get all repair sessions
        sessions = await db.repair_sessions.find().to_list(1000)
        
        if not sessions:
            return {
                "total_repairs": 0,
                "money_saved": 0,
                "time_invested": 0,
                "completion_rate": 0,
                "most_common_repairs": [],
                "recent_streak": 0,
                "achievements": []
            }
        
        # Calculate statistics
        total_repairs = len(sessions)
        completed_repairs = sum(1 for s in sessions if s.get('status') == 'completed')
        money_saved = 0
        time_invested = 0
        repair_types = {}
        
        for session in sessions:
            # Money saved (use typical cost from cost_estimate)
            if session.get('cost_estimate') and session.get('cost_estimate', {}).get('typical'):
                money_saved += session['cost_estimate']['typical']
            
            # Time invested (use total from time_estimate)
            if session.get('time_estimate') and session.get('time_estimate', {}).get('total'):
                time_invested += session['time_estimate']['total']
            
            # Track repair types
            item_type = session.get('item_type', 'Unknown')
            repair_types[item_type] = repair_types.get(item_type, 0) + 1
        
        # Most common repairs (top 3)
        most_common = sorted(repair_types.items(), key=lambda x: x[1], reverse=True)[:3]
        most_common_repairs = [{"type": k, "count": v} for k, v in most_common]
        
        # Completion rate
        completion_rate = (completed_repairs / total_repairs * 100) if total_repairs > 0 else 0
        
        # Recent streak (repairs in last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_streak = sum(1 for s in sessions 
                          if s.get('updated_at') and s['updated_at'] > thirty_days_ago)
        
        # Achievements
        achievements = []
        if total_repairs >= 1:
            achievements.append({"title": "First Fix", "description": "Completed your first repair", "icon": "trophy"})
        if total_repairs >= 5:
            achievements.append({"title": "DIY Enthusiast", "description": "Completed 5 repairs", "icon": "star"})
        if total_repairs >= 10:
            achievements.append({"title": "Master Fixer", "description": "Completed 10 repairs", "icon": "medal"})
        if money_saved >= 100:
            achievements.append({"title": "Penny Saver", "description": "Saved over $100", "icon": "cash"})
        if money_saved >= 500:
            achievements.append({"title": "Budget Hero", "description": "Saved over $500", "icon": "trending-up"})
        
        return {
            "total_repairs": total_repairs,
            "completed_repairs": completed_repairs,
            "money_saved": round(money_saved, 2),
            "time_invested": round(time_invested, 0),  # in minutes
            "completion_rate": round(completion_rate, 1),
            "most_common_repairs": most_common_repairs,
            "recent_streak": recent_streak,
            "achievements": achievements,
            "currency": "USD"
        }
        
    except Exception as e:
        logger.error(f"Error fetching insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/community/post", response_model=CommunityPost)
async def create_community_post(post: CommunityPost):
    """Create a community post to share repair success"""
    try:
        post_dict = post.dict()
        await db.community_posts.insert_one(post_dict)
        return post
        
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/community/posts")
async def get_community_posts(limit: int = 50):
    """Get community posts"""
    try:
        posts = await db.community_posts.find().sort("timestamp", -1).limit(limit).to_list(limit)
        for post in posts:
            post['_id'] = str(post['_id'])
        return posts
        
    except Exception as e:
        logger.error(f"Error fetching posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/community/like/{post_id}")
async def like_post(post_id: str):
    """Like a community post"""
    try:
        result = await db.community_posts.update_one(
            {"id": post_id},
            {"$inc": {"likes": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"message": "Post liked"}
        
    except Exception as e:
        logger.error(f"Error liking post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# PR #6: Community Moderation Endpoints
@api_router.post("/community/report", response_model=Report)
async def report_post(report: ReportRequest):
    """Report a community post"""
    try:
        # Check if post exists
        post = await db.community_posts.find_one({"id": report.post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Create report
        report_obj = Report(
            post_id=report.post_id,
            reason=report.reason,
            details=report.details,
            reporter_name=report.reporter_name or "Anonymous"
        )
        
        await db.reports.insert_one(report_obj.dict())
        logger.info(f"Post {report.post_id} reported for: {report.reason}")
        
        return report_obj
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reporting post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/community/reports")
async def get_reports(status: Optional[str] = "pending"):
    """Get all reports (admin endpoint)"""
    try:
        query = {"status": status} if status else {}
        reports = await db.reports.find(query).sort("timestamp", -1).to_list(length=100)
        return {"reports": reports}
        
    except Exception as e:
        logger.error(f"Error fetching reports: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/community/moderate/{post_id}")
async def moderate_post(post_id: str, moderation: ModeratePostRequest):
    """Moderate a reported post (admin endpoint)"""
    try:
        if moderation.action == "delete":
            # Delete the post
            result = await db.community_posts.delete_one({"id": post_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Post not found")
            
            # Update all reports for this post
            await db.reports.update_many(
                {"post_id": post_id},
                {"$set": {"status": "resolved"}}
            )
            
            return {"message": "Post deleted successfully"}
            
        elif moderation.action == "approve":
            # Mark reports as reviewed but keep post
            await db.reports.update_many(
                {"post_id": post_id},
                {"$set": {"status": "reviewed"}}
            )
            return {"message": "Post approved, reports marked as reviewed"}
            
        elif moderation.action == "ignore":
            # Just mark as reviewed, no action on post
            await db.reports.update_many(
                {"post_id": post_id},
                {"$set": {"status": "reviewed"}}
            )
            return {"message": "Reports ignored"}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use: delete, approve, or ignore")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moderating post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/community/guidelines")
async def get_community_guidelines():
    """Get community guidelines"""
    guidelines = {
        "title": "Community Guidelines",
        "introduction": "FixIntel AI is a community of repair enthusiasts helping each other. Please follow these guidelines to keep our community safe, helpful, and respectful.",
        "rules": [
            {
                "title": "Be Respectful",
                "description": "Treat all community members with respect. No harassment, hate speech, or personal attacks."
            },
            {
                "title": "Share Real Repairs",
                "description": "Only post genuine repair experiences with actual before/after photos. No fake or misleading content."
            },
            {
                "title": "Safety First",
                "description": "Never post dangerous repair methods. If a repair involves electrical, gas, or structural work, recommend professional help."
            },
            {
                "title": "No Spam",
                "description": "Don't post advertisements, promotional content, or repetitive posts. Share to help, not to sell."
            },
            {
                "title": "Appropriate Content",
                "description": "Keep all content family-friendly. No inappropriate, offensive, or NSFW material."
            },
            {
                "title": "Give Credit",
                "description": "If you used someone else's repair guide or technique, give them credit."
            }
        ],
        "reporting": {
            "title": "Report Violations",
            "description": "If you see content that violates these guidelines, please report it. We review all reports and take appropriate action.",
            "reasons": [
                "Inappropriate content",
                "Spam or advertisements",
                "Dangerous repair advice",
                "Misleading information",
                "Other violations"
            ]
        },
        "consequences": {
            "title": "Consequences",
            "description": "Violations may result in content removal. Repeated violations may lead to account restrictions."
        }
    }
    return guidelines

# Gamification Endpoints
from gamification import (
    calculate_level, check_new_badges, calculate_streak,
    calculate_xp_reward, XP_REWARDS, BADGES
)

@api_router.get("/gamification/profile")
async def get_gamification_profile(user_id: str = "default_user"):
    """Get user's gamification profile"""
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            # Create new profile
            profile = {
                "user_id": user_id,
                "total_xp": 0,
                "level": 1,
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None,
                "badges_earned": [],
                "stats": {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.gamification_profiles.insert_one(profile)
        
        # Calculate level info
        level_info = calculate_level(profile["total_xp"])
        
        # Get all available badges
        all_badges = [
            {
                "id": badge_id,
                "name": badge["name"],
                "description": badge["description"],
                "icon": badge["icon"],
                "earned": badge_id in profile["badges_earned"]
            }
            for badge_id, badge in BADGES.items()
        ]
        
        return {
            **profile,
            "_id": str(profile["_id"]),
            "level_info": level_info,
            "all_badges": all_badges
        }
        
    except Exception as e:
        logger.error(f"Error fetching gamification profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gamification/complete-step")
async def complete_step(request: CompleteStepRequest, user_id: str = "default_user"):
    """Award XP for completing a repair step"""
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            profile = {
                "user_id": user_id,
                "total_xp": 0,
                "level": 1,
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None,
                "badges_earned": [],
                "stats": {"steps_completed": 0},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.gamification_profiles.insert_one(profile)
        
        # Calculate XP reward
        xp_reward = calculate_xp_reward("complete_step")
        new_total_xp = profile["total_xp"] + xp_reward["total_xp"]
        old_level = calculate_level(profile["total_xp"])["level"]
        new_level = calculate_level(new_total_xp)["level"]
        leveled_up = new_level > old_level
        
        # Update streak
        new_streak = calculate_streak(
            profile.get("last_activity_date"),
            profile.get("current_streak", 0)
        )
        longest_streak = max(new_streak, profile.get("longest_streak", 0))
        
        # Update stats
        stats = profile.get("stats", {})
        stats["steps_completed"] = stats.get("steps_completed", 0) + 1
        
        # Check for new badges
        new_badges = check_new_badges(stats, profile.get("badges_earned", []))
        
        # Update profile
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {"$set": {
                "total_xp": new_total_xp,
                "current_streak": new_streak,
                "longest_streak": longest_streak,
                "last_activity_date": datetime.utcnow(),
                "badges_earned": profile.get("badges_earned", []) + [b["id"] for b in new_badges],
                "stats": stats,
                "updated_at": datetime.utcnow()
            }}
        )
        
        level_info = calculate_level(new_total_xp)
        
        return {
            "xp_awarded": xp_reward["total_xp"],
            "bonus_xp": xp_reward["bonus_xp"],
            "bonus_reasons": xp_reward["bonus_reasons"],
            "new_total_xp": new_total_xp,
            "leveled_up": leveled_up,
            "new_level": new_level,
            "level_info": level_info,
            "new_badges": new_badges,
            "current_streak": new_streak
        }
        
    except Exception as e:
        logger.error(f"Error completing step: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gamification/complete-repair")
async def complete_repair(request: CompleteRepairRequest, user_id: str = "default_user"):
    """Award XP for completing an entire repair"""
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            profile = {
                "user_id": user_id,
                "total_xp": 0,
                "level": 1,
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None,
                "badges_earned": [],
                "stats": {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.gamification_profiles.insert_one(profile)
        
        # Determine XP based on difficulty
        action = f"complete_{request.difficulty}_repair"
        
        # Check if this is first repair
        stats = profile.get("stats", {})
        is_first = stats.get("completed_repairs", 0) == 0
        
        # Calculate XP with bonuses
        details = {
            "time_taken_minutes": request.time_taken_minutes,
            "is_first_repair": is_first,
            "completion_percentage": 100
        }
        xp_reward = calculate_xp_reward(action, details)
        
        new_total_xp = profile["total_xp"] + xp_reward["total_xp"]
        old_level = calculate_level(profile["total_xp"])["level"]
        new_level = calculate_level(new_total_xp)["level"]
        leveled_up = new_level > old_level
        
        # Update streak
        new_streak = calculate_streak(
            profile.get("last_activity_date"),
            profile.get("current_streak", 0)
        )
        longest_streak = max(new_streak, profile.get("longest_streak", 0))
        
        # Update stats
        stats["completed_repairs"] = stats.get("completed_repairs", 0) + 1
        stats["total_repairs"] = stats.get("total_repairs", 0) + 1
        stats[f"{request.difficulty}_repairs_completed"] = stats.get(f"{request.difficulty}_repairs_completed", 0) + 1
        stats["fastest_repair_minutes"] = min(request.time_taken_minutes, stats.get("fastest_repair_minutes", 999))
        
        # Track time of day
        current_hour = datetime.utcnow().hour
        if current_hour >= 22 or current_hour < 6:
            stats["late_night_repairs"] = stats.get("late_night_repairs", 0) + 1
        if current_hour < 8:
            stats["early_morning_repairs"] = stats.get("early_morning_repairs", 0) + 1
        
        # Check for new badges
        new_badges = check_new_badges(stats, profile.get("badges_earned", []))
        
        # Update profile
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {"$set": {
                "total_xp": new_total_xp,
                "current_streak": new_streak,
                "longest_streak": longest_streak,
                "last_activity_date": datetime.utcnow(),
                "badges_earned": profile.get("badges_earned", []) + [b["id"] for b in new_badges],
                "stats": stats,
                "updated_at": datetime.utcnow()
            }}
        )
        
        level_info = calculate_level(new_total_xp)
        
        return {
            "xp_awarded": xp_reward["total_xp"],
            "base_xp": xp_reward["base_xp"],
            "bonus_xp": xp_reward["bonus_xp"],
            "bonus_reasons": xp_reward["bonus_reasons"],
            "new_total_xp": new_total_xp,
            "leveled_up": leveled_up,
            "new_level": new_level,
            "level_info": level_info,
            "new_badges": new_badges,
            "current_streak": new_streak,
            "message": f"Amazing! You earned {xp_reward['total_xp']} XP!"
        }
        
    except Exception as e:
        logger.error(f"Error completing repair: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback on repair instructions"""
    try:
        feedback_dict = feedback.dict()
        feedback_dict['id'] = str(uuid.uuid4())
        feedback_dict['timestamp'] = datetime.utcnow()
        
        await db.feedback.insert_one(feedback_dict)
        return {"message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/find-local-vendors")
async def find_local_vendors(search: LocalVendorSearch):
    """Find local vendors using real Google Places API"""
    try:
        import requests
        import os
        
        item_type = search.item_type
        location = search.location
        latitude = search.latitude
        longitude = search.longitude
        
        # Get Google Maps API key from environment
        google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if not google_api_key:
            raise HTTPException(status_code=500, detail="Google Maps API key not configured")
        
        # Build search query based on item type
        search_query = f"{item_type} repair"
        
        # Use Google Places Nearby Search API
        places_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        params = {
            'location': f"{latitude},{longitude}",
            'radius': 8000,  # 8km radius
            'keyword': search_query,
            'key': google_api_key
        }
        
        logger.info(f"Searching Google Places for: {search_query} near {latitude},{longitude}")
        
        response = requests.get(places_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('status') != 'OK':
            logger.error(f"Google Places API error: {data.get('status')} - {data.get('error_message')}")
            # Return empty list instead of failing completely
            return {"vendors": [], "location": location}
        
        places = data.get('results', [])[:5]  # Get top 5 results
        
        vendors = []
        for place in places:
            place_id = place.get('place_id')
            
            # Get detailed place information
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_params = {
                'place_id': place_id,
                'fields': 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry',
                'key': google_api_key
            }
            
            details_response = requests.get(details_url, params=details_params, timeout=10)
            details_data = details_response.json()
            
            if details_data.get('status') == 'OK':
                result = details_data.get('result', {})
                
                # Calculate distance from user location
                place_lat = result.get('geometry', {}).get('location', {}).get('lat')
                place_lng = result.get('geometry', {}).get('location', {}).get('lng')
                
                distance_km = 0
                if place_lat and place_lng:
                    from math import radians, cos, sin, asin, sqrt
                    # Haversine formula
                    lat1, lon1, lat2, lon2 = map(radians, [latitude, longitude, place_lat, place_lng])
                    dlon = lon2 - lon1
                    dlat = lat2 - lat1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a))
                    distance_km = 6371 * c  # Earth radius in km
                
                # Format opening hours
                hours = "Hours not available"
                if result.get('opening_hours', {}).get('weekday_text'):
                    hours = ', '.join(result['opening_hours']['weekday_text'][:2])  # First 2 days
                
                vendor = {
                    "id": place_id,
                    "name": result.get('name', 'Unknown Business'),
                    "specialization": f"{item_type} repair and related services",
                    "address": result.get('formatted_address', ''),
                    "phone": result.get('formatted_phone_number', 'Not available'),
                    "email": None,  # Not provided by Google Places API
                    "rating": result.get('rating', 0),
                    "reviews_count": result.get('user_ratings_total', 0),
                    "distance": f"{distance_km:.1f} km" if distance_km > 0 else "Unknown",
                    "estimated_cost": "$75-$300",  # Generic estimate
                    "hours": hours,
                    "website": result.get('website', None)
                }
                
                vendors.append(vendor)
        
        logger.info(f"Found {len(vendors)} real businesses from Google Places")
        return {"vendors": vendors, "location": location}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Google Places API request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to connect to Google Places API")
    except Exception as e:
        logger.error(f"Error finding vendors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/get-step-details")
async def get_step_details(request: Dict[str, Any]):
    """Get comprehensive step-by-step details with visual diagram and tutorial videos"""
    try:
        step_number = request.get('step_number', 1)
        step_text = request.get('step_text', '')
        item_type = request.get('item_type', 'Unknown')
        repair_type = request.get('repair_type', '')
        
        # Use AI to generate ultra-detailed instructions
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"step_detail_{uuid.uuid4()}",
            system_message="You are an expert repair instructor who provides extremely detailed, beginner-friendly instructions."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Break down this repair step into SIMPLIFIED SUB-STEPS for a complete beginner:

Item: {item_type}
Repair: {repair_type}
Step {step_number}: {step_text}

IMPORTANT: Break this single step into 5-10 smaller, simpler micro-steps that anyone can follow.

Format your response EXACTLY like this:

📋 SUB-STEPS (Simplified Breakdown):
1. [First micro-action - very specific]
2. [Second micro-action - very specific]
3. [Third micro-action - very specific]
... continue until complete

⚠️ SAFETY FIRST:
- [Safety precaution 1]
- [Safety precaution 2]

🔧 WHAT YOU'LL NEED FOR THIS STEP:
- [Specific tool/material 1]
- [Specific tool/material 2]

👀 VISUAL CHECKPOINTS:
- After sub-step 2, you should see: [description]
- After sub-step 4, it should look like: [description]
- When complete, verify: [description]

❌ COMMON MISTAKES TO AVOID:
- [Mistake 1 and why it's bad]
- [Mistake 2 and why it's bad]

💡 PRO TIPS:
- [Helpful tip 1]
- [Helpful tip 2]

⏱️ ESTIMATED TIME: [X-Y minutes]

🆘 IF SOMETHING GOES WRONG:
- Problem: [issue] → Solution: [fix]
- Problem: [issue] → Solution: [fix]

Make every instruction crystal clear - assume the person has never done any repair work before."""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        detailed_instructions = response.strip()
        
        # Search for relevant tutorial videos for this specific step
        step_videos = []
        try:
            video_chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"step_videos_{uuid.uuid4()}",
                system_message="You are an expert at finding specific YouTube repair tutorials."
            )
            video_chat.with_model("gemini", "gemini-2.5-flash")
            
            video_prompt = f"""Find 2-3 REAL YouTube videos that specifically show how to: {step_text}
For item: {item_type}

Look for videos from popular repair channels like:
- ChrisFix, Scotty Kilmer (car repairs)
- iFixit, JerryRigEverything (electronics)
- This Old House, Home RenoVision DIY (home repairs)
- Project Farm (tools)

Return ONLY videos that actually exist with real video IDs.

Format as JSON array:
[
  {{
    "title": "Exact video title",
    "video_id": "11-character YouTube video ID",
    "channel": "Channel name",
    "relevance": "Why this video helps with this specific step"
  }}
]

IMPORTANT: Only include videos you are confident exist on YouTube."""

            video_msg = UserMessage(text=video_prompt)
            video_response = await video_chat.send_message(video_msg)
            
            # Parse video response
            video_text = video_response.strip()
            if video_text.startswith('```'):
                video_text = video_text.split('```')[1]
                if video_text.startswith('json'):
                    video_text = video_text[4:]
            video_text = video_text.strip()
            
            import json
            ai_videos = json.loads(video_text)
            
            for v in ai_videos:
                video_id = v.get('video_id', '')
                if video_id and len(video_id) == 11:
                    step_videos.append({
                        'title': v.get('title', 'Tutorial Video'),
                        'video_id': video_id,
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'thumbnail': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        'channel': v.get('channel', 'YouTube'),
                        'relevance': v.get('relevance', '')
                    })
                    
        except Exception as video_error:
            logger.warning(f"Failed to fetch step videos: {str(video_error)}")
        
        # Generate a helpful diagram/illustration
        try:
            from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
            import base64
            
            image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
            
            # Create a clear, instructional diagram
            image_prompt = f"""Create a clear, simple instructional diagram showing: {step_text} for {item_type} repair.
Style: Technical illustration, clean lines, labeled parts, step-by-step visual guide, educational poster style.
Include: Clear labels, arrows showing direction/sequence, important details highlighted."""
            
            images = await image_gen.generate_images(
                prompt=image_prompt,
                model="gpt-image-1",
                number_of_images=1
            )
            
            image_base64 = None
            if images and len(images) > 0:
                image_base64 = base64.b64encode(images[0]).decode('utf-8')
            
            return {
                "detailed_instructions": detailed_instructions,
                "diagram_image": image_base64,
                "step_number": step_number,
                "tutorial_videos": step_videos
            }
        except Exception as img_error:
            logger.warning(f"Failed to generate diagram: {str(img_error)}")
            # Return instructions without image if generation fails
            return {
                "detailed_instructions": detailed_instructions,
                "diagram_image": None,
                "step_number": step_number,
                "tutorial_videos": step_videos
            }
        
    except Exception as e:
        logger.error(f"Error fetching step details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/get-tutorial-videos")
async def get_tutorial_videos(request: Dict[str, Any]):
    """Search YouTube for real repair tutorial videos"""
    try:
        import requests
        
        item_type = request.get('item_type', 'Unknown')
        damage_description = request.get('damage_description', '')
        model_number = request.get('model_number', '')
        
        # Build search query
        search_query = f"{item_type} repair tutorial"
        if damage_description:
            search_query = f"{item_type} {damage_description} repair DIY"
        if model_number:
            search_query = f"{model_number} {item_type} repair"
        
        # Get YouTube API key (use Google Maps API key which often has YouTube access)
        youtube_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        if youtube_api_key:
            # Try YouTube Data API
            try:
                youtube_url = "https://www.googleapis.com/youtube/v3/search"
                params = {
                    'part': 'snippet',
                    'q': search_query,
                    'type': 'video',
                    'maxResults': 5,
                    'videoDuration': 'medium',  # 4-20 minutes
                    'relevanceLanguage': 'en',
                    'key': youtube_api_key
                }
                
                response = requests.get(youtube_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    videos = []
                    
                    for item in data.get('items', []):
                        video_id = item['id']['videoId']
                        snippet = item['snippet']
                        
                        videos.append({
                            'title': snippet['title'],
                            'description': snippet['description'][:200] + '...' if len(snippet['description']) > 200 else snippet['description'],
                            'video_id': video_id,
                            'url': f"https://www.youtube.com/watch?v={video_id}",
                            'embed_url': f"https://www.youtube.com/embed/{video_id}",
                            'thumbnail': snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
                            'channel': snippet['channelTitle'],
                            'published_at': snippet['publishedAt']
                        })
                    
                    if videos:
                        logger.info(f"Found {len(videos)} YouTube videos for: {search_query}")
                        return {"videos": videos}
                else:
                    logger.warning(f"YouTube API returned status {response.status_code}")
                    
            except Exception as yt_error:
                logger.warning(f"YouTube API error: {str(yt_error)}")
        
        # Fallback: Use AI to generate search-based video suggestions with real video IDs
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"videos_{uuid.uuid4()}",
            system_message="You are an expert at finding YouTube repair tutorials. You have access to search YouTube."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Search YouTube for real repair tutorial videos about: {item_type}
Issue: {damage_description}
{f'Model: {model_number}' if model_number else ''}

Find 4-5 REAL YouTube videos that exist and would help with this repair.
Search for popular DIY repair channels like:
- ChrisFix (car repairs)
- iFixit (electronics)
- This Old House (home repairs)
- Project Farm (tools/testing)
- Dad, how do I? (general repairs)
- Scotty Kilmer (car repairs)
- HVAC School (HVAC repairs)
- Matthias Wandel (woodworking)

Return ONLY videos that actually exist with real video IDs.

Format as JSON array:
[
  {{
    "title": "Exact video title from YouTube",
    "description": "Brief description of what the video teaches",
    "video_id": "the 11-character YouTube video ID",
    "channel": "Channel name",
    "duration": "estimated duration like 12:45"
  }}
]

IMPORTANT: Only include videos you are confident actually exist on YouTube."""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        # Parse JSON response
        import json
        response_text = response.strip()
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        ai_videos = json.loads(response_text)
        
        # Format the videos with proper URLs
        videos = []
        for v in ai_videos:
            video_id = v.get('video_id', '')
            if video_id and len(video_id) == 11:  # Valid YouTube video ID
                videos.append({
                    'title': v.get('title', 'Repair Tutorial'),
                    'description': v.get('description', ''),
                    'video_id': video_id,
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'embed_url': f"https://www.youtube.com/embed/{video_id}",
                    'thumbnail': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    'channel': v.get('channel', 'YouTube'),
                    'duration': v.get('duration', '')
                })
        
        return {"videos": videos}
        
    except Exception as e:
        logger.error(f"Error fetching tutorial videos: {str(e)}")
        return {"videos": []}  # Return empty array instead of failing

@api_router.post("/search-parts")
async def search_parts(request: Dict[str, Any]):
    """Search for real parts with actual purchase links using web search"""
    try:
        import requests
        
        item_type = request.get('item_type', '')
        parts_needed = request.get('parts_needed', [])
        model_number = request.get('model_number', '')
        
        if not parts_needed:
            return {"parts": []}
        
        enhanced_parts = []
        
        for part in parts_needed:
            part_name = part.get('name', '') if isinstance(part, dict) else str(part)
            
            if not part_name:
                continue
            
            # Build search query with model number if available
            search_query = f"{part_name} {item_type}"
            if model_number:
                search_query = f"{part_name} {model_number} {item_type}"
            search_query += " buy price"
            
            # Use AI to search and find real product links
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"parts_search_{uuid.uuid4()}",
                system_message="You are a helpful assistant that finds real product listings for repair parts."
            )
            chat.with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Search for this repair part and provide REAL purchase options:

Part needed: {part_name}
Item being repaired: {item_type}
{f'Model number: {model_number}' if model_number else ''}

Provide 2-3 REAL places to buy this part with actual store names. Format as JSON:
{{
  "part_name": "{part_name}",
  "search_term": "recommended search term for this part",
  "estimated_price_range": "$X - $Y",
  "where_to_buy": [
    {{
      "store": "Store Name (e.g., Amazon, Home Depot, AutoZone, iFixit, eBay)",
      "search_url": "direct search URL for this part on that store",
      "notes": "any helpful notes about buying from this store"
    }}
  ],
  "tips": "tips for finding the right part",
  "alternative_names": ["other names this part might be called"]
}}

IMPORTANT: 
- Use REAL store names and create actual search URLs
- For Amazon: https://www.amazon.com/s?k=SEARCH+TERMS
- For Home Depot: https://www.homedepot.com/s/SEARCH+TERMS
- For AutoZone: https://www.autozone.com/searchresult?searchText=SEARCH+TERMS
- For iFixit: https://www.ifixit.com/Search?query=SEARCH+TERMS
- For eBay: https://www.ebay.com/sch/i.html?_nkw=SEARCH+TERMS
- Replace spaces with + in URLs"""

            msg = UserMessage(text=prompt)
            response = await chat.send_message(msg)
            
            # Parse the response
            response_text = response.strip()
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            try:
                import json
                part_info = json.loads(response_text)
                enhanced_parts.append(part_info)
            except json.JSONDecodeError:
                # If JSON parsing fails, create a basic entry
                enhanced_parts.append({
                    "part_name": part_name,
                    "search_term": f"{part_name} {item_type}",
                    "estimated_price_range": part.get('price', 'Varies') if isinstance(part, dict) else 'Varies',
                    "where_to_buy": [
                        {
                            "store": "Amazon",
                            "search_url": f"https://www.amazon.com/s?k={part_name.replace(' ', '+')}+{item_type.replace(' ', '+')}",
                            "notes": "Wide selection, check reviews"
                        },
                        {
                            "store": "eBay",
                            "search_url": f"https://www.ebay.com/sch/i.html?_nkw={part_name.replace(' ', '+')}+{item_type.replace(' ', '+')}",
                            "notes": "Good for used/refurbished parts"
                        }
                    ],
                    "tips": "Compare prices across multiple stores",
                    "alternative_names": []
                })
        
        return {"parts": enhanced_parts}
        
    except Exception as e:
        logger.error(f"Error searching for parts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ GAMIFICATION SYSTEM ============

# Rank definitions
RANKS = [
    {"name": "Novice Fixer", "min_xp": 0, "badge": "🔰", "color": "#9CA3AF"},
    {"name": "Apprentice", "min_xp": 100, "badge": "🔧", "color": "#60A5FA"},
    {"name": "Handyman", "min_xp": 300, "badge": "🛠️", "color": "#34D399"},
    {"name": "Skilled Repairer", "min_xp": 600, "badge": "⚙️", "color": "#FBBF24"},
    {"name": "Expert Technician", "min_xp": 1000, "badge": "🏆", "color": "#F97316"},
    {"name": "Master Craftsman", "min_xp": 2000, "badge": "👑", "color": "#A855F7"},
    {"name": "Repair Legend", "min_xp": 5000, "badge": "⭐", "color": "#EF4444"},
]

# Achievement definitions
ACHIEVEMENTS = [
    {"id": "first_repair", "name": "First Fix", "description": "Complete your first repair", "xp": 50, "badge": "🎉"},
    {"id": "five_repairs", "name": "Getting Handy", "description": "Complete 5 repairs", "xp": 100, "badge": "✋"},
    {"id": "ten_repairs", "name": "Repair Enthusiast", "description": "Complete 10 repairs", "xp": 200, "badge": "🔥"},
    {"id": "twenty_five_repairs", "name": "Fix-It Pro", "description": "Complete 25 repairs", "xp": 500, "badge": "💪"},
    {"id": "fifty_repairs", "name": "Repair Master", "description": "Complete 50 repairs", "xp": 1000, "badge": "🏅"},
    {"id": "first_electronics", "name": "Tech Savvy", "description": "Repair an electronic device", "xp": 75, "badge": "📱"},
    {"id": "first_appliance", "name": "Appliance Whisperer", "description": "Repair a home appliance", "xp": 75, "badge": "🏠"},
    {"id": "first_auto", "name": "Grease Monkey", "description": "Complete an automotive repair", "xp": 75, "badge": "🚗"},
    {"id": "streak_3", "name": "On a Roll", "description": "Complete repairs 3 days in a row", "xp": 100, "badge": "📅"},
    {"id": "streak_7", "name": "Week Warrior", "description": "Complete repairs 7 days in a row", "xp": 250, "badge": "🗓️"},
    {"id": "speed_demon", "name": "Speed Demon", "description": "Complete a repair in under 30 minutes", "xp": 75, "badge": "⚡"},
    {"id": "perfectionist", "name": "Perfectionist", "description": "Complete all steps in a repair", "xp": 50, "badge": "✨"},
]

def get_rank_for_xp(xp: int) -> dict:
    """Get the rank for a given XP amount"""
    current_rank = RANKS[0]
    for rank in RANKS:
        if xp >= rank["min_xp"]:
            current_rank = rank
    return current_rank

def get_next_rank(xp: int) -> dict:
    """Get the next rank and XP needed"""
    for i, rank in enumerate(RANKS):
        if xp < rank["min_xp"]:
            return {"rank": rank, "xp_needed": rank["min_xp"] - xp}
    return None  # Max rank reached

@api_router.get("/gamification/profile")
async def get_gamification_profile(user_id: str = "default_user"):
    """Get user's gamification profile"""
    try:
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            # Create default profile
            profile = {
                "user_id": user_id,
                "xp": 0,
                "total_repairs_completed": 0,
                "total_steps_completed": 0,
                "achievements": [],
                "current_streak": 0,
                "longest_streak": 0,
                "last_repair_date": None,
                "repairs_by_category": {},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db.gamification_profiles.insert_one(profile)
        
        # Calculate rank info
        current_rank = get_rank_for_xp(profile.get("xp", 0))
        next_rank_info = get_next_rank(profile.get("xp", 0))
        
        return {
            "user_id": user_id,
            "xp": profile.get("xp", 0),
            "rank": current_rank,
            "next_rank": next_rank_info,
            "total_repairs_completed": profile.get("total_repairs_completed", 0),
            "total_steps_completed": profile.get("total_steps_completed", 0),
            "achievements": profile.get("achievements", []),
            "current_streak": profile.get("current_streak", 0),
            "longest_streak": profile.get("longest_streak", 0),
            "repairs_by_category": profile.get("repairs_by_category", {}),
            "all_ranks": RANKS,
            "all_achievements": ACHIEVEMENTS
        }
    except Exception as e:
        logger.error(f"Error getting gamification profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gamification/complete-step")
async def complete_step(request: Dict[str, Any]):
    """Award XP for completing a repair step"""
    try:
        user_id = request.get("user_id", "default_user")
        repair_id = request.get("repair_id")
        step_number = request.get("step_number")
        
        # Base XP for completing a step
        xp_earned = 10
        
        # Get or create profile
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        if not profile:
            profile = {
                "user_id": user_id,
                "xp": 0,
                "total_repairs_completed": 0,
                "total_steps_completed": 0,
                "achievements": [],
                "current_streak": 0,
                "longest_streak": 0,
                "repairs_by_category": {},
                "completed_steps": []
            }
        
        # Check if step already completed
        completed_steps = profile.get("completed_steps", [])
        step_key = f"{repair_id}_{step_number}"
        if step_key in completed_steps:
            return {"message": "Step already completed", "xp_earned": 0}
        
        # Update profile
        completed_steps.append(step_key)
        new_xp = profile.get("xp", 0) + xp_earned
        new_steps = profile.get("total_steps_completed", 0) + 1
        
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "xp": new_xp,
                    "total_steps_completed": new_steps,
                    "completed_steps": completed_steps,
                    "updated_at": datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )
        
        # Check for rank up
        old_rank = get_rank_for_xp(profile.get("xp", 0))
        new_rank = get_rank_for_xp(new_xp)
        ranked_up = old_rank["name"] != new_rank["name"]
        
        return {
            "xp_earned": xp_earned,
            "total_xp": new_xp,
            "total_steps_completed": new_steps,
            "ranked_up": ranked_up,
            "new_rank": new_rank if ranked_up else None
        }
    except Exception as e:
        logger.error(f"Error completing step: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gamification/complete-repair")
async def complete_repair(request: Dict[str, Any]):
    """Award XP and check achievements for completing a repair"""
    try:
        user_id = request.get("user_id", "default_user")
        repair_id = request.get("repair_id")
        item_type = request.get("item_type", "").lower()
        total_steps = request.get("total_steps", 0)
        time_taken_minutes = request.get("time_taken_minutes", 0)
        
        # Base XP for completing a repair
        xp_earned = 50
        
        # Bonus XP based on complexity (steps)
        if total_steps >= 10:
            xp_earned += 50  # Complex repair bonus
        elif total_steps >= 5:
            xp_earned += 25  # Medium repair bonus
        
        # Speed bonus
        if time_taken_minutes > 0 and time_taken_minutes < 30:
            xp_earned += 25  # Speed bonus
        
        # Get profile
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        if not profile:
            profile = {
                "user_id": user_id,
                "xp": 0,
                "total_repairs_completed": 0,
                "total_steps_completed": 0,
                "achievements": [],
                "current_streak": 0,
                "longest_streak": 0,
                "repairs_by_category": {},
                "last_repair_date": None
            }
        
        # Update repair count
        new_repair_count = profile.get("total_repairs_completed", 0) + 1
        
        # Update category counts
        repairs_by_category = profile.get("repairs_by_category", {})
        category = "other"
        if any(word in item_type for word in ["phone", "tablet", "computer", "laptop", "tv", "electronic"]):
            category = "electronics"
        elif any(word in item_type for word in ["car", "truck", "auto", "vehicle", "motorcycle"]):
            category = "automotive"
        elif any(word in item_type for word in ["washer", "dryer", "refrigerator", "dishwasher", "oven", "appliance"]):
            category = "appliance"
        elif any(word in item_type for word in ["furniture", "chair", "table", "desk"]):
            category = "furniture"
        
        repairs_by_category[category] = repairs_by_category.get(category, 0) + 1
        
        # Check streak
        current_streak = profile.get("current_streak", 0)
        longest_streak = profile.get("longest_streak", 0)
        last_repair_date = profile.get("last_repair_date")
        today = datetime.utcnow().date().isoformat()
        
        if last_repair_date:
            last_date = datetime.fromisoformat(last_repair_date).date()
            days_diff = (datetime.utcnow().date() - last_date).days
            if days_diff == 1:
                current_streak += 1
            elif days_diff > 1:
                current_streak = 1
            # Same day doesn't increase streak
        else:
            current_streak = 1
        
        longest_streak = max(longest_streak, current_streak)
        
        # Check achievements
        new_achievements = []
        existing_achievements = [a["id"] for a in profile.get("achievements", [])]
        
        # First repair
        if new_repair_count == 1 and "first_repair" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "first_repair"))
            xp_earned += 50
        
        # Repair count achievements
        if new_repair_count >= 5 and "five_repairs" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "five_repairs"))
            xp_earned += 100
        if new_repair_count >= 10 and "ten_repairs" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "ten_repairs"))
            xp_earned += 200
        if new_repair_count >= 25 and "twenty_five_repairs" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "twenty_five_repairs"))
            xp_earned += 500
        if new_repair_count >= 50 and "fifty_repairs" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "fifty_repairs"))
            xp_earned += 1000
        
        # Category achievements
        if category == "electronics" and repairs_by_category.get("electronics", 0) == 1 and "first_electronics" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "first_electronics"))
            xp_earned += 75
        if category == "appliance" and repairs_by_category.get("appliance", 0) == 1 and "first_appliance" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "first_appliance"))
            xp_earned += 75
        if category == "automotive" and repairs_by_category.get("automotive", 0) == 1 and "first_auto" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "first_auto"))
            xp_earned += 75
        
        # Streak achievements
        if current_streak >= 3 and "streak_3" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "streak_3"))
            xp_earned += 100
        if current_streak >= 7 and "streak_7" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "streak_7"))
            xp_earned += 250
        
        # Speed achievement
        if time_taken_minutes > 0 and time_taken_minutes < 30 and "speed_demon" not in existing_achievements:
            new_achievements.append(next(a for a in ACHIEVEMENTS if a["id"] == "speed_demon"))
            xp_earned += 75
        
        # Calculate new XP
        new_xp = profile.get("xp", 0) + xp_earned
        
        # Update profile
        all_achievements = profile.get("achievements", []) + new_achievements
        
        await db.gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "xp": new_xp,
                    "total_repairs_completed": new_repair_count,
                    "achievements": all_achievements,
                    "current_streak": current_streak,
                    "longest_streak": longest_streak,
                    "last_repair_date": today,
                    "repairs_by_category": repairs_by_category,
                    "updated_at": datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )
        
        # Check for rank up
        old_rank = get_rank_for_xp(profile.get("xp", 0))
        new_rank = get_rank_for_xp(new_xp)
        ranked_up = old_rank["name"] != new_rank["name"]
        
        return {
            "xp_earned": xp_earned,
            "total_xp": new_xp,
            "total_repairs_completed": new_repair_count,
            "current_streak": current_streak,
            "new_achievements": new_achievements,
            "ranked_up": ranked_up,
            "new_rank": new_rank if ranked_up else None,
            "current_rank": get_rank_for_xp(new_xp)
        }
    except Exception as e:
        logger.error(f"Error completing repair: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get top users by XP"""
    try:
        cursor = db.gamification_profiles.find().sort("xp", -1).limit(limit)
        leaders = []
        async for profile in cursor:
            rank = get_rank_for_xp(profile.get("xp", 0))
            leaders.append({
                "user_id": profile.get("user_id"),
                "xp": profile.get("xp", 0),
                "rank": rank,
                "total_repairs": profile.get("total_repairs_completed", 0),
                "achievements_count": len(profile.get("achievements", []))
            })
        return {"leaderboard": leaders}
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/")
async def root():
    return {"message": "FixIt Pro API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
