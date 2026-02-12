# Deployment Configuration Guide

## Environment Variables

### Backend (.env in root directory)
```bash
FRONTEND_URL=http://YOUR_SERVER_IP:5173
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DATABASE_FILE=inventory.db
```

### Frontend (.env in frontend directory)
```bash
VITE_API_URL=http://YOUR_SERVER_IP:8000
```

## Deployment Steps

### 1. For Production Server
1. Copy `.env.example` to `.env` in root directory
2. Update `FRONTEND_URL` with your production server IP/domain
3. Copy `frontend/.env` and update `VITE_API_URL` with backend URL
4. Rebuild frontend: `npm run build`
5. Restart backend: `uvicorn main:app --host 0.0.0.0 --port 8000`

### 2. For Local Development  
Current configuration is already set for local IP `10.0.2.183`

## Files Changed
- `main.py` - Uses `FRONTEND_URL` from .env
- `frontend/src/utils/config.js` - Uses `VITE_API_URL` from .env
- `.env` - Backend configuration
- `frontend/.env` - Frontend configuration
