# SportZone — Modern Sports Viewing Centre Platform

## Project Structure
```
sportzone/
├── frontend/          # React + Tailwind CSS
└── backend/           # Python Flask REST API
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in your secrets
flask db upgrade
flask seed                     # seeds venue + seats
flask run
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # set VITE_API_URL
npm run dev
```

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/sportzone
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-key
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
HMAC_SECRET=your-ticket-hmac-secret
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env.local`
```
VITE_API_URL=https://sportzone-4miu.onrender.com/
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```
