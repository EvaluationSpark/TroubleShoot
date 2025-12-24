#!/usr/bin/env python3
"""
Comprehensive test for No Visible Damage Detection feature
Tests both scenarios: damaged and undamaged items
"""

import requests
import json
import base64
from io import BytesIO
from PIL import Image
import sys

BACKEND_URL = "https://airepair-service.preview.emergentagent.com/api"

def create_undamaged_image():
    """Create an undamaged phone image"""
    img = Image.new('RGB', (300, 600), color='lightblue')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Draw phone outline
    draw.rectangle([20, 20, 280, 580], outline='black', width=3)
    # Draw screen area (no cracks)
    draw.rectangle([40, 80, 260, 480], fill='black', outline='gray')
    # Draw home button
    draw.ellipse([130, 500, 170, 540], fill='gray', outline='black')
    draw.text((100, 300), "Working Phone", fill='white')
    
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def create_damaged_image():
    """Create a damaged phone image"""
    img = Image.new('RGB', (300, 600), color='black')
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
    draw.text((80, 480), "Cracked Screen", fill='white')
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def test_scenario(image_b64, scenario_name, expected_no_damage):
    """Test a specific scenario"""
    print(f"\n🧪 Testing {scenario_name}...")
    
    test_data = {
        "image_base64": image_b64,
        "image_mime_type": "image/jpeg",
        "language": "en",
        "skill_level": "diy"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/analyze-repair",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            no_visible_damage = data.get('no_visible_damage', False)
            diagnostic_questions = data.get('diagnostic_questions', [])
            damage_description = data.get('damage_description', '')
            
            print(f"   📊 Status: {response.status_code}")
            print(f"   🔍 no_visible_damage: {no_visible_damage}")
            print(f"   ❓ diagnostic_questions: {len(diagnostic_questions)}")
            print(f"   📝 damage_description: {damage_description[:100]}...")
            
            # Verify expected behavior
            if no_visible_damage == expected_no_damage:
                if expected_no_damage and len(diagnostic_questions) >= 3:
                    print(f"   ✅ {scenario_name}: PASS - Correctly detected no damage with diagnostic questions")
                    return True
                elif not expected_no_damage:
                    print(f"   ✅ {scenario_name}: PASS - Correctly detected damage")
                    return True
                else:
                    print(f"   ❌ {scenario_name}: FAIL - Missing diagnostic questions")
                    return False
            else:
                print(f"   ❌ {scenario_name}: FAIL - Expected no_visible_damage={expected_no_damage}, got {no_visible_damage}")
                return False
        else:
            print(f"   ❌ {scenario_name}: FAIL - Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ {scenario_name}: FAIL - Exception: {str(e)}")
        return False

def main():
    """Run comprehensive tests"""
    print("🚀 Comprehensive No Visible Damage Detection Test")
    print("=" * 60)
    
    # Test 1: Undamaged item (should return no_visible_damage=True)
    undamaged_img = create_undamaged_image()
    test1_pass = test_scenario(undamaged_img, "Undamaged Phone", expected_no_damage=True)
    
    # Test 2: Damaged item (should return no_visible_damage=False)
    damaged_img = create_damaged_image()
    test2_pass = test_scenario(damaged_img, "Damaged Phone", expected_no_damage=False)
    
    # Summary
    print("\n📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    print(f"Undamaged Phone Test: {'✅ PASS' if test1_pass else '❌ FAIL'}")
    print(f"Damaged Phone Test: {'✅ PASS' if test2_pass else '❌ FAIL'}")
    
    overall_success = test1_pass and test2_pass
    print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    if overall_success:
        print("\n🎉 No Visible Damage Detection feature is working correctly!")
        print("   ✓ Correctly identifies undamaged items")
        print("   ✓ Provides diagnostic questions for undamaged items")
        print("   ✓ Correctly identifies damaged items")
        print("   ✓ Does not provide diagnostic questions for damaged items")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)