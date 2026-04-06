const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://csjaykular_db_user:xrbbrSgVfRIWJLlE@cluster7.2jtwbga.mongodb.net/?appName=Cluster7';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ MongoDB Connected');
  // Log database status
  try {
    const taskCount = await mongoose.model('Task').countDocuments();
    const memberCount = await mongoose.model('TeamMember').countDocuments();
    console.log(`📊 Database Status: ${taskCount} tasks, ${memberCount} team members`);
  } catch (err) {
    console.error('⚠️ Could not count documents:', err.message);
  }
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// ─── SCHEMAS ───
const TaskSchema = new mongoose.Schema({
  id: String,
  category: String,
  task: String,
  due: String,
  type: String,
  assignedTo: { type: String, default: 'all' },
  createdAt: { type: Date, default: Date.now }
});

const StatusSchema = new mongoose.Schema({
  taskId: String,
  status: String,
  updatedBy: String,
  updatedAt: Date
});

const ActivityLogSchema = new mongoose.Schema({
  taskId: String,
  taskName: String,
  status: String,
  by: String,
  at: Date
});

const TeamMemberSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  key: { type: String, default: 'admin', unique: true },
  passwordHash: String,
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Task = mongoose.model('Task', TaskSchema);
const Status = mongoose.model('Status', StatusSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// ─── API ROUTES ───

// Get all data (for initial load)
app.get('/api/data', async (req, res) => {
  try {
    const tasks = await Task.find().lean();
    const statuses = await Status.find().lean();
    const activityLog = await ActivityLog.find().sort({ at: -1 }).limit(200).lean();
    const teamMembers = await TeamMember.find({}, 'username -_id').lean();
    
    // Get admin password hash
    const admin = await Admin.findOne({ key: 'admin' }).lean();
    const adminPassword = admin?.passwordHash || '39c43b7d';
    
    console.log(`📤 Returning ${tasks.length} tasks, ${teamMembers.length} team members`);
    
    // Check if any tasks have assignments
    const assignedTasks = tasks.filter(t => t.assignedTo && t.assignedTo !== 'all').length;
    if (assignedTasks > 0) {
      console.log(`📌 ${assignedTasks} tasks have specific assignments`);
    }
    
    res.json({
      tasks,
      statuses,
      activityLog,
      teamMembers: teamMembers.map(t => t.username),
      adminPassword
    });
  } catch (err) {
    console.error('❌ Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    
    if (!taskData.id) {
      return res.status(400).json({ error: 'Task id is required' });
    }
    
    console.log(`📥 Adding task: ${taskData.id} - ${taskData.task}`);
    
    const task = new Task({
      ...taskData,
      createdAt: new Date()
    });
    
    const saved = await task.save();
    console.log(`✅ Task saved: ${saved.id}`);
    res.json(saved);
  } catch (err) {
    console.error('❌ Task creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task assignment
app.patch('/api/tasks/:id/assign', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo is required' });
    }
    
    console.log(`📝 Updating task ${taskId} assignment to ${assignedTo}`);
    
    // Find and update the task
    const task = await Task.findOneAndUpdate(
      { id: taskId },
      { assignedTo: assignedTo, updatedAt: new Date() },
      { new: true }
    );
    
    if (!task) {
      console.error(`❌ Task ${taskId} not found in MongoDB`);
      return res.status(404).json({ error: `Task ${taskId} not found` });
    }
    
    console.log(`✅ Task ${taskId} assigned to ${assignedTo}`);
    res.json(task);
  } catch (err) {
    console.error('❌ Assignment update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.deleteOne({ id: req.params.id });
    await Status.deleteOne({ taskId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.post('/api/statuses', async (req, res) => {
  try {
    const { taskId, status, updatedBy, updatedAt } = req.body;
    const s = await Status.findOneAndUpdate(
      { taskId },
      { taskId, status, updatedBy, updatedAt },
      { upsert: true, new: true }
    );
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all statuses
app.get('/api/statuses', async (req, res) => {
  try {
    const statuses = await Status.find();
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add activity log
app.post('/api/activity-log', async (req, res) => {
  try {
    const log = new ActivityLog(req.body);
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get activity log
app.get('/api/activity-log', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ at: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add team member
app.post('/api/team-members', async (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    
    // Check if already exists
    const exists = await TeamMember.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const member = new TeamMember({ username, passwordHash });
    await member.save();
    res.json({ username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get team members
app.get('/api/team-members', async (req, res) => {
  try {
    const members = await TeamMember.find({}, 'username -_id');
    res.json(members.map(m => m.username));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify team member login
app.post('/api/team-members/login', async (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    const member = await TeamMember.findOne({ username });
    
    if (member && member.passwordHash === passwordHash) {
      res.json({ success: true, username });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove team member
app.delete('/api/team-members/:username', async (req, res) => {
  try {
    await TeamMember.deleteOne({ username: req.params.username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set admin password
app.post('/api/admin/password', async (req, res) => {
  try {
    const { passwordHash } = req.body;
    const admin = await Admin.findOneAndUpdate(
      { key: 'admin' },
      { passwordHash, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify admin password
app.post('/api/admin/login', async (req, res) => {
  try {
    const { passwordHash } = req.body;
    const admin = await Admin.findOne({ key: 'admin' });
    
    if (admin && admin.passwordHash === passwordHash) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const mongoConnected = mongoose.connection.readyState === 1;
    
    let dbStats = {};
    if (mongoConnected) {
      dbStats = {
        tasks: await Task.countDocuments(),
        teamMembers: await TeamMember.countDocuments(),
        statuses: await Status.countDocuments(),
        activityLogs: await ActivityLog.countDocuments()
      };
    }
    
    res.json({ 
      status: mongoConnected ? 'healthy' : 'not-connected',
      message: 'SEBI Compliance Dashboard API',
      mongoDBConnected: mongoConnected,
      database: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export for Vercel
module.exports = app;
