"""
FixIntel AI - Gamification System
Company: RentMouse
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any

# XP Rewards
XP_REWARDS = {
    "complete_step": 10,
    "complete_easy_repair": 50,
    "complete_medium_repair": 100,
    "complete_hard_repair": 200,
    "daily_login": 5,
    "share_repair": 20,
    "first_repair_bonus": 30,
    "speed_bonus": 50,  # Complete repair in under 1 hour
    "perfect_completion": 25,  # 100% of steps completed
}

# Level Thresholds
LEVEL_THRESHOLDS = [
    {"level": 1, "min_xp": 0, "title": "Rookie Fixer"},
    {"level": 2, "min_xp": 100, "title": "Apprentice"},
    {"level": 3, "min_xp": 300, "title": "Handyman"},
    {"level": 4, "min_xp": 600, "title": "Expert Technician"},
    {"level": 5, "min_xp": 1000, "title": "Master Craftsman"},
    {"level": 6, "min_xp": 1500, "title": "Repair Legend"},
    {"level": 7, "min_xp": 2500, "title": "Grandmaster"},
]

# Badge Definitions
BADGES = {
    "first_repair": {
        "id": "first_repair",
        "name": "First Fix",
        "description": "Complete your first repair",
        "icon": "trophy",
        "criteria": lambda stats: stats.get("total_repairs", 0) >= 1
    },
    "speed_demon": {
        "id": "speed_demon",
        "name": "Speed Demon",
        "description": "Complete a repair in under 1 hour",
        "icon": "flash",
        "criteria": lambda stats: stats.get("fastest_repair_minutes", 999) < 60
    },
    "night_owl": {
        "id": "night_owl",
        "name": "Night Owl",
        "description": "Complete a repair after 10 PM",
        "icon": "moon",
        "criteria": lambda stats: stats.get("late_night_repairs", 0) >= 1
    },
    "early_bird": {
        "id": "early_bird",
        "name": "Early Bird",
        "description": "Complete a repair before 8 AM",
        "icon": "sunny",
        "criteria": lambda stats: stats.get("early_morning_repairs", 0) >= 1
    },
    "streak_master": {
        "id": "streak_master",
        "name": "Streak Master",
        "description": "Maintain a 7-day activity streak",
        "icon": "flame",
        "criteria": lambda stats: stats.get("longest_streak", 0) >= 7
    },
    "perfectionist": {
        "id": "perfectionist",
        "name": "Perfectionist",
        "description": "100% completion rate on 5+ repairs",
        "icon": "star",
        "criteria": lambda stats: (stats.get("completed_repairs", 0) >= 5 and 
                                  stats.get("completion_rate", 0) == 100)
    },
    "tool_collector": {
        "id": "tool_collector",
        "name": "Tool Collector",
        "description": "Use 20+ different tools across repairs",
        "icon": "construct",
        "criteria": lambda stats: len(stats.get("unique_tools", [])) >= 20
    },
    "diy_enthusiast": {
        "id": "diy_enthusiast",
        "name": "DIY Enthusiast",
        "description": "Complete 5 repairs",
        "icon": "hammer",
        "criteria": lambda stats: stats.get("completed_repairs", 0) >= 5
    },
    "master_fixer": {
        "id": "master_fixer",
        "name": "Master Fixer",
        "description": "Complete 10 repairs",
        "icon": "medal",
        "criteria": lambda stats: stats.get("completed_repairs", 0) >= 10
    },
    "budget_saver": {
        "id": "budget_saver",
        "name": "Budget Saver",
        "description": "Save over $100",
        "icon": "cash",
        "criteria": lambda stats: stats.get("money_saved", 0) >= 100
    },
    "hard_mode": {
        "id": "hard_mode",
        "name": "Hard Mode",
        "description": "Complete 3 hard difficulty repairs",
        "icon": "warning",
        "criteria": lambda stats: stats.get("hard_repairs_completed", 0) >= 3
    },
}


def calculate_level(total_xp: int) -> Dict[str, Any]:
    """Calculate user level based on total XP"""
    current_level = LEVEL_THRESHOLDS[0]
    next_level = LEVEL_THRESHOLDS[1] if len(LEVEL_THRESHOLDS) > 1 else None
    
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold["min_xp"]:
            current_level = threshold
            next_level = LEVEL_THRESHOLDS[i + 1] if i + 1 < len(LEVEL_THRESHOLDS) else None
    
    xp_in_current_level = total_xp - current_level["min_xp"]
    xp_for_next_level = (next_level["min_xp"] - current_level["min_xp"]) if next_level else 0
    progress_percentage = (xp_in_current_level / xp_for_next_level * 100) if xp_for_next_level > 0 else 100
    
    return {
        "level": current_level["level"],
        "title": current_level["title"],
        "current_xp": total_xp,
        "xp_in_level": xp_in_current_level,
        "xp_for_next_level": xp_for_next_level,
        "progress_percentage": round(progress_percentage, 1),
        "next_level_title": next_level["title"] if next_level else "Max Level"
    }


def check_new_badges(stats: Dict[str, Any], current_badges: List[str]) -> List[Dict[str, Any]]:
    """Check which new badges the user has earned"""
    new_badges = []
    
    for badge_id, badge_def in BADGES.items():
        if badge_id not in current_badges and badge_def["criteria"](stats):
            new_badges.append({
                "id": badge_id,
                "name": badge_def["name"],
                "description": badge_def["description"],
                "icon": badge_def["icon"]
            })
    
    return new_badges


def calculate_streak(last_activity_date: datetime, current_streak: int) -> int:
    """Calculate current streak based on last activity"""
    if not last_activity_date:
        return 1
    
    now = datetime.utcnow()
    days_since_activity = (now - last_activity_date).days
    
    if days_since_activity == 0:
        # Same day, streak continues
        return current_streak
    elif days_since_activity == 1:
        # Next day, increment streak
        return current_streak + 1
    else:
        # Streak broken
        return 1


def calculate_xp_reward(action: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """Calculate XP reward for an action"""
    base_xp = XP_REWARDS.get(action, 0)
    bonus_xp = 0
    bonus_reasons = []
    
    if details:
        # Speed bonus
        if action.startswith("complete_") and action.endswith("_repair"):
            time_taken = details.get("time_taken_minutes", 0)
            if time_taken < 60:
                bonus_xp += XP_REWARDS["speed_bonus"]
                bonus_reasons.append("Speed Demon! (under 1 hour)")
        
        # Perfect completion bonus
        if details.get("completion_percentage", 0) == 100:
            bonus_xp += XP_REWARDS["perfect_completion"]
            bonus_reasons.append("Perfect Completion!")
        
        # First repair bonus
        if details.get("is_first_repair", False):
            bonus_xp += XP_REWARDS["first_repair_bonus"]
            bonus_reasons.append("First Repair Bonus!")
    
    total_xp = base_xp + bonus_xp
    
    return {
        "base_xp": base_xp,
        "bonus_xp": bonus_xp,
        "total_xp": total_xp,
        "bonus_reasons": bonus_reasons
    }
