# FixIntel AI - AI-Powered Repair Guide App

<div align="center">

**Transform broken items into repair opportunities with AI**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/fixintel/fixintel-ai)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020.svg?logo=expo)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg?logo=mongodb)](https://www.mongodb.com)

</div>

---

## 📱 What is FixIntel AI?

FixIntel AI is a comprehensive mobile repair guide application that leverages artificial intelligence to help users diagnose and fix broken items. Take a photo, get instant AI analysis, and receive detailed step-by-step repair instructions with visual guides.

---

## ⚡ Quick Start

```bash
# Install dependencies
npm run install:all

# Start development servers
npm start

# Or start individually
npm run start:backend    # FastAPI on :8001
npm run start:frontend   # Expo on :3000
```

---

## 🚀 Key Features

- 🤖 **AI Image Analysis** - Gemini 2.5 Flash for expert diagnostics
- 📊 **Visual Infographics** - Auto-generated repair diagrams
- 🎥 **Tutorial Videos** - AI-curated YouTube guides
- 📍 **Local Pros Finder** - Google Places integration
- 💾 **Progress Tracking** - Save and manage repairs
- 📄 **PDF Export** - Download guides offline
- 🌐 **Community** - Share before/after results

---

## 📁 Project Structure

```
/app
├── backend/          # FastAPI + MongoDB
├── frontend/         # React Native + Expo
├── package.json      # Root scripts
├── DEPLOYMENT_GUIDE.md
└── EAS_BUILD_GUIDE.md
```

---

## 🛠️ Tech Stack

**Frontend**: React Native, Expo, TypeScript  
**Backend**: FastAPI, Python, MongoDB  
**AI/ML**: Gemini 2.5, OpenAI gpt-image-1  
**APIs**: Google Places, Stripe

---

## 📚 Documentation

- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [EAS Build Instructions](./frontend/EAS_BUILD_GUIDE.md)
- [API Docs](http://localhost:8001/docs) (when running)

---

## 🚢 Deployment

### Mobile Apps
```bash
npm run build:frontend           # Build for iOS + Android
npm run build:frontend:ios       # iOS only
npm run build:frontend:android   # Android only
```

### Submit to Stores
```bash
npm run submit:ios      # Apple App Store
npm run submit:android  # Google Play Store
```

---

## 📄 License

MIT License - See [LICENSE](./LICENSE)

---

<div align="center">

**Built with ❤️ using Expo, FastAPI, and AI**

</div>
