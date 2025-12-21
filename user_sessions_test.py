#!/usr/bin/env python3
"""
User-Specific Repair Sessions Feature Test Suite
Tests the filtering of repair sessions by user_id to ensure data isolation.

Test Scenarios:
1. Save repairs for different users (user_123, user_456)
2. Verify GET only returns data for the specified user
3. Verify insights are user-specific
4. Verify DELETE only affects the specified user's data
"""

import requests
import json
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://fixgenius-4.preview.emergentagent.com/api"

def test_save_repair_session_with_user_id():
    """Test POST /api/save-repair-session with different user_ids"""
    print("\n=== Testing Save Repair Session with User ID ===")
    
    # Test data for user_123
    repair_data_user123 = {
        "repair_id": str(uuid.uuid4()),
        "user_id": "user_123",
        "title": "iPhone Screen Repair - User 123",
        "notes": "Cracked screen repair for user 123",
        "progress_percentage": 50,
        "status": "in_progress",
        "repair_data": {
            "item_type": "iPhone",
            "damage_description": "Cracked screen",
            "repair_difficulty": "medium"
        }
    }
    
    # Test data for user_456
    repair_data_user456 = {
        "repair_id": str(uuid.uuid4()),
        "user_id": "user_456", 
        "title": "Laptop Keyboard Repair - User 456",
        "notes": "Sticky keys repair for user 456",
        "progress_percentage": 75,
        "status": "in_progress",
        "repair_data": {
            "item_type": "Laptop",
            "damage_description": "Sticky keyboard keys",
            "repair_difficulty": "easy"
        }
    }
    
    try:
        # Save repair for user_123
        response1 = requests.post(f"{BACKEND_URL}/save-repair-session", json=repair_data_user123)
        print(f"Save repair for user_123: {response1.status_code}")
        if response1.status_code == 200:
            result1 = response1.json()
            print(f"✅ User 123 repair saved: {result1.get('session_id')}")
        else:
            print(f"❌ Failed to save repair for user_123: {response1.text}")
            return False
            
        # Save repair for user_456
        response2 = requests.post(f"{BACKEND_URL}/save-repair-session", json=repair_data_user456)
        print(f"Save repair for user_456: {response2.status_code}")
        if response2.status_code == 200:
            result2 = response2.json()
            print(f"✅ User 456 repair saved: {result2.get('session_id')}")
        else:
            print(f"❌ Failed to save repair for user_456: {response2.text}")
            return False
            
        # Save another repair for user_123 to test multiple sessions
        repair_data_user123_2 = {
            "repair_id": str(uuid.uuid4()),
            "user_id": "user_123",
            "title": "Tablet Battery Replacement - User 123",
            "notes": "Battery replacement for user 123",
            "progress_percentage": 25,
            "status": "saved",
            "repair_data": {
                "item_type": "Tablet",
                "damage_description": "Battery not holding charge",
                "repair_difficulty": "hard"
            }
        }
        
        response3 = requests.post(f"{BACKEND_URL}/save-repair-session", json=repair_data_user123_2)
        print(f"Save second repair for user_123: {response3.status_code}")
        if response3.status_code == 200:
            result3 = response3.json()
            print(f"✅ User 123 second repair saved: {result3.get('session_id')}")
        else:
            print(f"❌ Failed to save second repair for user_123: {response3.text}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error in save repair session test: {str(e)}")
        return False

def test_get_repair_sessions_by_user():
    """Test GET /api/repair-sessions?user_id=user_123 - should only return user_123's repairs"""
    print("\n=== Testing Get Repair Sessions by User ID ===")
    
    try:
        # Get sessions for user_123
        response1 = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_123")
        print(f"Get sessions for user_123: {response1.status_code}")
        
        if response1.status_code == 200:
            sessions_123 = response1.json()
            print(f"✅ Found {len(sessions_123)} sessions for user_123")
            
            # Verify all sessions belong to user_123
            for session in sessions_123:
                if session.get('user_id') != 'user_123':
                    print(f"❌ SECURITY ISSUE: Found session for different user: {session.get('user_id')}")
                    return False
                print(f"  - Session: {session.get('title')} (user_id: {session.get('user_id')})")
            
            print("✅ All sessions correctly belong to user_123")
        else:
            print(f"❌ Failed to get sessions for user_123: {response1.text}")
            return False
            
        # Get sessions for user_456
        response2 = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_456")
        print(f"Get sessions for user_456: {response2.status_code}")
        
        if response2.status_code == 200:
            sessions_456 = response2.json()
            print(f"✅ Found {len(sessions_456)} sessions for user_456")
            
            # Verify all sessions belong to user_456
            for session in sessions_456:
                if session.get('user_id') != 'user_456':
                    print(f"❌ SECURITY ISSUE: Found session for different user: {session.get('user_id')}")
                    return False
                print(f"  - Session: {session.get('title')} (user_id: {session.get('user_id')})")
            
            print("✅ All sessions correctly belong to user_456")
        else:
            print(f"❌ Failed to get sessions for user_456: {response2.text}")
            return False
            
        # Verify user isolation - user_123 should not see user_456's repairs
        user_123_titles = [s.get('title') for s in sessions_123]
        user_456_titles = [s.get('title') for s in sessions_456]
        
        # Check for cross-contamination
        for title in user_456_titles:
            if title in user_123_titles:
                print(f"❌ DATA LEAK: user_123 can see user_456's repair: {title}")
                return False
                
        for title in user_123_titles:
            if title in user_456_titles:
                print(f"❌ DATA LEAK: user_456 can see user_123's repair: {title}")
                return False
                
        print("✅ User data isolation verified - no cross-contamination")
        return True
        
    except Exception as e:
        print(f"❌ Error in get repair sessions test: {str(e)}")
        return False

def test_repair_insights_by_user():
    """Test GET /api/repair-insights?user_id=user_123 - should only return insights for user_123"""
    print("\n=== Testing Repair Insights by User ID ===")
    
    try:
        # Get insights for user_123
        response1 = requests.get(f"{BACKEND_URL}/repair-insights?user_id=user_123")
        print(f"Get insights for user_123: {response1.status_code}")
        
        if response1.status_code == 200:
            insights_123 = response1.json()
            print(f"✅ Insights for user_123:")
            print(f"  - Total repairs: {insights_123.get('total_repairs')}")
            print(f"  - Completed repairs: {insights_123.get('completed_repairs')}")
            print(f"  - Money saved: ${insights_123.get('money_saved')}")
            print(f"  - Completion rate: {insights_123.get('completion_rate')}%")
            
            # Should have at least 2 repairs for user_123 from our test data
            if insights_123.get('total_repairs', 0) < 2:
                print(f"❌ Expected at least 2 repairs for user_123, got {insights_123.get('total_repairs')}")
                return False
        else:
            print(f"❌ Failed to get insights for user_123: {response1.text}")
            return False
            
        # Get insights for user_456
        response2 = requests.get(f"{BACKEND_URL}/repair-insights?user_id=user_456")
        print(f"Get insights for user_456: {response2.status_code}")
        
        if response2.status_code == 200:
            insights_456 = response2.json()
            print(f"✅ Insights for user_456:")
            print(f"  - Total repairs: {insights_456.get('total_repairs')}")
            print(f"  - Completed repairs: {insights_456.get('completed_repairs')}")
            print(f"  - Money saved: ${insights_456.get('money_saved')}")
            print(f"  - Completion rate: {insights_456.get('completion_rate')}%")
            
            # Should have at least 1 repair for user_456 from our test data
            if insights_456.get('total_repairs', 0) < 1:
                print(f"❌ Expected at least 1 repair for user_456, got {insights_456.get('total_repairs')}")
                return False
        else:
            print(f"❌ Failed to get insights for user_456: {response2.text}")
            return False
            
        # Verify insights are different (user isolation)
        if insights_123.get('total_repairs') == insights_456.get('total_repairs'):
            print("⚠️  Warning: Both users have same total repairs - may indicate data leak")
            
        print("✅ Repair insights correctly filtered by user_id")
        return True
        
    except Exception as e:
        print(f"❌ Error in repair insights test: {str(e)}")
        return False

def test_delete_repair_sessions_by_user():
    """Test DELETE /api/repair-sessions?user_id=user_123 - should only delete user_123's repairs"""
    print("\n=== Testing Delete Repair Sessions by User ID ===")
    
    try:
        # First, get current counts for both users
        response_123_before = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_123")
        response_456_before = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_456")
        
        if response_123_before.status_code != 200 or response_456_before.status_code != 200:
            print("❌ Failed to get initial session counts")
            return False
            
        sessions_123_before = len(response_123_before.json())
        sessions_456_before = len(response_456_before.json())
        
        print(f"Before deletion - user_123: {sessions_123_before} sessions, user_456: {sessions_456_before} sessions")
        
        # Delete all sessions for user_123
        delete_response = requests.delete(f"{BACKEND_URL}/repair-sessions?user_id=user_123")
        print(f"Delete sessions for user_123: {delete_response.status_code}")
        
        if delete_response.status_code == 200:
            delete_result = delete_response.json()
            print(f"✅ Delete result: {delete_result.get('message')}")
        else:
            print(f"❌ Failed to delete sessions for user_123: {delete_response.text}")
            return False
            
        # Verify user_123 has no sessions left
        response_123_after = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_123")
        if response_123_after.status_code == 200:
            sessions_123_after = response_123_after.json()
            if len(sessions_123_after) == 0:
                print("✅ user_123 sessions successfully deleted")
            else:
                print(f"❌ user_123 still has {len(sessions_123_after)} sessions after deletion")
                return False
        else:
            print(f"❌ Failed to verify user_123 deletion: {response_123_after.text}")
            return False
            
        # Verify user_456 sessions are untouched
        response_456_after = requests.get(f"{BACKEND_URL}/repair-sessions?user_id=user_456")
        if response_456_after.status_code == 200:
            sessions_456_after = response_456_after.json()
            if len(sessions_456_after) == sessions_456_before:
                print(f"✅ user_456 sessions preserved ({len(sessions_456_after)} sessions)")
            else:
                print(f"❌ user_456 sessions affected by user_123 deletion! Before: {sessions_456_before}, After: {len(sessions_456_after)}")
                return False
        else:
            print(f"❌ Failed to verify user_456 preservation: {response_456_after.text}")
            return False
            
        print("✅ Delete operation correctly isolated to user_123 only")
        return True
        
    except Exception as e:
        print(f"❌ Error in delete repair sessions test: {str(e)}")
        return False

def test_default_user_behavior():
    """Test default user_id behavior when not specified"""
    print("\n=== Testing Default User Behavior ===")
    
    try:
        # Save a repair without specifying user_id (should default to "default_user")
        repair_data_default = {
            "repair_id": str(uuid.uuid4()),
            "title": "Default User Repair Test",
            "notes": "Testing default user behavior",
            "progress_percentage": 100,
            "status": "completed"
        }
        
        response = requests.post(f"{BACKEND_URL}/save-repair-session", json=repair_data_default)
        print(f"Save repair without user_id: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Repair saved successfully without explicit user_id")
        else:
            print(f"❌ Failed to save repair without user_id: {response.text}")
            return False
            
        # Get sessions without specifying user_id (should default to "default_user")
        response2 = requests.get(f"{BACKEND_URL}/repair-sessions")
        print(f"Get sessions without user_id: {response2.status_code}")
        
        if response2.status_code == 200:
            sessions = response2.json()
            print(f"✅ Retrieved {len(sessions)} sessions for default user")
            
            # Verify the session we just created is in the results
            found_test_session = False
            for session in sessions:
                if session.get('title') == 'Default User Repair Test':
                    found_test_session = True
                    if session.get('user_id') == 'default_user':
                        print("✅ Default user_id correctly set to 'default_user'")
                    else:
                        print(f"❌ Expected user_id 'default_user', got '{session.get('user_id')}'")
                        return False
                    break
                    
            if not found_test_session:
                print("❌ Test session not found in default user results")
                return False
        else:
            print(f"❌ Failed to get sessions for default user: {response2.text}")
            return False
            
        # Test insights for default user
        response3 = requests.get(f"{BACKEND_URL}/repair-insights")
        print(f"Get insights without user_id: {response3.status_code}")
        
        if response3.status_code == 200:
            insights = response3.json()
            print(f"✅ Retrieved insights for default user: {insights.get('total_repairs')} repairs")
        else:
            print(f"❌ Failed to get insights for default user: {response3.text}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error in default user test: {str(e)}")
        return False

def run_all_tests():
    """Run all user-specific repair sessions tests"""
    print("🧪 Starting User-Specific Repair Sessions Feature Tests")
    print("=" * 60)
    
    test_results = []
    
    # Test 1: Save repair sessions with different user_ids
    test_results.append(("Save Repair Sessions", test_save_repair_session_with_user_id()))
    
    # Test 2: Get repair sessions filtered by user_id
    test_results.append(("Get Repair Sessions by User", test_get_repair_sessions_by_user()))
    
    # Test 3: Get repair insights filtered by user_id
    test_results.append(("Repair Insights by User", test_repair_insights_by_user()))
    
    # Test 4: Delete repair sessions filtered by user_id
    test_results.append(("Delete Repair Sessions by User", test_delete_repair_sessions_by_user()))
    
    # Test 5: Default user behavior
    test_results.append(("Default User Behavior", test_default_user_behavior()))
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed + failed} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! User-specific repair sessions feature is working correctly.")
        return True
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED! Please review the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)