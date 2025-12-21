#!/usr/bin/env python3
"""
FixIt Pro Backend API Test Suite - Clarifying Questions Feature Testing
Focus: Testing the updated /api/analyze-repair endpoint to ensure clarifying_questions are ALWAYS returned
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

def test_clarifying_questions_feature():
    """Test the Clarifying Questions feature - ALWAYS returns clarifying_questions"""
    print("\n🎯 TESTING CLARIFYING QUESTIONS FEATURE")
    print("=" * 70)
    print("Testing that clarifying_questions are ALWAYS returned for both damaged and undamaged items")
    
    results = {
        'damaged_item': False,
        'undamaged_item': False
    }
    
    # Test 1: Damaged item (should have clarifying_questions + detected_issues)
    print("\n🔧 Test 1: DAMAGED ITEM - Should return clarifying_questions")
    print("-" * 50)
    
    damaged_image = create_test_image()  # Creates cracked phone image
    
    test_data_damaged = {
        "image_base64": damaged_image,
        "image_mime_type": "image/png",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze-repair",
            json=test_data_damaged,
            timeout=TIMEOUT
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields for clarifying questions feature
            clarifying_questions = data.get('clarifying_questions', [])
            detected_issues = data.get('detected_issues', [])
            item_type = data.get('item_type', 'Unknown')
            damage_description = data.get('damage_description', '')
            
            print(f"🔧 Item Type: {item_type}")
            print(f"💥 Damage Description: {damage_description}")
            print(f"🔍 Detected Issues ({len(detected_issues)}): {detected_issues}")
            print(f"❓ Clarifying Questions ({len(clarifying_questions)}):")
            
            for i, question in enumerate(clarifying_questions, 1):
                print(f"   {i}. {question}")
            
            # Validate clarifying_questions
            if clarifying_questions and len(clarifying_questions) >= 3:
                print("✅ PASS: clarifying_questions populated for damaged item")
                results['damaged_item'] = True
            else:
                print("❌ FAIL: clarifying_questions missing or insufficient for damaged item")
                results['damaged_item'] = False
            
            # Validate detected_issues
            if detected_issues and len(detected_issues) > 0:
                print("✅ PASS: detected_issues populated for damaged item")
            else:
                print("⚠️  WARNING: detected_issues empty for damaged item")
                
        else:
            print(f"❌ FAIL: API error {response.status_code}: {response.text}")
            results['damaged_item'] = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception testing damaged item: {str(e)}")
        results['damaged_item'] = False
    
    # Test 2: Undamaged item (should still have clarifying_questions)
    print("\n📱 Test 2: UNDAMAGED ITEM - Should STILL return clarifying_questions")
    print("-" * 50)
    
    undamaged_image = create_undamaged_test_image()  # Creates clean phone image
    
    test_data_undamaged = {
        "image_base64": undamaged_image,
        "image_mime_type": "image/jpeg",
        "language": "en",
        "skill_level": "beginner"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze-repair",
            json=test_data_undamaged,
            timeout=TIMEOUT
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            clarifying_questions = data.get('clarifying_questions', [])
            detected_issues = data.get('detected_issues', [])
            no_visible_damage = data.get('no_visible_damage', False)
            diagnostic_questions = data.get('diagnostic_questions', [])
            item_type = data.get('item_type', 'Unknown')
            damage_description = data.get('damage_description', '')
            
            print(f"🔧 Item Type: {item_type}")
            print(f"💥 Damage Description: {damage_description}")
            print(f"👁️  No Visible Damage: {no_visible_damage}")
            print(f"🔍 Detected Issues ({len(detected_issues)}): {detected_issues}")
            print(f"🩺 Diagnostic Questions ({len(diagnostic_questions)}): {diagnostic_questions}")
            print(f"❓ Clarifying Questions ({len(clarifying_questions)}):")
            
            for i, question in enumerate(clarifying_questions, 1):
                print(f"   {i}. {question}")
            
            # KEY TEST: Clarifying questions should ALWAYS be present
            if clarifying_questions and len(clarifying_questions) >= 3:
                print("✅ PASS: clarifying_questions populated for undamaged item (KEY REQUIREMENT)")
                results['undamaged_item'] = True
            else:
                print("❌ CRITICAL FAIL: clarifying_questions missing for undamaged item!")
                print("   This violates the requirement that clarifying_questions should ALWAYS be returned")
                results['undamaged_item'] = False
                
        else:
            print(f"❌ FAIL: API error {response.status_code}: {response.text}")
            results['undamaged_item'] = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception testing undamaged item: {str(e)}")
        results['undamaged_item'] = False
    
    # Summary for Clarifying Questions Feature
    print("\n📊 CLARIFYING QUESTIONS FEATURE TEST SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        display_name = test_name.replace('_', ' ').title()
        print(f"  {display_name}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 SUCCESS: Clarifying Questions feature working correctly!")
        print("✅ CONFIRMED: clarifying_questions ALWAYS returned for both damaged and undamaged items")
        return True
    else:
        print("❌ FAILURE: Clarifying Questions feature has issues!")
        if not results['damaged_item']:
            print("   - Issue with damaged item clarifying questions")
        if not results['undamaged_item']:
            print("   - CRITICAL: Issue with undamaged item clarifying questions")
        return False

def main():
    """Run Clarifying Questions Feature focused backend tests"""
    print("🚀 FixIt Pro Backend Testing - Clarifying Questions Feature")
    print("=" * 70)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("🎯 FOCUS: Testing that clarifying_questions are ALWAYS returned")
    print("   - For damaged items: clarifying_questions + detected_issues")
    print("   - For undamaged items: clarifying_questions (even with no visible damage)")
    print()
    
    # Track test results
    results = {}
    
    # Test 1: Root endpoint (quick connectivity check)
    print("🌐 Testing API connectivity...")
    results['root'] = test_root_endpoint()
    
    # Test 2: Main focus - Clarifying Questions Feature
    print("\n🎯 MAIN TEST: Clarifying Questions Feature")
    results['clarifying_questions'] = test_clarifying_questions_feature()
    
    # Summary
    print("\n📊 FINAL TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        display_name = test_name.replace('_', ' ').title()
        if test_name == 'clarifying_questions':
            display_name = "Clarifying Questions Feature"
        print(f"  {display_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Clarifying Questions feature working correctly!")
        print("✅ Backend ALWAYS returns clarifying_questions as requested")
        return True
    else:
        print("⚠️  SOME TESTS FAILED - Issues found with Clarifying Questions feature")
        return False

if __name__ == "__main__":
    main()