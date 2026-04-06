# Full-Stack Task Management Application

A full-stack task management web application built with React, Node.js, Express, and Firebase.

## Prerequisites
- Node.js (v18+)
- Firebase Project (Auth and Firestore enabled)

## Structure
- `/backend`: Node.js Express REST API, Firebase Admin SDK
- `/frontend`: React + TypeScript UI, Vite, Firebase Client SDK

## Setup & Running

### 1. Backend Setup
```bash
cd backend
npm install
```
- Set up environment variables in `backend/.env`:
  ```env
  PORT=5000
  FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "YOUR_PROJECT_ID", ...}'
  ```
- Start the development server:
  ```bash
  npm run dev
  ```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
- Set up environment variables in `frontend/.env`:
  ```env
  VITE_FIREBASE_API_KEY="..."
  VITE_FIREBASE_AUTH_DOMAIN="..."
  VITE_FIREBASE_PROJECT_ID="..."
  VITE_FIREBASE_STORAGE_BUCKET="..."
  VITE_FIREBASE_MESSAGING_SENDER_ID="..."
  VITE_FIREBASE_APP_ID="..."
  VITE_API_URL="http://localhost:5000/api"
  ```
- Start Vite dev server:
  ```bash
  npm run dev
  ```
