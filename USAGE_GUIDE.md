# 📱 How to Use: Start Repair & Save for Later

## Step-by-Step Guide

### 1. Capture or Select an Image
- Open the **Pix-Fix** app
- Go to the **Home** tab
- Tap **"Take Photo"** or **"Gallery"**
- Select/capture an image of your broken item

### 2. AI Analysis
- Wait for AI to analyze the image (5-10 seconds)
- The app will identify the item and generate a repair guide

### 3. View Repair Instructions
- A modal will appear showing:
  - Item type and damage description
  - Repair difficulty and estimated time
  - Tabs: Instructions, Tools & Parts, Safety
  - Checkable repair steps with "More Help" buttons

### 4. Save Your Repair (NEW!)

Scroll down in the repair modal to find the new section:

```
┌─────────────────────────────────────┐
│   Save This Repair                  │
│   Track your progress or save for   │
│   future reference                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🔧  Start Repair             │ │
│  │      Begin tracking progress   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  📌  Save for Later           │ │
│  │      Bookmark for future use   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Option A: Start Repair (Active Tracking)
- Tap the **"Start Repair"** button (bright cyan/blue)
- The repair will be saved with an auto-generated title
- Perfect for repairs you're about to begin
- Tracks progress as you complete steps
- Appears in "My Repairs" with progress bar

#### Option B: Save for Later (Bookmark)
- Tap the **"Save for Later"** button (outlined)
- The repair will be bookmarked for future reference
- Perfect for repairs you want to do later
- Easy to find and reference when needed
- Appears in "My Repairs" with 0% progress

### 5. Track Your Progress
- Navigate to the **Progress** tab
- See all your saved repairs:
  - **Total Repairs** count
  - **Completed** repairs
  - **In Progress** repairs
- Each repair card shows:
  - Auto-generated title
  - Notes/description
  - Save date
  - Progress percentage
  - Action buttons: "View Details" & "Continue"

### 6. Continue a Repair
- In the Progress tab, tap **"Continue"** on any repair
- (Feature to be implemented: Resume from where you left off)

## Auto-Generated Titles

The app automatically creates titles based on AI analysis:

**Examples:**
- "Smartphone - Cracked screen and damaged frame"
- "Laptop - Broken keyboard keys and sticky trackpad..."
- "Bicycle - Flat tire and damaged rim"
- "Coffee Maker - Water leaking from bottom seal"

Titles are capped at 50 characters for easy reading.

## Offline Support

✅ **Works Without Internet!**
- All repairs are saved to your device automatically
- Use AsyncStorage for persistent local storage
- When back online, data syncs with the backend
- No data loss even if the app closes unexpectedly

## Tips & Best Practices

1. **Start Repair** for immediate projects
   - You're ready to begin now
   - Want to track completion progress
   - Need to check off steps as you go

2. **Save for Later** for future projects
   - Need to order parts first
   - Want to research more
   - Planning to do it this weekend
   - Just exploring repair options

3. **Pull to Refresh**
   - On the Progress page, pull down to refresh
   - Syncs latest data from backend and local storage

4. **Check Steps in Real-Time**
   - While viewing instructions, tap checkboxes
   - Your progress automatically updates
   - (Currently visual only, backend update coming soon)

## Where to Find Your Repairs

**Progress Tab → My Repairs**
- All saved repairs appear here
- Sorted by most recent first
- Shows complete repair information
- Access anytime, even offline

## Common Questions

**Q: What happens if I tap both buttons?**
A: The repair will be saved twice with different timestamps. Generally, use one button per repair.

**Q: Can I edit the auto-generated title?**
A: Not yet, but this feature is planned for a future update.

**Q: How do I delete a saved repair?**
A: Swipe-to-delete is coming in a future update.

**Q: Does it work on airplane mode?**
A: Yes! All saves work offline and sync when you're back online.

**Q: Can I see the original image I captured?**
A: The repair diagram is stored, and full image history is planned for a future update.

---

**Need Help?** 
Visit Settings → Help & Support for more information.
