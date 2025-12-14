#!/usr/bin/env python3
"""
FixIt Pro Backend API Test Suite - PR #4 Cost/Time Estimation Testing
Focus: Testing the enhanced /api/analyze-repair endpoint with cost_estimate and time_estimate fields
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
BASE_URL = "https://ai-repair-3.preview.emergentagent.com/api"
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

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("FixIt Pro Backend API Test Suite")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print()
    
    # Track test results
    results = {}
    
    # Test 1: Root endpoint
    results['root'] = test_root_endpoint()
    
    # Test 2: Analyze repair (main feature)
    repair_id = test_analyze_repair()
    results['analyze'] = repair_id is not None
    
    # Test 3: Save repair session
    session_id = test_save_repair_session(repair_id)
    results['save_session'] = session_id is not None
    
    # Test 4: Get repair sessions
    results['get_sessions'] = test_get_repair_sessions()
    
    # Test 5: Create community post
    post_id = test_create_community_post()
    results['create_post'] = post_id is not None
    
    # Test 6: Get community posts
    results['get_posts'] = test_get_community_posts()
    
    # Test 7: Like post
    results['like_post'] = test_like_post(post_id)
    
    # Test 8: Submit feedback
    results['feedback'] = test_submit_feedback(repair_id)
    
    # Test 9: Error handling
    results['error_handling'] = test_error_handling()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print()
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Backend API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the details above.")
    
    return results

if __name__ == "__main__":
    main()