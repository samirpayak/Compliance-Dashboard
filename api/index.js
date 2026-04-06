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

// ─── SCHEMAS (MUST BE DEFINED BEFORE CONNECTION) ───
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

// Models (DEFINE BEFORE USING IN CONNECTION CALLBACK)
const Task = mongoose.model('Task', TaskSchema);
const Status = mongoose.model('Status', StatusSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// Default tasks data - COMPLETE SEBI COMPLIANCE TASK LIST
const DEFAULT_TASKS = [
  // ── PMS ──
  {id:"pms-1",category:"PMS",task:"Disclosure of Investor Charter & Investor Complaints by Portfolio Managers on their websites",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-2",category:"PMS",task:"Monthly Report Submission to SEBI & APMI (within 7 working days)",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-3",category:"PMS",task:"Submission of Quarterly Offsite Inspection Data to SEBI – Quarterly",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-4",category:"PMS",task:"Self-Certification of Code of Conduct Compliance from Distributor of the Portfolio Manager",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-5",category:"PMS",task:"Conduct Accessibility Audit for digital platforms as per SEBI Circular – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-6",category:"PMS",task:"Sending Quarterly Report to Clients (Portfolio Performance Report)",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-7",category:"PMS",task:"Submission of Corporate Governance Report",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-8",category:"PMS",task:"Submission of Undertaking on Compliance of SaaS-based Solutions Advisory for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-9",category:"PMS",task:"Disclosure of registered name and registration number by SEBI regulated entities on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-10",category:"PMS",task:"Offsite monitoring of qualitative compliance aspects through Compliance Monitoring Module (CMM)",due:"30.05.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-11",category:"PMS",task:"Annual Compliance Certificate under PMS Regulations and SEBI Circulars – Signed by Principal Officer",due:"30.05.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-12",category:"PMS",task:"Issuance of Firm Level Performance Audit Report by Independent Auditor",due:"30.05.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-13",category:"PMS",task:"Submission of Firm-Level Compliance Audit Report by Director/Partners",due:"30.05.2026",type:"fixed",assignedTo:"all"},
  {id:"pms-14",category:"PMS",task:"Quarterly report on compliance with SEBI regulations presented to the Board",due:"During Board Meeting",type:"fixed",assignedTo:"all"},
  
  // ── AIF ──
  {id:"aif-1",category:"AIF",task:"Quarterly Compilation and submission of data on Investor Complaints",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-2",category:"AIF",task:"Conduct Accessibility Audit for digital platforms as per SEBI Circular – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-3",category:"AIF",task:"Disclosure of NAV of scheme(s) of Category III AIF (close-ended fund)",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-4",category:"AIF",task:"Disclosure of NAV of scheme(s) of Category III AIF (open-ended fund) – Ideally within a month",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-5",category:"AIF",task:"Preparation and submission of Compliance Test Report (CTR) on compliance with AIF Regulations & circulars",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-6",category:"AIF",task:"Disclosure on any change in terms of Private Placement Memorandum / fund documents (consolidated basis)",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-7",category:"AIF",task:"Monthly Reporting of investor-wise KYC details of units held in Aggregate Escrow Demat Account to Depositories and Custodians",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-8",category:"AIF",task:"Submission of Undertaking on Compliance of SaaS-based Solutions Advisory for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-9",category:"AIF",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-10",category:"AIF",task:"Reporting of value of units of AIFs to Depositories (upload latest NAV per ISIN before May 01, 2026)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  {id:"aif-11",category:"AIF",task:"Submission of Annual Activity Report (SEBI Circular dated March 04, 2026)",due:"31.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Investment Advisers ──
  {id:"ia-1",category:"Investment Advisers",task:"Disclosure of Investor Charter & Investor Advisers Complaints on websites",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ia-2",category:"Investment Advisers",task:"Conduct Accessibility Audit for digital platforms as per SEBI Circular – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ia-3",category:"Investment Advisers",task:"Half-Yearly Periodic Reporting to IAASB for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ia-4",category:"Investment Advisers",task:"Submission of Undertaking on Compliance of SaaS-based Solutions Advisory for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ia-5",category:"Investment Advisers",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Research Analysts ──
  {id:"ra-1",category:"Research Analysts",task:"Disclosure of Investor Charter & Investor Complaint Data on website/mobile application",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ra-2",category:"Research Analysts",task:"Conduct Accessibility Audit for digital platforms as per SEBI Circular – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ra-3",category:"Research Analysts",task:"Submission of Half-Yearly Periodic Reporting to RAASB for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ra-4",category:"Research Analysts",task:"Submission of Undertaking on Compliance of SaaS-based Solutions Advisory for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"ra-5",category:"Research Analysts",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Merchant Banking ──
  {id:"mb-1",category:"Merchant Banking",task:"Disclosure of Investor Charter & Investor Complaint Data on website of the Merchant Banker",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"mb-2",category:"Merchant Banking",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Depository Participant ──
  {id:"dp-1",category:"Depository Participant",task:"Doing away with requirement of issuance of LOC and to effect direct credit of securities in demat account",due:"02.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-2",category:"Depository Participant",task:"Extension of Timeline for Upload of Client KYC Records to KRAs for Validation",due:"03.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-3",category:"Depository Participant",task:"Creation/Invocation of pledge of securities through Depository System",due:"06.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-4",category:"Depository Participant",task:"Publishing of Investor Charter & Investor Complaints by DPs on website/mobile application",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-5",category:"Depository Participant",task:"Submission of Regulatory Freeze and Unfreeze Order details through NSDL e-PASS portal (including Nil report) – Monthly",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-6",category:"Depository Participant",task:"Online submission of Investor Grievance (IG) Report (CDSL & NSDL) – Monthly",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-7",category:"Depository Participant",task:"Ensure Online Facility for Mandatory CDSL Submissions: Issue 2-day advance notice to BOs before suspending instruction processing – Monthly",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-8",category:"Depository Participant",task:"Submission of report of Modification in URL reported to CDSL within 3 days – Monthly",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-9",category:"Depository Participant",task:"Indictment order against the DP – information on orders passed by competent authority – CDSL",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-10",category:"Depository Participant",task:"Reporting of STR finding with FIU-India by DP – CDSL",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-11",category:"Depository Participant",task:"Tariff Structure of the DP – information on increase in charges/fees with 30 days notice to BOs – CDSL",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-12",category:"Depository Participant",task:"Report on Concurrent Audit of Depository Participant (DP) – Monthly",due:"10.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-13",category:"Depository Participant",task:"Reporting of status of alerts (Surveillance Obligation) generated by Participants – Quarterly",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-14",category:"Depository Participant",task:"Reporting on Cybersecurity & Cyber Resilience Framework – Quarterly",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-15",category:"Depository Participant",task:"Submission of Cash Transaction Report (CTR) to FIU-IND (NSDL/CDSL) – Monthly",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-16",category:"Depository Participant",task:"Submission of Non-Profit Organization Transaction Reports (NTRs) to FIU-IND – Monthly",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-17",category:"Depository Participant",task:"Reporting of Non-Profit Organization Transactions Report with FIU-India by DP to CDSL – Monthly",due:"20.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-18",category:"Depository Participant",task:"Compliance Report w.r.t same Mobile number and/or email address for multiple accounts – NSDL – Monthly",due:"27.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-19",category:"Depository Participant",task:"Submission of Action Taken Report (ATR) on Cyber Security Audit Report/VAPT Report",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-20",category:"Depository Participant",task:"Conduct Accessibility Audit for digital platforms – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-21",category:"Depository Participant",task:"Dispatch of Annual Holding Statements (No transaction & Nil balance accounts) – Annually",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-22",category:"Depository Participant",task:"Dispatch of CAS (no transactions but holding available) for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-23",category:"Depository Participant",task:"Submission of Risk Based Supervision of Participant for the half-year ended 31 March 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-24",category:"Depository Participant",task:"Submission of Tariff Structure – Annually",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-25",category:"Depository Participant",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  {id:"dp-26",category:"Depository Participant",task:"Submission of Internal Audit of DP Operations for the half-year ended 31 March 2026",due:"15.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Stock Broking ──
  {id:"sb-1",category:"Stock Broking",task:"Contract note serial numbering shall start from No. 1",due:"01.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-2",category:"Stock Broking",task:"Applicability of Additional Surveillance Obligation for Stock Brokers having less than 2000 clients",due:"01.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-3",category:"Stock Broking",task:"Reporting of Clients Mapped to Authorised Persons (AP) – Week 23-03 to 27-03-2026",due:"01.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-4",category:"Stock Broking",task:"Extension for Upload of Client Records to KRAs for Validations",due:"03.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-5",category:"Stock Broking",task:"Sending Statement of Accounts (Funds, Securities & Commodities) – Week 23-03 to 27-03-2026",due:"06.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-6",category:"Stock Broking",task:"Revision of Order-to-Trade Ratio (OTR) framework",due:"06.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-7",category:"Stock Broking",task:"Publishing of Investor Charter & Investor Complaints on website/mobile application",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-8",category:"Stock Broking",task:"Upload Details of all Complaints Received to Exchange",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-9",category:"Stock Broking",task:"Reporting of Clients Mapped to Authorised Persons (AP) – Week 30-03 to 03-04-2026",due:"07.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-10",category:"Stock Broking",task:"Sending Statement of Accounts – Week 30-03 to 03-04-2026",due:"09.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-11",category:"Stock Broking",task:"Contingency Drill / Mock Trading schedule for 2026",due:"11.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-12",category:"Stock Broking",task:"Algo – AI/ML Reporting for the half-year ended 31 March 2026",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-13",category:"Stock Broking",task:"Reporting of Clients Mapped to Authorised Persons (AP) – Week 06-04 to 10-04-2026",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-14",category:"Stock Broking",task:"Submission of Surveillance Obligation Report for the quarter ended 31 March 2026",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-15",category:"Stock Broking",task:"Reporting of Cyber Incident Security",due:"15.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-16",category:"Stock Broking",task:"Applicability of SEBI circulars on relaxations in certain reporting requirements for certain Stock Brokers",due:"17.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-17",category:"Stock Broking",task:"Sending Statement of Accounts – Week 06-04 to 10-04-2026",due:"17.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-18",category:"Stock Broking",task:"Settlement of Running Account (Monthly/Quarterly Settlement & Inactive >30 Days Accounts)",due:"17.04.2026 & 18.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-19",category:"Stock Broking",task:"Reporting of Clients Mapped to Authorised Persons (AP) – Week 13-04 to 17-04-2026",due:"21.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-20",category:"Stock Broking",task:"Reporting of Summary of Settlement of Clients' Funds to Exchanges – Quarterly",due:"21.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-21",category:"Stock Broking",task:"Sending Statement of Accounts – Week 13-04 to 17-04-2026",due:"23.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-22",category:"Stock Broking",task:"Reporting of Clients Mapped to Authorised Persons (AP) – Week 20-04 to 24-04-2026",due:"28.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-23",category:"Stock Broking",task:"No. of STR filed with FIU-IND for March 2026 (Including NIL STR)",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-24",category:"Stock Broking",task:"Issuance of Annual Global Statement to Clients for Trades Executed During FY 25-26",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-25",category:"Stock Broking",task:"Issuance of Statement of Securities Transaction Tax (STT) to clients",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-26",category:"Stock Broking",task:"Sending Statement of Accounts – Week 20-04 to 24-04-2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-27",category:"Stock Broking",task:"Applicability of Annual Maintenance Charges towards Authorised Persons",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-28",category:"Stock Broking",task:"Conduct Accessibility Audit for digital platforms – Rights of Persons with Disabilities Act, 2016",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-29",category:"Stock Broking",task:"Submission of AP Inspection Details (Including NIL) – Quarterly",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-30",category:"Stock Broking",task:"Submission of Cyber Security and Cyber Resilience Audit ATR of Trading Members",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-31",category:"Stock Broking",task:"Submission of Margin Trading Compliance Certificate for half year ended March 31, 2026",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-32",category:"Stock Broking",task:"Half-yearly confirmation of entity type by RFQ participants",due:"30.04.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-33",category:"Stock Broking",task:"Calendar Spread margin benefit for Single Stock Derivatives on expiry",due:"05.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-34",category:"Stock Broking",task:"Disclosure of registered name and registration number on Social Media Platforms (SMPs)",due:"01.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-35",category:"Stock Broking",task:"UCC-wise Settlement Details submission to Exchanges – Quarterly",due:"04.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-36",category:"Stock Broking",task:"Payment of SEBI Annual Clearing fees payable by clearing/self-clearing Members",due:"07.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-37",category:"Stock Broking",task:"Submission of Risk Based Supervision (RBS) for half-year ended 31 March 2026",due:"31.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-38",category:"Stock Broking",task:"Renewal of Insurance Policy",due:"31.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-39",category:"Stock Broking",task:"Net Worth Certificate Submission for half-year ended 31 March 2026",due:"31.05.2026",type:"fixed",assignedTo:"all"},
  {id:"sb-40",category:"Stock Broking",task:"Submission of Internal Audit for the half-year ended 31 March 2026",due:"31.05.2026",type:"fixed",assignedTo:"all"},
  
  // ── Mutual Fund Distributor ──
  {id:"mf-1",category:"Mutual Fund Distributor",task:"Borrowing by Mutual Funds (SEBI Circular dated March 13, 2026)",due:"01.04.2026",type:"fixed",assignedTo:"all"},
  {id:"mf-2",category:"Mutual Fund Distributor",task:"Introduction of Voluntary Lock-in / Debit freeze facility to Mutual Fund folios",due:"30.04.2026",type:"fixed",assignedTo:"all"},
];

// NOW connect to MongoDB with models already defined
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
}).then(async () => {
  mongoConnected = true;
  console.log('✅ MongoDB Connected Successfully');
  
  // Initialize default tasks if database is empty
  try {
    const taskCount = await Task.countDocuments();
    
    if (taskCount === 0) {
      console.log('📥 Database is empty, seeding default tasks...');
      await Task.insertMany(DEFAULT_TASKS);
      console.log(`✅ Seeded ${DEFAULT_TASKS.length} default tasks`);
    }
    
    const memberCount = await TeamMember.countDocuments();
    console.log(`📊 Database Status: ${taskCount} tasks, ${memberCount} team members`);
  } catch (err) {
    console.error('⚠️ Initialization error:', err.message);
  }
}).catch(err => {
  mongoConnected = false;
  console.error('❌ MongoDB Connection Error:', err.message);
  console.error('❌ Check your connection string and MongoDB Atlas status');
  process.exit(1);
});

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
    let tasks = await Task.find().lean();
    
    // Auto-seed if no tasks exist OR if we have fewer than DEFAULT_TASKS
    if (tasks.length === 0 || tasks.length < DEFAULT_TASKS.length) {
      console.log(`📥 Found ${tasks.length} tasks, but ${DEFAULT_TASKS.length} expected. Re-seeding...`);
      await Task.deleteMany({}); // Clear existing partial tasks
      await Task.insertMany(DEFAULT_TASKS);
      tasks = DEFAULT_TASKS;
      console.log(`✅ Re-seeded with all ${DEFAULT_TASKS.length} tasks`);
    }
    
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
    console.log(`📋 Assignment Request: taskId="${taskId}" → assignedTo="${assignedTo}"`);
    
    // First, verify task exists
    const taskBefore = await Task.findOne({ id: taskId });
    if (!taskBefore) {
      console.warn(`❌ Task "${taskId}" NOT FOUND!`);
      const allTasks = await Task.find().select('id assignedTo').limit(10);
      console.warn(`📌 Sample tasks in DB:`);
      allTasks.forEach(t => console.warn(`   - ${t.id} (assigned to: ${t.assignedTo || 'null'})`));
      return res.status(404).json({ 
        error: `Task not found: ${taskId}`,
        hint: 'Check task ID format - should match tasks in database'
      });
    }
    
    console.log(`✓ Task found in DB: id="${taskBefore.id}", currentAssignment="${taskBefore.assignedTo}"`);
    
    // Perform the update
    const task = await Task.findOneAndUpdate(
      { id: taskId },
      { 
        assignedTo: assignedTo, 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!task) {
      console.error(`❌ findOneAndUpdate returned null`);
      return res.status(500).json({ error: 'Update failed' });
    }
    
    // Verify the update actually worked
    if (task.assignedTo !== assignedTo) {
      console.error(`❌ Verification FAILED: expected "${assignedTo}", got "${task.assignedTo}"`);
      return res.status(500).json({ error: 'Assignment verification failed' });
    }
    
    // Double-check by querying again
    const taskAfter = await Task.findOne({ id: taskId });
    if (!taskAfter || taskAfter.assignedTo !== assignedTo) {
      console.error(`❌ Double-check FAILED: Assignment did not persist`);
      return res.status(500).json({ error: 'Assignment did not persist' });
    }
    
    console.log(`✅ SUCCESS! Task "${taskId}" now assigned to "${assignedTo}"`);
    console.log(`✅ Double-checked: assignment confirmed in database`);
    console.log(`═══════════════════════════════════════\n`);
    
    res.json(task);
  } catch (err) {
    console.error(`❌ Assignment error: ${err.message}`);
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Assignment failed',
      message: err.message
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

// Health check with detailed diagnostics
app.get('/api/health', async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const mongoConnected = connectionState === 1;
    
    let dbStats = {};
    let connectionStatus = '';
    
    if (mongoConnected) {
      connectionStatus = '✅ Connected';
      try {
        dbStats = {
          tasks: await Task.countDocuments(),
          teamMembers: await TeamMember.countDocuments(),
          statuses: await Status.countDocuments(),
          activityLogs: await ActivityLog.countDocuments()
        };
        
        // Auto-seed if no tasks exist OR if we have fewer than DEFAULT_TASKS
        if (dbStats.tasks === 0 || dbStats.tasks < DEFAULT_TASKS.length) {
          console.log(`⚙️ Database has ${dbStats.tasks} tasks, but ${DEFAULT_TASKS.length} expected. Re-seeding...`);
          await Task.deleteMany({}); // Clear existing partial tasks
          await Task.insertMany(DEFAULT_TASKS);
          dbStats.tasks = DEFAULT_TASKS.length;
          console.log('✅ Database re-seeded with all tasks');
        }
      } catch (err) {
        dbStats.warning = 'Could not count documents: ' + err.message;
      }
    } else {
      connectionStatus = `❌ Disconnected (state: ${connectionState})`;
      dbStats.warning = 'MongoDB not connected. Check connection string and MongoDB Atlas status.';
    }
    
    res.json({ 
      status: mongoConnected ? 'healthy' : 'not-connected',
      connectionStatus: connectionStatus,
      mongoDBConnected: mongoConnected,
      connectionState: connectionState,
      database: dbStats,
      timestamp: new Date().toISOString(),
      diagnostic: !mongoConnected ? 'Check: 1) MongoDB URI in env 2) IP Whitelist in MongoDB Atlas 3) Database password 4) Network connectivity' : null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      connectionState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

// Reset/Re-seed database with all tasks (admin endpoint)
app.post('/api/admin/reset-tasks', async (req, res) => {
  try {
    if (!mongoConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const { adminPassword } = req.body;
    
    // Verify admin password
    const admin = await Admin.findOne({ key: 'admin' });
    if (!admin || admin.passwordHash !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
    }
    
    console.log('🔄 Re-seeding database with all tasks...');
    
    // Clear existing tasks
    const deleted = await Task.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing tasks`);
    
    // Re-seed with all tasks
    await Task.insertMany(DEFAULT_TASKS);
    console.log(`✅ Seeded ${DEFAULT_TASKS.length} tasks`);
    
    res.json({ 
      success: true, 
      message: `Database reset: ${DEFAULT_TASKS.length} tasks re-seeded`,
      taskCount: DEFAULT_TASKS.length
    });
  } catch (err) {
    console.error('❌ Reset error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel
module.exports = app;
