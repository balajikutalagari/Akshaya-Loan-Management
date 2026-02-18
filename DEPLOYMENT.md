# Deployment Guide

## Overview
This guide explains how to deploy your loan management system with:
- **Backend**: Hosted on Vercel (or locally on port 3001)
- **Frontend**: Desktop app using Pear Platform

## Backend Deployment Options

### Option 1: Local Backend (Default)
1. Start the backend locally:
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3001`

### Option 2: Deploy Backend to Vercel
1. Create a Vercel account at https://vercel.com

2. Prepare backend for Vercel:
   ```bash
   cd backend
   npm install -g vercel
   vercel
   ```

3. Follow the prompts to deploy your backend

4. Once deployed, note your backend URL (e.g., `https://your-app.vercel.app`)

## Frontend Desktop App with Pear

### Configuration

1. If using Vercel backend, create a `.env` file in the frontend directory:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env` and set your Vercel backend URL:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

3. Rebuild the frontend with the new configuration:
   ```bash
   npm run build
   ```

### Running the Desktop App

1. Test locally in development mode:
   ```bash
   pear run --dev .
   ```

2. Build the Pear app:
   ```bash
   pear build .
   ```

3. Stage the app for publishing:
   ```bash
   pear stage --json <channel-name>
   ```

4. Publish to Pear network:
   ```bash
   pear publish
   ```

5. Share your app URL with users. They can run:
   ```bash
   pear run pear://<your-app-key>
   ```

## Important Notes

- The frontend is built as a static site and embedded in the Pear desktop app
- The backend must have CORS enabled to accept requests from the Pear app
- Users need Pear Runtime installed to run the desktop app
- The app will work with either local backend (localhost:3001) or Vercel backend

## Troubleshooting

### Frontend can't connect to backend
- Check that backend is running (local) or deployed (Vercel)
- Verify the API URL in frontend `.env` file
- Ensure CORS is properly configured in backend

### Pear app won't start
- Ensure frontend is built: `cd frontend && npm run build`
- Check that all Pear dependencies are installed
- Try running in dev mode first: `pear run --dev .`

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure you're using compatible Node.js version (16+)