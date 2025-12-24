# Fix Stuff - Backend Deployment Guide

## Deploy to Railway (Recommended)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub and select the repository
4. Select the `/backend` directory as the root

### Step 3: Add Environment Variables
In Railway dashboard, go to Variables and add:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key (optional, for diagram generation)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key (for local vendors)
```

### Step 4: Add MongoDB
1. Click "New" → "Database" → "MongoDB"
2. Railway will automatically create `MONGO_URL` variable
3. Add `DB_NAME=fix_stuff` variable

### Step 5: Deploy
Railway will automatically deploy when you push to GitHub.

### Step 6: Get Your Backend URL
After deployment, Railway provides a URL like:
`https://your-app.up.railway.app`

### Step 7: Update Frontend
Update the frontend `.env` file with your Railway backend URL:
```
EXPO_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
```

---

## Alternative: Deploy to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Step 3: Add Environment Variables
Same as Railway - add all required API keys.

### Step 4: Add MongoDB
Use MongoDB Atlas for free cloud MongoDB:
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add as `MONGO_URL` in Render

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Google Gemini API key for AI analysis |
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name (default: fix_stuff) |
| `OPENAI_API_KEY` | No | OpenAI key for diagram generation |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps/Places API for local vendors |

## Testing Deployment

After deploying, test the API:
```bash
curl https://your-backend-url/api/
```

Expected response:
```json
{"message": "FixIt Pro API", "version": "1.0.0"}
```
