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

// MongoDB Connection with better error handling
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://csjaykular_db_user:xrbbrSgVfRIWJLlE@cluster7.2jtwbga.mongodb.net/?appName=Cluster7';

console.log('🔗 Attempting MongoDB connection...');
console.log(`🌐 URI: ${MONGO_URI.substring(0, 30)}...`);

let mongoConnected = false;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
}).then(async () => {
  mongoConnected = true;
  console.log('✅ MongoDB Connected Successfully');
  
  // Log database status
  try {
    const taskCount = await Task.countDocuments();
    const memberCount = await TeamMember.countDocuments();
    console.log(`📊 Database Status: ${taskCount} tasks, ${memberCount} team members`);
  } catch (err) {
    console.error('⚠️ Could not count documents:', err.message);
  }
}).catch(err => {
  mongoConnected = false;
  console.error('❌ MongoDB Connection Error:', err.message);
  console.error('❌ Database operations will fail until connection is restored');
});

// ─── SCHEMAS ───
const TaskSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  category: String,
  task: String,
  due: String,
  type: String,
  assignedTo: { type: String, default: 'all' },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const StatusSchema = new mongoose.Schema({
  taskId: { type: String, unique: true, sparse: true },
  status: String,
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
});

const ActivityLogSchema = new mongoose.Schema({
  taskId: String,
  taskName: String,
  status: String,
  by: String,
  at: { type: Date, default: Date.now }
});

const TeamMemberSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  key: { type: String, default: 'admin', unique: true, sparse: true },
  passwordHash: String,
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Task = mongoose.model('Task', TaskSchema);
const Status = mongoose.model('Status', StatusSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// Middleware to check MongoDB connection
const checkMongoConnection = (req, res, next) => {
  if (!mongoConnected) {
    console.warn('⚠️ Request received but MongoDB not connected');
    return res.status(503).json({ 
      error: 'Database not connected. Please try again in a moment.',
      status: 'no-db'
    });
  }
  next();
};

// ─── API ROUTES ───

// Get all data (for initial load)
app.get('/api/data', checkMongoConnection, async (req, res) => {
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
app.post('/api/tasks', checkMongoConnection, async (req, res) => {
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
app.patch('/api/tasks/:id/assign', checkMongoConnection, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      console.warn(`⚠️ Missing assignedTo for task ${taskId}`);
      return res.status(400).json({ error: 'assignedTo is required' });
    }
    
    console.log(`\n📝 ═══════════════════════════════════════`);
    console.log(`📋 Assignment Request: taskId=${taskId}, assignedTo=${assignedTo}`);
    console.log(`🔍 Querying MongoDB for task with id="${taskId}"`);
    
    // First, check if task exists
    const taskExists = await Task.findOne({ id: taskId });
    if (!taskExists) {
      console.warn(`❌ Task "${taskId}" NOT FOUND! Checking available IDs...`);
      const allIds = await Task.find().select('id').limit(10);
      console.warn(`📌 Sample task IDs in DB: ${allIds.map(t => t.id).join(', ')}`);
      return res.status(404).json({ 
        error: `Task not found: ${taskId}`,
        available: allIds.map(t => t.id)
      });
    }
    
    console.log(`✓ Task exists, updating assignment...`);
    
    // Find and update the task
    const task = await Task.findOneAndUpdate(
      { id: taskId },
      { 
        assignedTo: assignedTo, 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!task) {
      console.error(`❌ findOneAndUpdate returned null for task ${taskId}`);
      return res.status(500).json({ error: 'Update query failed' });
    }
    
    // Verify the update worked
    if (task.assignedTo !== assignedTo) {
      console.error(`❌ Update verification failed: expected ${assignedTo}, got ${task.assignedTo}`);
      return res.status(500).json({ error: 'Assignment verification failed' });
    }
    
    console.log(`✅ SUCCESS! Task ${taskId} → ${assignedTo}`);
    console.log(`═══════════════════════════════════════\n`);
    res.json(task);
  } catch (err) {
    console.error(`❌ Assignment error: ${err.message}`);
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Assignment failed',
      message: err.message,
      type: err.name
    });
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
