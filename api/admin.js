const express = require('express');
const router = express.Router();
const express = require('express');
const cors = require('cors');

const app = express();

// In-memory storage (shared arrays)
const users = [];
const members = [];
const subscribers = [];

// Import admin routes
const { router: adminRouter, setData } = require('./admin');

// These arrays are shared - in production, use a real database
// For now, we'll access them from the main API
let users = [];
let members = [];
let subscribers = [];

// Function to set data (called from main api/index.js)
function setData(u, m, s) {
    users = u;
    members = m;
    subscribers = s;
}

// Admin login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Default admin credentials (change these!)
    if (email === 'admin@ufa.org' && password === 'UFAadmin2024!') {
        return res.json({ 
            success: true, 
            message: 'Admin login successful',
            token: 'admin_token_secure_2024'
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

// Get all users
router.get('/users', (req, res) => {
    const { token } = req.query;
    
    if (token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userList = users.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        county: u.county,
        ward: u.ward,
        registered: u.created_at
    }));
    
    res.json({ success: true, count: userList.length, users: userList });
});

// Get all members
router.get('/members', (req, res) => {
    const { token } = req.query;
    
    if (token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Combine member data with user data
    const memberList = members.map(m => {
        const user = users.find(u => u.id === m.user_id);
        return {
            memberId: m.id,
            userId: m.user_id,
            name: user ? user.full_name : 'Unknown',
            email: user ? user.email : 'Unknown',
            phone: user ? user.phone : 'Unknown',
            county: user ? user.county : 'Unknown',
            membershipType: m.membership_type,
            organization: m.organization_name || 'N/A',
            status: m.status,
            joinedDate: m.membership_date
        };
    });
    
    res.json({ success: true, count: memberList.length, members: memberList });
});

// Get all subscribers
router.get('/subscribers', (req, res) => {
    const { token } = req.query;
    
    if (token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({ success: true, count: subscribers.length, subscribers });
});

// Get dashboard stats
router.get('/stats', (req, res) => {
    const { token } = req.query;
    
    if (token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // County distribution
    const countyStats = {};
    users.forEach(u => {
        if (u.county) {
            countyStats[u.county] = (countyStats[u.county] || 0) + 1;
        }
    });
    
    // Member type distribution
    const typeStats = {};
    members.forEach(m => {
        typeStats[m.membership_type] = (typeStats[m.membership_type] || 0) + 1;
    });
    
    res.json({
        success: true,
        stats: {
            totalUsers: users.length,
            totalMembers: members.length,
            totalSubscribers: subscribers.length,
            countyDistribution: countyStats,
            membershipTypes: typeStats,
            recentRegistrations: users.slice(-5).reverse(),
            recentMembers: members.slice(-5).reverse()
        }
    });
});
// ============================================
// ADMIN ROUTES
// ============================================
app.use('/api/admin', adminRouter);

// Share data references with admin module
setData(users, members, subscribers);
module.exports = { router, setData };