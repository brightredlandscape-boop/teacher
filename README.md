# EduBridge Africa — Education Platform

EduBridge Africa connects verified African educators with global parent markets. The platform includes secure credit card checkouts, multi-language support (English, French, Swahili), biometric validation checks, escrow scheduling, an AI customer support bot, and parents affiliate/referral portals.

---

## Tech Stack
- **Frontend**: React 19, Tailwind CSS v3.4.17, GSAP 3 (ScrollTrigger)
- **Backend**: Node.js, Express, Native `crypto` credentials hashing
- **Database**: Lightweight JSON-based local DB (`server/db.js`)
- **Mobile**: React Native / Expo scaffold (`/mobile`)

---

## Quick Start Guide

### 1. Install Workspace Dependencies
Make sure node modules are installed in both root and mobile workspace folders:
```bash
# Main Project (Frontend & Backend Server)
npm install

# Mobile App
cd mobile
npm install
```

### 2. Startup Server & Client
Execute the concurrent developer workspace boot command:
```bash
npm run dev
```
- Frontend starts on: `http://localhost:5173/`
- Backend API starts on: `http://localhost:5000/`

---

## Sharing Your Project (Local Tunnels)
To share a temporary live view of your local environment to external test users, run:
```bash
node bin/tunnel.js
```
This spawns a secure proxy forwarding `http://localhost:5173` to a public shareable HTTPS link.

Alternatively, execute `localtunnel` or `ngrok` manually:
```bash
# Using Localtunnel
npx localtunnel --port 5173

# Using ngrok
ngrok http 5173
```

---

## Phase 6 Integration Highlights
1. **Multilingual System**: Select Swahili or French adjacent to the top-bar currency selectors.
2. **School B2B API Suite**: API access key control center resides in the Admin portal tab. Integration endpoints are queryable under `/api/b2b/schools/*`.
3. **Affiliate portals**: Parents can access referral stats, conversion listings, and commissions from their parent panel.
4. **Mobile app**: Expo React Native scaffold inside `/mobile` folder.
