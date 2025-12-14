# FixIntel AI - Complete Deployment Guide

## 📱 App Overview

**FixIntel AI** is an AI-powered repair guide application that helps users fix broken items through:
- AI image analysis using Gemini 2.5 Flash
- Step-by-step repair instructions with AI-generated infographics
- Tutorial video recommendations
- Local repair shop finder (Google Places API)
- Community features and repair tracking

---

## 🏗️ Architecture

### Frontend
- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based)
- **State Management**: React Context + AsyncStorage
- **UI**: Custom components with glassmorphism design

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **AI/ML**: Gemini 2.5, OpenAI gpt-image-1
- **APIs**: Google Places API

### Infrastructure
- **Frontend Port**: 3000 (Expo Dev Server)
- **Backend Port**: 8001 (FastAPI)
- **Database Port**: 27017 (MongoDB)

---

## 🚀 Quick Start Scripts

All commands run from the `/app` directory:

```bash
# Start both frontend and backend
npm start

# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend

# Build for production (iOS + Android)
npm run build:frontend

# Build for specific platform
npm run build:frontend:ios
npm run build:frontend:android

# Install all dependencies
npm run install:all

# Health check
npm run health-check
```

---

## 📦 Pre-Deployment Checklist

### 1. Environment Variables

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-xxxxx
GOOGLE_MAPS_API_KEY=AIzaSyB1y4k43R6NBjSEhWlGlSQeF2sXJ5LCDXM
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyB1y4k43R6NBjSEhWlGlSQeF2sXJ5LCDXM
```

### 2. API Keys Setup

**Emergent LLM Key**: ✅ Already configured
- Used for: Gemini AI, OpenAI image generation

**Google Places API Key**: ⚠️ Requires configuration
- Go to: https://console.cloud.google.com/apis/credentials
- Remove referer restrictions for server-side usage
- Enable: Places API, Maps JavaScript API, Geocoding API

**Stripe Keys**: ✅ Already configured
- Test/Live keys in place
- Webhook secret configured

### 3. Database Setup

**MongoDB**: ✅ Already configured
- Running locally on port 27017
- Database: test_database
- Collections: repair_sessions, community_posts, gamification_profiles

### 4. Assets Check

✅ App icon: `/app/frontend/assets/images/icon.png`
✅ Splash screen: `/app/frontend/assets/images/splash-icon.png`
✅ Adaptive icon: `/app/frontend/assets/images/adaptive-icon.png`

---

## 🏭 Deployment Options

### Option 1: EAS Build (Recommended for Mobile Apps)

**Prerequisites:**
```bash
npm install -g eas-cli
eas login
```

**Build Commands:**
```bash
cd /app/frontend

# Configure (first time only)
eas build:configure

# Build preview (for testing)
eas build --profile preview --platform all

# Build production (for stores)
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Build Time**: ~15-30 minutes per platform

**See**: `/app/frontend/EAS_BUILD_GUIDE.md` for detailed instructions

---

### Option 2: Expo Development Build

**For Development/Testing:**
```bash
cd /app/frontend
npx expo start --tunnel

# Scan QR code with Expo Go app
```

**Note**: Some features (camera, location) may not work in Expo Go. Use EAS development build for full functionality.

---

### Option 3: Backend Deployment

**Docker Deployment (Recommended):**

Create `Dockerfile` in `/app/backend`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Build and Run:**
```bash
docker build -t fixintel-backend .
docker run -p 8001:8001 --env-file .env fixintel-backend
```

---

### Option 4: MongoDB Deployment

**Local Development:**
```bash
mongod --dbpath /data/db --port 27017
```

**Production (MongoDB Atlas - Recommended):**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Get connection string
4. Update `MONGO_URL` in backend `.env`

---

## 🔐 Security Checklist

Before production deployment:

- [ ] Change all default credentials
- [ ] Use production MongoDB instance (not localhost)
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS for all API endpoints
- [ ] Rotate API keys if exposed
- [ ] Enable rate limiting on backend
- [ ] Configure CORS properly (restrict origins)
- [ ] Remove debug logging in production
- [ ] Enable backend authentication/authorization
- [ ] Secure webhook endpoints

---

## 🧪 Testing Before Launch

### Backend Testing:
```bash
# Health check
curl http://localhost:8001/api/

# Test image analysis
curl -X POST http://localhost:8001/api/analyze-repair \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...", "image_mime_type": "image/jpeg"}'

# Test local vendors
curl -X POST http://localhost:8001/api/find-local-vendors \
  -H "Content-Type: application/json" \
  -d '{"item_type": "iPhone", "latitude": 37.7749, "longitude": -122.4194}'
```

### Frontend Testing:
```bash
# Run on iOS simulator
cd frontend && npx expo run:ios

# Run on Android emulator
cd frontend && npx expo run:android

# Build preview and test on real device
eas build --profile preview --platform all
```

---

## 📊 Monitoring & Logs

### Backend Logs:
```bash
# View live logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# Or using npm script
npm run logs:backend
```

### Frontend Logs:
```bash
# View Expo logs
cd frontend && npx expo start

# In app: Shake device → "Show Dev Menu" → "Debug Remote JS"
```

### Production Monitoring:
- **Backend**: Use services like Sentry, LogRocket, or Datadog
- **Frontend**: Expo Analytics, Firebase Crashlytics
- **Database**: MongoDB Atlas monitoring

---

## 🔄 OTA Updates (Over-The-Air)

After initial app store release, push updates without rebuilding:

```bash
cd /app/frontend

# Create update
eas update --branch production --message "Bug fix: Improved GPS accuracy"

# Users get update on next app restart
```

**Note**: Only works for JavaScript changes, not native code.

---

## 🎯 Launch Day Checklist

**24 Hours Before:**
- [ ] Final testing on real devices (iOS + Android)
- [ ] Verify all API endpoints are responding
- [ ] Check database connections
- [ ] Test payment flow (Stripe)
- [ ] Verify push notifications work
- [ ] Review app store listings (screenshots, description)

**Launch Day:**
- [ ] Submit final builds to stores
- [ ] Monitor error logs
- [ ] Check server capacity/load
- [ ] Test on multiple devices
- [ ] Prepare customer support materials
- [ ] Monitor user feedback

**Post-Launch:**
- [ ] Respond to app store reviews
- [ ] Monitor crash reports
- [ ] Track user analytics
- [ ] Plan OTA updates for quick fixes
- [ ] Gather user feedback for improvements

---

## 🆘 Common Issues & Solutions

### Issue: "Google Places API not working"
**Solution**: Update API key restrictions to allow server-side usage

### Issue: "GPS location not found"
**Solution**: Check location permissions in app settings

### Issue: "Image analysis failing"
**Solution**: Verify EMERGENT_LLM_KEY is valid and has credits

### Issue: "Backend not accessible from mobile"
**Solution**: Check EXPO_PUBLIC_BACKEND_URL is correct and accessible

### Issue: "Build failing on EAS"
**Solution**: Check eas.json configuration and app.json settings

---

## 📞 Support Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Expo Forums**: https://forums.expo.dev/
- **GitHub Issues**: https://github.com/fixintel/fixintel-ai/issues

---

## 📈 Scaling Considerations

### Backend Scaling:
- Use load balancer (Nginx, AWS ALB)
- Deploy multiple FastAPI instances
- Enable Redis caching for API responses
- Use CDN for static assets

### Database Scaling:
- MongoDB sharding for large datasets
- Read replicas for improved performance
- Index optimization

### Frontend Scaling:
- Use EAS Update channels for staged rollouts
- Implement feature flags
- A/B testing with Expo experiments

---

## 🎉 Ready to Launch!

Your FixIntel AI app is configured and ready for deployment. Follow the steps above to build, test, and submit to the App Store and Google Play Store.

**Good luck with your launch! 🚀**

---

*Last Updated: December 2024*
*Version: 1.0.0*
