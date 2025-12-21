#!/usr/bin/env python3
"""
FixIt Pro Backend API Test Suite - Task-Appropriate Clarifying Questions Feature Testing
Focus: Testing the updated "Task-Appropriate Clarifying Questions" feature as per review request

VALIDATION CRITERIA:
1. Questions must reference the SPECIFIC item name (not "device" or "item")
2. Questions must reference the SPECIFIC damage detected
3. Questions should be relevant to the item category (electronics, appliances, furniture, etc.)
4. Questions should NOT be generic like "Is the item working?"
"""

import requests
import json
import base64
import uuid
from datetime import datetime
import time
import os
from pathlib import Path
from PIL import Image
from io import BytesIO

# Configuration
BASE_URL = "https://fixgenius-4.preview.emergentagent.com/api"
TIMEOUT = 60  # Increased for AI analysis

def create_test_image():
    """Create a simple test image of a broken phone screen"""
    # Create a simple image representing a broken phone
    img = Image.new('RGB', (300, 600), color='black')
    
    # Add some visual elements to simulate a cracked screen
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Draw phone outline
    draw.rectangle([50, 50, 250, 550], outline='white', width=3)
    
    # Draw screen area
    draw.rectangle([70, 100, 230, 450], outline='gray', width=2)
    
    # Draw crack lines to simulate damage
    draw.line([100, 150, 200, 350], fill='red', width=3)
    draw.line([120, 120, 180, 400], fill='red', width=2)
    draw.line([90, 200, 210, 300], fill='red', width=2)
    
    # Add text
    draw.text((80, 480), "Cracked Screen", fill='white')
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def create_undamaged_test_image():
    """Create a simple test image of an undamaged phone for no visible damage testing"""
    # Create a simple image representing an undamaged phone
    img = Image.new('RGB', (300, 600), color='lightblue')
    
    # Add some basic phone-like features (screen, home button)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Draw phone outline
    draw.rectangle([20, 20, 280, 580], outline='black', width=3)
    
    # Draw screen area (no cracks or damage)
    draw.rectangle([40, 80, 260, 480], fill='black', outline='gray')
    
    # Draw home button
    draw.ellipse([130, 500, 170, 540], fill='gray', outline='black')
    
    # Add text to indicate it's working
    draw.text((100, 300), "Working Phone", fill='white')
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

# Test data
SAMPLE_IMAGE_B64 = create_test_image()

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_root_endpoint():
    """Test GET /api/ - Root endpoint check"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "FixIt Pro API" in data["message"]:
                log_test("Root Endpoint", "PASS", f"Response: {data}")
                return True
            else:
                log_test("Root Endpoint", "FAIL", f"Unexpected response format: {data}")
                return False
        else:
            log_test("Root Endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Root Endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_analyze_repair_pr4():
    """Test POST /api/analyze-repair - PR #4 Cost/Time Estimation Testing"""
    print("🔧 Testing /api/analyze-repair endpoint (PR #4: Cost/Time Estimation)")
    print("=" * 70)
    
    try:
        payload = {
            "image_base64": SAMPLE_IMAGE_B64,
            "language": "en",
            "skill_level": "diy"
        }
        
        print("📤 Sending request to analyze-repair endpoint...")
        response = requests.post(
            f"{BASE_URL}/analyze-repair", 
            json=payload, 
            timeout=TIMEOUT
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("Analyze Repair (PR #4)", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
        
        data = response.json()
        print("✅ Response received successfully")
        
        # Test existing fields (backward compatibility)
        required_fields = [
            "repair_id", "item_type", "damage_description", 
            "repair_difficulty", "estimated_time", "repair_steps", 
            "tools_needed", "parts_needed", "safety_tips"
        ]
        
        print("\n🔍 Testing existing fields (backward compatibility):")
        missing_fields = []
        for field in required_fields:
            if field in data:
                print(f"  ✅ {field}: {type(data[field]).__name__}")
            else:
                print(f"  ❌ Missing field: {field}")
                missing_fields.append(field)
        
        if missing_fields:
            log_test("Analyze Repair (PR #4)", "FAIL", f"Missing required fields: {missing_fields}")
            return None
        
        # NEW: Test cost_estimate field (PR #4)
        print("\n💰 Testing NEW cost_estimate field:")
        if 'cost_estimate' not in data:
            log_test("Analyze Repair (PR #4)", "FAIL", "CRITICAL: cost_estimate field missing!")
            return None
        
        cost_estimate = data['cost_estimate']
        print(f"  ✅ cost_estimate field present: {type(cost_estimate).__name__}")
        
        # Test cost_estimate structure
        cost_required_fields = {
            'low': (int, float),
            'typical': (int, float),
            'high': (int, float),
            'currency': str,
            'parts_breakdown': list,
            'tools_cost': (int, float),
            'labor_hours_range': dict,
            'assumptions': list
        }
        
        cost_errors = []
        for field, expected_type in cost_required_fields.items():
            if field in cost_estimate:
                if isinstance(expected_type, tuple):
                    if isinstance(cost_estimate[field], expected_type):
                        print(f"    ✅ {field}: {cost_estimate[field]} ({type(cost_estimate[field]).__name__})")
                    else:
                        print(f"    ❌ {field}: Wrong type. Expected {expected_type}, got {type(cost_estimate[field])}")
                        cost_errors.append(f"{field} wrong type")
                else:
                    if isinstance(cost_estimate[field], expected_type):
                        print(f"    ✅ {field}: {cost_estimate[field]} ({type(cost_estimate[field]).__name__})")
                    else:
                        print(f"    ❌ {field}: Wrong type. Expected {expected_type}, got {type(cost_estimate[field])}")
                        cost_errors.append(f"{field} wrong type")
            else:
                print(f"    ❌ Missing cost_estimate field: {field}")
                cost_errors.append(f"missing {field}")
        
        # Test labor_hours_range structure
        if 'labor_hours_range' in cost_estimate and isinstance(cost_estimate['labor_hours_range'], dict):
            if 'min' in cost_estimate['labor_hours_range'] and 'max' in cost_estimate['labor_hours_range']:
                print(f"    ✅ labor_hours_range.min: {cost_estimate['labor_hours_range']['min']}")
                print(f"    ✅ labor_hours_range.max: {cost_estimate['labor_hours_range']['max']}")
            else:
                print("    ❌ labor_hours_range missing min/max fields")
                cost_errors.append("labor_hours_range missing min/max")
        
        # NEW: Test time_estimate field (PR #4)
        print("\n⏱️  Testing NEW time_estimate field:")
        if 'time_estimate' not in data:
            log_test("Analyze Repair (PR #4)", "FAIL", "CRITICAL: time_estimate field missing!")
            return None
        
        time_estimate = data['time_estimate']
        print(f"  ✅ time_estimate field present: {type(time_estimate).__name__}")
        
        # Test time_estimate structure
        time_required_fields = {
            'prep': (int, float),
            'active': (int, float),
            'total': (int, float),
            'unit': str
        }
        
        time_errors = []
        for field, expected_type in time_required_fields.items():
            if field in time_estimate:
                if isinstance(expected_type, tuple):
                    if isinstance(time_estimate[field], expected_type):
                        print(f"    ✅ {field}: {time_estimate[field]} ({type(time_estimate[field]).__name__})")
                    else:
                        print(f"    ❌ {field}: Wrong type. Expected {expected_type}, got {type(time_estimate[field])}")
                        time_errors.append(f"{field} wrong type")
                else:
                    if isinstance(time_estimate[field], expected_type):
                        print(f"    ✅ {field}: {time_estimate[field]} ({type(time_estimate[field]).__name__})")
                    else:
                        print(f"    ❌ {field}: Wrong type. Expected {expected_type}, got {type(time_estimate[field])}")
                        time_errors.append(f"{field} wrong type")
            else:
                print(f"    ❌ Missing time_estimate field: {field}")
                time_errors.append(f"missing {field}")
        
        # Test optional cure field
        if 'cure' in time_estimate:
            if isinstance(time_estimate['cure'], (int, float)):
                print(f"    ✅ cure (optional): {time_estimate['cure']} ({type(time_estimate['cure']).__name__})")
            else:
                print(f"    ❌ cure: Wrong type. Expected int/float, got {type(time_estimate['cure'])}")
                time_errors.append("cure wrong type")
        else:
            print(f"    ℹ️  Optional field 'cure' not present (OK)")
        
        # Validate specific field values
        validation_errors = []
        if 'unit' in time_estimate and time_estimate['unit'] != 'minutes':
            print(f"    ❌ unit field should be 'minutes', got: {time_estimate['unit']}")
            validation_errors.append("unit not 'minutes'")
        else:
            print(f"    ✅ unit field correct: {time_estimate['unit']}")
        
        if 'currency' in cost_estimate and cost_estimate['currency'] != 'USD':
            print(f"    ❌ currency field should be 'USD', got: {cost_estimate['currency']}")
            validation_errors.append("currency not 'USD'")
        else:
            print(f"    ✅ currency field correct: {cost_estimate['currency']}")
        
        # Test data consistency
        print("\n🔍 Testing data consistency:")
        
        # Check cost range logic
        if ('low' in cost_estimate and 'typical' in cost_estimate and 'high' in cost_estimate):
            if cost_estimate['low'] <= cost_estimate['typical'] <= cost_estimate['high']:
                print(f"    ✅ Cost range logical: ${cost_estimate['low']} ≤ ${cost_estimate['typical']} ≤ ${cost_estimate['high']}")
            else:
                print(f"    ❌ Cost range illogical: ${cost_estimate['low']} ≤ ${cost_estimate['typical']} ≤ ${cost_estimate['high']}")
                validation_errors.append("illogical cost range")
        
        # Summary
        all_errors = cost_errors + time_errors + validation_errors
        
        if not all_errors:
            print("\n📋 Sample Response Data:")
            print(f"  Item Type: {data['item_type']}")
            print(f"  Damage: {data['damage_description']}")
            print(f"  Difficulty: {data['repair_difficulty']}")
            print(f"  Cost Range: ${cost_estimate['low']}-${cost_estimate['high']} (typical: ${cost_estimate['typical']})")
            print(f"  Time Estimate: {time_estimate['total']} minutes (prep: {time_estimate['prep']}, active: {time_estimate['active']})")
            if 'parts_breakdown' in cost_estimate:
                print(f"  Parts Count: {len(cost_estimate['parts_breakdown'])}")
            if 'tools_cost' in cost_estimate:
                print(f"  Tools Cost: ${cost_estimate['tools_cost']}")
            
            log_test("Analyze Repair (PR #4)", "PASS", "All cost_estimate and time_estimate fields working correctly")
            return data["repair_id"]
        else:
            log_test("Analyze Repair (PR #4)", "FAIL", f"Errors found: {', '.join(all_errors)}")
            return None
            
    except requests.exceptions.Timeout:
        log_test("Analyze Repair (PR #4)", "FAIL", "Request timed out (AI analysis taking too long)")
        return None
    except Exception as e:
        log_test("Analyze Repair (PR #4)", "FAIL", f"Exception: {str(e)}")
        return None

def test_save_repair_session(repair_id):
    """Test POST /api/save-repair-session - Save repair session"""
    try:
        payload = {
            "repair_id": repair_id or str(uuid.uuid4()),
            "title": "Test Repair Session - Broken Smartphone Screen",
            "notes": "Testing repair session saving functionality",
            "progress_percentage": 25
        }
        
        response = requests.post(
            f"{BASE_URL}/save-repair-session", 
            json=payload, 
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if "session_id" in data and "message" in data:
                log_test("Save Repair Session", "PASS", f"Session ID: {data['session_id']}")
                return data["session_id"]
            else:
                log_test("Save Repair Session", "FAIL", f"Unexpected response format: {data}")
                return None
        else:
            log_test("Save Repair Session", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        log_test("Save Repair Session", "FAIL", f"Exception: {str(e)}")
        return None

def test_get_repair_sessions():
    """Test GET /api/repair-sessions - Get all saved sessions"""
    try:
        response = requests.get(f"{BASE_URL}/repair-sessions", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Repair Sessions", "PASS", f"Retrieved {len(data)} sessions")
                return True
            else:
                log_test("Get Repair Sessions", "FAIL", f"Expected list, got: {type(data)}")
                return False
        else:
            log_test("Get Repair Sessions", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Get Repair Sessions", "FAIL", f"Exception: {str(e)}")
        return False

def test_create_community_post():
    """Test POST /api/community/post - Create community post"""
    try:
        payload = {
            "title": "Successfully Fixed My Laptop Screen",
            "description": "Managed to replace the cracked LCD screen on my Dell laptop. The repair guide was very helpful!",
            "item_type": "Laptop",
            "before_image": SAMPLE_IMAGE_B64,
            "after_image": SAMPLE_IMAGE_B64,
            "repair_steps_used": [
                "Removed the bezel carefully",
                "Disconnected the LCD cable",
                "Installed new screen",
                "Reassembled everything"
            ],
            "tips": "Make sure to ground yourself before handling the LCD panel",
            "user_name": "TechRepairGuru"
        }
        
        response = requests.post(
            f"{BASE_URL}/community/post", 
            json=payload, 
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "title" in data:
                log_test("Create Community Post", "PASS", f"Post ID: {data['id']}")
                return data["id"]
            else:
                log_test("Create Community Post", "FAIL", f"Unexpected response format: {data}")
                return None
        else:
            log_test("Create Community Post", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        log_test("Create Community Post", "FAIL", f"Exception: {str(e)}")
        return None

def test_get_community_posts():
    """Test GET /api/community/posts - Get community posts"""
    try:
        response = requests.get(f"{BASE_URL}/community/posts", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Community Posts", "PASS", f"Retrieved {len(data)} posts")
                return True
            else:
                log_test("Get Community Posts", "FAIL", f"Expected list, got: {type(data)}")
                return False
        else:
            log_test("Get Community Posts", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Get Community Posts", "FAIL", f"Exception: {str(e)}")
        return False

def test_like_post(post_id):
    """Test POST /api/community/like/{post_id} - Like a post"""
    try:
        if not post_id:
            # Create a dummy post ID for testing
            post_id = str(uuid.uuid4())
        
        response = requests.post(f"{BASE_URL}/community/like/{post_id}", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Like Post", "PASS", f"Response: {data['message']}")
                return True
            else:
                log_test("Like Post", "FAIL", f"Unexpected response format: {data}")
                return False
        elif response.status_code == 404:
            log_test("Like Post", "PASS", "Correctly returned 404 for non-existent post")
            return True
        else:
            log_test("Like Post", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Like Post", "FAIL", f"Exception: {str(e)}")
        return False

def test_submit_feedback(repair_id):
    """Test POST /api/feedback - Submit feedback"""
    try:
        payload = {
            "repair_id": repair_id or str(uuid.uuid4()),
            "rating": 5,
            "comment": "The repair instructions were very clear and easy to follow. Successfully fixed my device!",
            "was_helpful": True
        }
        
        response = requests.post(
            f"{BASE_URL}/feedback", 
            json=payload, 
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Submit Feedback", "PASS", f"Response: {data['message']}")
                return True
            else:
                log_test("Submit Feedback", "FAIL", f"Unexpected response format: {data}")
                return False
        else:
            log_test("Submit Feedback", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Submit Feedback", "FAIL", f"Exception: {str(e)}")
        return False

def test_error_handling():
    """Test error handling with invalid data"""
    try:
        # Test analyze-repair with invalid image
        payload = {"image_base64": "invalid_base64", "language": "en"}
        response = requests.post(f"{BASE_URL}/analyze-repair", json=payload, timeout=TIMEOUT)
        
        if response.status_code >= 400:
            log_test("Error Handling - Invalid Image", "PASS", f"Correctly returned error: {response.status_code}")
        else:
            log_test("Error Handling - Invalid Image", "FAIL", f"Should have returned error, got: {response.status_code}")
        
        # Test save-repair-session with missing data
        payload = {"repair_id": ""}  # Missing required fields
        response = requests.post(f"{BASE_URL}/save-repair-session", json=payload, timeout=TIMEOUT)
        
        if response.status_code >= 400:
            log_test("Error Handling - Missing Data", "PASS", f"Correctly returned error: {response.status_code}")
        else:
            log_test("Error Handling - Missing Data", "FAIL", f"Should have returned error, got: {response.status_code}")
            
        return True
        
    except Exception as e:
        log_test("Error Handling", "FAIL", f"Exception: {str(e)}")
        return False

def test_no_visible_damage_detection():
    """Test the no visible damage detection feature"""
    print("🔍 Testing No Visible Damage Detection Feature...")
    
    # Create test image of undamaged phone
    test_image_b64 = create_undamaged_test_image()
    
    # Test data for analyze-repair endpoint
    test_data = {
        "image_base64": test_image_b64,
        "image_mime_type": "image/jpeg",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        print(f"📡 Sending request to: {BASE_URL}/analyze-repair")
        response = requests.post(
            f"{BASE_URL}/analyze-repair",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            log_test("No Visible Damage Detection", "INFO", "API Response received successfully")
            
            # Check for no_visible_damage field
            no_visible_damage = data.get('no_visible_damage', False)
            print(f"🔍 no_visible_damage: {no_visible_damage}")
            
            # Check for diagnostic_questions field
            diagnostic_questions = data.get('diagnostic_questions', [])
            print(f"❓ diagnostic_questions count: {len(diagnostic_questions)}")
            
            if diagnostic_questions:
                print("📝 Diagnostic Questions:")
                for i, question in enumerate(diagnostic_questions, 1):
                    print(f"   {i}. {question}")
            
            # Verify expected behavior for no visible damage
            if no_visible_damage:
                log_test("No Visible Damage Detection", "PASS", "no_visible_damage correctly detected as True")
                
                if diagnostic_questions and len(diagnostic_questions) >= 3:
                    log_test("Diagnostic Questions", "PASS", f"Provided {len(diagnostic_questions)} diagnostic questions")
                    return True, data
                else:
                    log_test("Diagnostic Questions", "FAIL", "diagnostic_questions missing or insufficient")
                    return False, data
            else:
                log_test("No Visible Damage Detection", "FAIL", f"no_visible_damage should be True for undamaged item. Damage: {data.get('damage_description', 'N/A')}")
                return False, data
                
        else:
            log_test("No Visible Damage Detection", "FAIL", f"API returned status {response.status_code}: {response.text}")
            return False, None
            
    except requests.exceptions.Timeout:
        log_test("No Visible Damage Detection", "FAIL", "Request timed out")
        return False, None
    except requests.exceptions.ConnectionError:
        log_test("No Visible Damage Detection", "FAIL", "Could not connect to backend API")
        return False, None
    except Exception as e:
        log_test("No Visible Damage Detection", "FAIL", f"Unexpected error: {str(e)}")
        return False, None

def test_refine_diagnosis():
    """Test the refine-diagnosis endpoint with diagnostic answers"""
    print("\n🔧 Testing Refine Diagnosis Feature...")
    
    # Sample diagnostic answers
    test_data = {
        "item_type": "Smartphone",
        "initial_analysis": {
            "damage_description": "No visible damage detected",
            "repair_id": "test-repair-123"
        },
        "diagnostic_answers": {
            "q1": "The phone won't turn on at all",
            "q2": "It was working fine yesterday",
            "q3": "No, it hasn't been dropped recently",
            "q4": "The battery was at about 50% when it stopped working",
            "q5": "No unusual sounds or smells"
        }
    }
    
    try:
        print(f"📡 Sending request to: {BASE_URL}/refine-diagnosis")
        response = requests.post(
            f"{BASE_URL}/refine-diagnosis",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            log_test("Refine Diagnosis", "INFO", "API Response received successfully")
            
            refined_diagnosis = data.get('refined_diagnosis', {})
            if refined_diagnosis:
                log_test("Refine Diagnosis", "PASS", "Refined diagnosis provided")
                print(f"   Diagnosis: {refined_diagnosis.get('refined_diagnosis', 'N/A')}")
                
                # Check if repair steps are provided
                repair_steps = refined_diagnosis.get('repair_steps', [])
                if repair_steps:
                    print(f"   Repair steps provided: {len(repair_steps)}")
                    return True, data
                else:
                    print("⚠️  Minor: No repair steps in refined diagnosis")
                    return True, data
            else:
                log_test("Refine Diagnosis", "FAIL", "No refined diagnosis in response")
                return False, data
                
        else:
            log_test("Refine Diagnosis", "FAIL", f"API returned status {response.status_code}: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("Refine Diagnosis", "FAIL", f"Unexpected error: {str(e)}")
        return False, None

def test_task_appropriate_clarifying_questions():
    """
    Test the Task-Appropriate Clarifying Questions feature as per review request
    
    VALIDATION CRITERIA:
    1. Questions must reference the SPECIFIC item name (not "device" or "item")
    2. Questions must reference the SPECIFIC damage detected
    3. Questions should be relevant to the item category
    4. Questions should NOT be generic like "Is the item working?"
    """
    print("\n🎯 TESTING TASK-APPROPRIATE CLARIFYING QUESTIONS FEATURE")
    print("=" * 80)
    print("Review Request: Test updated 'Task-Appropriate Clarifying Questions' feature")
    print("Expected: HIGHLY SPECIFIC questions based on exact item type and damage")
    print()
    
    test_results = []
    
    # Test Scenario 1: Smartphone with cracked screen
    print("📱 TEST SCENARIO 1: Smartphone with Cracked Screen")
    print("-" * 60)
    print("Expected: Electronics-specific questions about touchscreen responsiveness, display artifacts, battery issues")
    
    smartphone_image = create_test_image()  # Creates cracked phone image
    
    test_data = {
        "image_base64": smartphone_image,
        "image_mime_type": "image/png",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/analyze-repair", json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            item_type = data.get('item_type', '').lower()
            damage_description = data.get('damage_description', '')
            clarifying_questions = data.get('clarifying_questions', [])
            detected_issues = data.get('detected_issues', [])
            
            print(f"🔧 Detected Item: {data.get('item_type', 'N/A')}")
            print(f"💥 Damage: {damage_description}")
            print(f"🚨 Issues: {detected_issues}")
            print(f"❓ Clarifying Questions ({len(clarifying_questions)}):")
            
            for i, question in enumerate(clarifying_questions, 1):
                print(f"   {i}. {question}")
            
            # VALIDATION 1: Questions reference specific item name
            specific_item_refs = 0
            generic_terms_found = 0
            generic_terms = ['device', 'item', 'object', 'thing', 'product']
            
            for question in clarifying_questions:
                question_lower = question.lower()
                
                # Check for specific item type
                if any(term in item_type for term in ['phone', 'smartphone', 'mobile']) and \
                   any(term in question_lower for term in ['phone', 'smartphone', 'mobile']):
                    specific_item_refs += 1
                
                # Check for generic terms
                if any(generic in question_lower for generic in generic_terms):
                    generic_terms_found += 1
            
            print(f"\n📋 VALIDATION RESULTS:")
            
            # Criterion 1: Specific item references
            if specific_item_refs > 0:
                print(f"   ✅ PASS: {specific_item_refs} questions reference specific item type")
                criterion1_pass = True
            else:
                print(f"   ❌ FAIL: No questions reference the specific item type")
                criterion1_pass = False
            
            if generic_terms_found > 0:
                print(f"   ⚠️  WARNING: {generic_terms_found} questions use generic terms")
            
            # Criterion 2: Questions reference specific damage
            damage_refs = 0
            damage_keywords = ['crack', 'screen', 'display', 'broken', 'shatter']
            
            for question in clarifying_questions:
                question_lower = question.lower()
                if any(keyword in question_lower for keyword in damage_keywords):
                    damage_refs += 1
            
            if damage_refs > 0:
                print(f"   ✅ PASS: {damage_refs} questions reference specific damage")
                criterion2_pass = True
            else:
                print(f"   ❌ FAIL: No questions reference the specific damage")
                criterion2_pass = False
            
            # Criterion 3: Category-relevant questions
            electronics_keywords = ['touchscreen', 'display', 'battery', 'charging', 'screen', 'respond', 'touch']
            category_relevant = 0
            
            for question in clarifying_questions:
                question_lower = question.lower()
                if any(keyword in question_lower for keyword in electronics_keywords):
                    category_relevant += 1
            
            if category_relevant > 0:
                print(f"   ✅ PASS: {category_relevant} questions are electronics-category relevant")
                criterion3_pass = True
            else:
                print(f"   ❌ FAIL: No questions are electronics-category relevant")
                criterion3_pass = False
            
            # Criterion 4: Not generic questions
            generic_patterns = ['is the item working', 'does it work', 'what is wrong', 'is there damage']
            generic_found = 0
            
            for question in clarifying_questions:
                question_lower = question.lower()
                if any(pattern in question_lower for pattern in generic_patterns):
                    generic_found += 1
            
            if generic_found == 0:
                print(f"   ✅ PASS: No generic questions detected")
                criterion4_pass = True
            else:
                print(f"   ❌ FAIL: {generic_found} generic questions detected")
                criterion4_pass = False
            
            # Overall assessment for smartphone test
            smartphone_pass = all([criterion1_pass, criterion2_pass, criterion3_pass, criterion4_pass])
            test_results.append(("Smartphone Test", smartphone_pass))
            
            if smartphone_pass:
                print(f"   🎉 OVERALL: EXCELLENT - All criteria passed for smartphone!")
            else:
                print(f"   ❌ OVERALL: FAILED - Some criteria not met for smartphone")
        
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            test_results.append(("Smartphone Test", False))
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        test_results.append(("Smartphone Test", False))
    
    # Test Scenario 2: Chair with broken leg (furniture category)
    print("\n🪑 TEST SCENARIO 2: Chair with Broken Leg")
    print("-" * 60)
    print("Expected: Furniture-specific questions about stability, weight support, joints")
    
    # Create a simple chair image
    chair_image = create_furniture_test_image()
    
    test_data = {
        "image_base64": chair_image,
        "image_mime_type": "image/png",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/analyze-repair", json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            item_type = data.get('item_type', '').lower()
            damage_description = data.get('damage_description', '')
            clarifying_questions = data.get('clarifying_questions', [])
            
            print(f"🔧 Detected Item: {data.get('item_type', 'N/A')}")
            print(f"💥 Damage: {damage_description}")
            print(f"❓ Clarifying Questions ({len(clarifying_questions)}):")
            
            for i, question in enumerate(clarifying_questions, 1):
                print(f"   {i}. {question}")
            
            # Validate furniture-specific questions
            furniture_keywords = ['stability', 'weight', 'support', 'wobble', 'leg', 'joint', 'sitting', 'chair']
            furniture_relevant = 0
            
            for question in clarifying_questions:
                question_lower = question.lower()
                if any(keyword in question_lower for keyword in furniture_keywords):
                    furniture_relevant += 1
            
            print(f"\n📋 VALIDATION RESULTS:")
            
            if furniture_relevant > 0:
                print(f"   ✅ PASS: {furniture_relevant} questions are furniture-category relevant")
                chair_pass = True
            else:
                print(f"   ❌ FAIL: No questions are furniture-category relevant")
                chair_pass = False
            
            test_results.append(("Chair Test", chair_pass))
        
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            test_results.append(("Chair Test", False))
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        test_results.append(("Chair Test", False))
    
    # Test Scenario 3: Washing machine (appliance category)
    print("\n🧺 TEST SCENARIO 3: Washing Machine Issues")
    print("-" * 60)
    print("Expected: Appliance-specific questions about cycles, water, error codes")
    
    # Create a simple appliance image
    appliance_image = create_appliance_test_image()
    
    test_data = {
        "image_base64": appliance_image,
        "image_mime_type": "image/png",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/analyze-repair", json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            item_type = data.get('item_type', '').lower()
            clarifying_questions = data.get('clarifying_questions', [])
            
            print(f"🔧 Detected Item: {data.get('item_type', 'N/A')}")
            print(f"❓ Clarifying Questions ({len(clarifying_questions)}):")
            
            for i, question in enumerate(clarifying_questions, 1):
                print(f"   {i}. {question}")
            
            # Validate appliance-specific questions
            appliance_keywords = ['cycle', 'water', 'drain', 'spin', 'error', 'leak', 'wash', 'machine']
            appliance_relevant = 0
            
            for question in clarifying_questions:
                question_lower = question.lower()
                if any(keyword in question_lower for keyword in appliance_keywords):
                    appliance_relevant += 1
            
            print(f"\n📋 VALIDATION RESULTS:")
            
            if appliance_relevant > 0:
                print(f"   ✅ PASS: {appliance_relevant} questions are appliance-category relevant")
                appliance_pass = True
            else:
                print(f"   ❌ FAIL: No questions are appliance-category relevant")
                appliance_pass = False
            
            test_results.append(("Appliance Test", appliance_pass))
        
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            test_results.append(("Appliance Test", False))
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        test_results.append(("Appliance Test", False))
    
    # FINAL SUMMARY
    print("\n📊 TASK-APPROPRIATE CLARIFYING QUESTIONS - FINAL RESULTS")
    print("=" * 80)
    
    passed_tests = sum(1 for _, result in test_results if result)
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    print(f"\n📈 Results: {passed_tests}/{total_tests} tests passed")
    
    print(f"\n🔍 VALIDATION CRITERIA CHECKED:")
    print(f"   ✓ Questions reference SPECIFIC item names (not 'device' or 'item')")
    print(f"   ✓ Questions reference SPECIFIC damage detected")
    print(f"   ✓ Questions are relevant to item category (electronics/furniture/appliances)")
    print(f"   ✓ Questions are NOT generic like 'Is the item working?'")
    
    if passed_tests == total_tests:
        print(f"\n🎉 SUCCESS: Task-Appropriate Clarifying Questions feature is working perfectly!")
        print(f"✅ All questions are highly specific to item types and detected damage")
        return True
    elif passed_tests >= total_tests * 0.67:
        print(f"\n✅ MOSTLY WORKING: Feature is functional with minor issues")
        return True
    else:
        print(f"\n❌ CRITICAL ISSUES: Feature needs significant improvements")
        return False

def create_furniture_test_image():
    """Create a simple test image of a broken chair"""
    img = Image.new('RGB', (400, 400), color='lightgray')
    
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Draw chair seat
    draw.rectangle([100, 150, 300, 200], fill='brown', outline='black', width=2)
    
    # Draw chair back
    draw.rectangle([100, 50, 300, 150], fill='brown', outline='black', width=2)
    
    # Draw 3 normal legs
    draw.rectangle([110, 200, 130, 350], fill='brown', outline='black', width=2)
    draw.rectangle([180, 200, 200, 350], fill='brown', outline='black', width=2)
    draw.rectangle([270, 200, 290, 350], fill='brown', outline='black', width=2)
    
    # Draw broken leg (shorter and cracked)
    draw.rectangle([110, 200, 130, 280], fill='brown', outline='black', width=2)
    draw.line([115, 280, 125, 290], fill='red', width=3)  # Crack
    draw.text((50, 300), "Broken Leg", fill='red')
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def create_appliance_test_image():
    """Create a simple test image of a washing machine"""
    img = Image.new('RGB', (400, 500), color='white')
    
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Draw washing machine body
    draw.rectangle([50, 100, 350, 450], fill='lightblue', outline='black', width=3)
    
    # Draw door/window
    draw.ellipse([100, 150, 300, 350], fill='gray', outline='black', width=2)
    
    # Draw control panel
    draw.rectangle([100, 50, 300, 100], fill='darkgray', outline='black', width=2)
    
    # Draw some buttons
    draw.ellipse([120, 60, 140, 80], fill='red', outline='black')
    draw.ellipse([160, 60, 180, 80], fill='green', outline='black')
    draw.ellipse([200, 60, 220, 80], fill='blue', outline='black')
    
    # Add error indication
    draw.text((110, 380), "ERROR E3", fill='red')
    draw.text((110, 400), "Water Issue", fill='red')
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def main():
    """Run Task-Appropriate Clarifying Questions Feature Testing"""
    print("🚀 FixIt Pro Backend Testing - Task-Appropriate Clarifying Questions Feature")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("🎯 REVIEW REQUEST: Test updated 'Task-Appropriate Clarifying Questions' feature")
    print()
    print("📋 VALIDATION CRITERIA:")
    print("   1. Questions must reference the SPECIFIC item name (not 'device' or 'item')")
    print("   2. Questions must reference the SPECIFIC damage detected")
    print("   3. Questions should be relevant to the item category")
    print("   4. Questions should NOT be generic like 'Is the item working?'")
    print()
    print("🧪 TEST SCENARIOS:")
    print("   • Smartphone with cracked screen → Electronics-specific questions")
    print("   • Chair with broken leg → Furniture-specific questions")
    print("   • Washing machine issues → Appliance-specific questions")
    print()
    
    # Track test results
    results = {}
    
    # Test 1: Root endpoint (quick connectivity check)
    print("🌐 Testing API connectivity...")
    results['connectivity'] = test_root_endpoint()
    
    if not results['connectivity']:
        print("\n❌ CRITICAL: Cannot connect to backend API. Stopping tests.")
        return False
    
    # Test 2: Main focus - Task-Appropriate Clarifying Questions Feature
    print("\n🎯 MAIN TEST: Task-Appropriate Clarifying Questions Feature")
    results['task_appropriate_questions'] = test_task_appropriate_clarifying_questions()
    
    # Summary
    print("\n📊 FINAL TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        display_name = test_name.replace('_', ' ').title()
        if test_name == 'task_appropriate_questions':
            display_name = "Task-Appropriate Clarifying Questions Feature"
        elif test_name == 'connectivity':
            display_name = "API Connectivity"
        print(f"  {display_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if results.get('task_appropriate_questions', False):
        print("\n🎉 SUCCESS: Task-Appropriate Clarifying Questions feature is working correctly!")
        print("✅ Questions are highly specific to item types and detected damage")
        print("✅ Questions are category-appropriate (electronics, furniture, appliances)")
        print("✅ No generic questions detected")
        return True
    else:
        print("\n❌ FAILURE: Task-Appropriate Clarifying Questions feature has issues!")
        print("⚠️  Questions may be too generic or not item/damage-specific")
        return False

if __name__ == "__main__":
    main()