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
    language: str = "en"
    skill_level: Optional[str] = "diy"  # beginner, diy, pro

class RepairAnalysisResponse(BaseModel):
    repair_id: str
    item_type: str
    damage_description: str
    repair_difficulty: str  # easy, medium, hard
    estimated_time: str
    repair_steps: List[str]
    tools_needed: List[str]
    parts_needed: List[Dict[str, str]]  # [{"name": "...", "link": "..."}]
    safety_tips: List[str]
    risk_level: Optional[str] = "low"  # low, medium, high, critical
    confidence_score: Optional[int] = 85  # 0-100
    stop_and_call_pro: Optional[bool] = False
    assumptions: Optional[List[str]] = []
    diagram_base64: Optional[str] = None
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

async def analyze_broken_item(image_base64: str, language: str = "en", skill_level: str = "diy") -> Dict[str, Any]:
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
            system_message=f"You are an expert repair technician who can identify broken items and provide detailed repair instructions. {skill_prompt}"
        )
        
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""
Analyze this image of a broken item and provide a detailed repair analysis in {language}.

USER SKILL LEVEL: {skill_level.upper()}
{skill_prompt}

CRITICAL SAFETY ASSESSMENT:
- Detect if repair involves: ELECTRICAL work, GAS systems, HVAC, STRUCTURAL repairs, or HIGH-RISK scenarios
- Assess your CONFIDENCE level (0-100) in the diagnosis
- If confidence < 70% OR high-risk category detected, set stop_and_call_pro = true

Please provide:
1. Item Type (e.g., 'Smartphone', 'Chair', 'Laptop', etc.)
2. Damage Description (what's broken)
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
10. Step-by-step Repair Instructions (adapt detail level to skill level)
11. Tools Needed (list with prices - consider skill level for tool assumptions)
12. Parts Needed (list with estimated prices and specifications)
13. Safety Tips (list - CRITICAL warnings for high-risk repairs)

RISK LEVEL GUIDELINES:
- LOW: Cosmetic repairs, simple replacements, no power/gas involved
- MEDIUM: Requires tools, some technical skill, minor risks
- HIGH: Complex repairs, potential for injury, requires expertise
- CRITICAL: ELECTRICAL/GAS/STRUCTURAL - ALWAYS recommend professional

Format your response as JSON with these exact keys:
{{
  "item_type": "...",
  "damage_description": "...",
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
    "prep_minutes": 10,
    "active_minutes": 30,
    "cure_minutes": 0,
    "total_minutes": 40
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
"""
        
        msg = UserMessage(
            text=prompt,
            file_contents=[ImageContent(image_base64)]
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
    """Generate a diagram using Gemini image generation"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"diagram_{uuid.uuid4()}",
            system_message="You are a technical illustrator."
        )
        
        chat.with_model("gemini", "gemini-2.5-flash-image-preview").with_params(modalities=["image", "text"])
        
        prompt = f"""Create a clear, simple technical diagram showing how to repair a {item_type}. 
The diagram should illustrate these repair steps:
{', '.join(repair_steps[:3])}

Style: Clean, professional technical illustration with labels and arrows."""
        
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            return images[0]['data']  # Return base64 image data
        return None
        
    except Exception as e:
        logger.warning(f"Failed to generate diagram: {str(e)}")
        return None

# ============ ENDPOINTS ============

@api_router.post("/analyze-repair", response_model=RepairAnalysisResponse)
async def analyze_repair(request: RepairAnalysisRequest):
    """Analyze a broken item and provide repair instructions"""
    try:
        # Analyze the image with skill level
        analysis = await analyze_broken_item(
            request.image_base64, 
            request.language,
            request.skill_level
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
            diagram_base64=diagram_base64
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

@api_router.post("/get-step-details")
async def get_step_details(request: dict):
    """Get detailed explanation for a specific repair step"""
    try:
        item_type = request.get('item_type')
        step_text = request.get('step_text')
        step_number = request.get('step_number')
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"step_detail_{uuid.uuid4()}",
            system_message="You are a helpful repair technician providing detailed step-by-step guidance."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Provide a very detailed explanation for this repair step on a {item_type}:

Step {step_number}: {step_text}

Please provide:
1. **What to do**: Detailed instructions with specific actions
2. **Why it's important**: Explanation of why this step matters
3. **Common mistakes**: What to avoid
4. **Tips & tricks**: Pro tips to make it easier
5. **Tools/materials for this step**: What you specifically need
6. **Estimated time**: How long this step should take
7. **Warning signs**: What indicates you're doing it wrong

Format as a clear, easy-to-follow guide."""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        return {
            "step_number": step_number,
            "step_text": step_text,
            "detailed_explanation": response
        }
        
    except Exception as e:
        logger.error(f"Error getting step details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/find-local-vendors")
async def find_local_vendors(search: LocalVendorSearch):
    """Find local repair vendors specializing in the item type"""
    try:
        # Use AI to generate realistic local vendors based on item type and location
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"vendor_search_{uuid.uuid4()}",
            system_message="You are a local business directory assistant."
        )
        chat.with_model("gemini", "gemini-2.5-flash")
        
        prompt = f"""Generate a list of 5 realistic local repair shops that specialize in fixing {search.item_type} in {search.location}.

For each vendor, provide:
1. Business name (realistic, professional)
2. Specialization (what they repair)
3. Full address
4. Phone number (format: (XXX) XXX-XXXX)
5. Email address (professional format: info@businessname.com or contact@businessname.com)
6. Rating (1-5, realistic decimal)
7. Number of reviews
8. Distance from location (in miles)
9. Estimated repair cost range
10. Business hours
11. Website (optional)

Format response as JSON array:
[
  {{
    "name": "...",
    "specialization": "...",
    "address": "...",
    "phone": "...",
    "email": "info@example.com",
    "rating": 4.5,
    "reviews_count": 123,
    "distance": "2.3 miles",
    "estimated_cost": "$50-$150",
    "hours": "Mon-Fri 9AM-6PM, Sat 10AM-4PM",
    "website": "https://..."
  }}
]"""
        
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
        
        vendors_data = json.loads(response_text)
        
        # Convert to LocalVendor models
        vendors = []
        for vendor_dict in vendors_data:
            vendor = LocalVendor(
                name=vendor_dict.get('name', ''),
                specialization=vendor_dict.get('specialization', ''),
                address=vendor_dict.get('address', ''),
                phone=vendor_dict.get('phone', ''),
                email=vendor_dict.get('email'),
                rating=vendor_dict.get('rating', 4.0),
                reviews_count=vendor_dict.get('reviews_count', 0),
                distance=vendor_dict.get('distance', 'Unknown'),
                estimated_cost=vendor_dict.get('estimated_cost', 'Call for quote'),
                hours=vendor_dict.get('hours', 'Call for hours'),
                website=vendor_dict.get('website')
            )
            vendors.append(vendor)
        
        return {"vendors": [v.dict() for v in vendors], "location": search.location}
        
    except Exception as e:
        logger.error(f"Error finding vendors: {str(e)}")
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
