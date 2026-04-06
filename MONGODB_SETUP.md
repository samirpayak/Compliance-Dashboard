# MongoDB Backend Setup Guide

## ✅ Status
Your SEBI Compliance Dashboard now has a **full MongoDB backend** with automatic Vercel deployment.

---

## How It Works

### 1. **Frontend + Backend Architecture**
```
Your Computer (Frontend) 
    ↓ (HTTPS API calls)
Vercel Serverless API (Backend)
    ↓ (Connection)
MongoDB Atlas Cloud Database
```

### 2. **Data Sync Process**
When you login or make changes:
1. Frontend tries to call the API endpoint
2. API queries MongoDB database
3. Data syncs automatically to other devices
4. If API is unavailable, app falls back to localStorage (works offline)

---

## MongoDB Connection

**Database:** MongoDB Atlas (Cloud)  
**Connection String:** Embedded in `vercel.json` and `.env.production`  
**Status:** ✅ Ready to use

---

## Vercel Deployment

Your backend is deployed as a **serverless function** at:
```
https://your-vercel-app.vercel.app/api/
```

### Health Check
Test if your API is working:
```
https://your-vercel-app.vercel.app/api/health
```
Should return:
```json
{
  "status": "ok",
  "mongoDBConnected": true,
  "message": "SEBI Compliance Dashboard API"
}
```

---

## API Endpoints

All data syncs to MongoDB through these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check API status |
| `/api/data` | GET | Load all data (tasks, statuses, etc) |
| `/api/tasks` | GET, POST | CRUD tasks |
| `/api/team-members` | GET, POST | Manage team members |
| `/api/team-members/login` | POST | Login team member |
| `/api/admin/login` | POST | Login admin |
| `/api/statuses` | GET, POST | Update task status |
| `/api/activity-log` | GET, POST | Track changes |

---

## Features Using MongoDB

✅ **Synced across devices:**
- Tasks (add, edit, delete)
- Task status updates
- Team member management
- Activity logs
- Admin password

✅ **Fallback to localStorage if offline:**
- All features work locally
- Data syncs when API comes back online
- Automatic reconciliation

---

## Testing MongoDB

### Admin Login Test
1. Go to your app URL
2. Click "Login as Admin"
3. Enter password: `admin123`
4. Open browser Console (F12 → Console)
5. You should see: `✅ Logged in as Admin via MongoDB`

### Team Member Test
1. Click "Team Members" button
2. Add a new team member (e.g., "john" / "pass123")
3. Console should show: `✅ Added team member to MongoDB`
4. Open your app on a **different device**
5. Login as that team member
6. They should appear automatically (synced from MongoDB)

---

## If API is Not Working

If `/api/health` returns an error:

1. **Check Vercel Status**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Check "Deployments" tab for errors

2. **Check MongoDB Connection**
   - Go to: https://cloud.mongodb.com
   - Verify cluster is running
   - Check Network Access includes Vercel IPs

3. **Check Logs**
   - In Vercel: Deployments → Select latest → Function Logs
   - Look for "MongoDB Connected" message

4. **Fallback**
   - While API is down, everything still works locally
   - Use Export/Import button to share data between devices

---

## Re-Deploy (If Needed)

If you make changes locally:

```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel auto-deploys within 1-2 minutes.

---

## Data Structure (MongoDB Collections)

Your MongoDB database stores:

```javascript
// Tasks Collection
{
  _id: ObjectId,
  category: "SEBI Compliance",
  task: "Task name",
  due: "DD.MM.YYYY",
  type: "Type",
  assignedTo: "team member name"
}

// Team Members Collection
{
  _id: ObjectId,
  username: "john",
  passwordHash: "hashed_password"
}

// Admin Collection
{
  key: "admin",
  passwordHash: "hashed_password"
}

// Activity Log Collection
{
  taskId: "task-123",
  taskName: "Task name",
  status: "Completed",
  by: "Admin",
  at: "2024-04-06T10:30:00Z"
}
```

---

## Security Notes

- ✅ Passwords are hashed (not stored in plain text)
- ✅ CORS enabled for your app only
- ✅ Vercel serverless runs securely
- ✅ MongoDB connection encrypted
- ⚠️ Change default admin password immediately in app Settings

---

## Troubleshooting

**Q: Other team members can't login?**
- A: Check API health endpoint first
- If OK: They might have the old instance cached, refresh browser

**Q: Data not syncing?**
- A: Check `/api/health` endpoint
- If API is down, use Export/Import manually

**Q: Getting errors in console?**
- A: Open F12 → Console tab
- Share error messages if needed

**Q: Want to delete all data?**
- A: Contact MongoDB Atlas support or use admin panel (coming soon)

---

## Next Steps

1. ✅ Test admin login with password `admin123`
2. ✅ Add a team member
3. ✅ Login as that team member from a different device
4. ✅ Add a task and verify it appears elsewhere
5. ✅ Share this dashboard with your team!

---

**Your API is live and ready to use!** 🎉
