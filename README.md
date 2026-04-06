# SEBI Compliance Dashboard

A compliance tracking dashboard for SEBI registered entities — April 2026.

## Features
- **Admin Panel**: Add/remove tasks, view all status updates, activity log
- **Team Member Panel**: Update task status (Pending → In Progress → Done → Overdue)
- **8 Entity Categories**: PMS, AIF, Investment Advisers, Research Analysts, Merchant Banking, Depository Participant, Stock Broking, Mutual Fund Distributor
- **120+ Pre-loaded Tasks** from SEBI compliance calendar
- **Filters**: By category, status, and search
- **Activity Log**: Track who updated what and when

## Deploy to Vercel

### Option 1: Via GitHub (Recommended)
1. Create a new repository on GitHub
2. Push this project to the repository
3. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
4. Click **Deploy** (no settings changes needed)
5. Done! Share the live URL with your team

### Option 2: Via Vercel CLI
```bash
npm i -g vercel
cd compliance-dashboard
vercel
```

## Data Storage
This app uses browser localStorage. Each user's browser stores data independently.
