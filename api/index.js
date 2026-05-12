const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors());
app.use(express.json());

// Storage
const users = [];
const members = [];
const subscribers = [];

// ============================================
// REGISTER
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, county, ward } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        const user = {
            id: users.length + 1,
            full_name,
            email,
            password_hash,
            phone: phone || '',
            county: county || '',
            ward: ward || '',
            role: 'member',
            created_at: new Date().toISOString()
        };
        
        users.push(user);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Registration successful!', 
            token, 
            userId: user.id 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// ============================================
// LOGIN
// ============================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, name: user.full_name, email: user.email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// ============================================
// MEMBERS
// ============================================
app.post('/api/members/register', async (req, res) => {
    try {
        const { userId, membership_type, organization_name } = req.body;
        
        const existingMember = members.find(m => m.user_id === parseInt(userId));
        if (existingMember) {
            return res.status(409).json({ success: false, message: 'Already registered' });
        }
        
        const member = {
            id: members.length + 1,
            user_id: parseInt(userId),
            membership_type,
            organization_name: organization_name || '',
            status: 'active',
            membership_date: new Date().toISOString()
        };
        
        members.push(member);
        
        res.status(201).json({ 
            success: true, 
            message: 'Membership registered!', 
            memberId: member.id 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// ============================================
// EVENTS
// ============================================
app.get('/api/events', (req, res) => {
    const events = [
        { 
            id: 1, 
            title: 'County Civic Education Forum', 
            description: 'Comprehensive civic education forum on citizens rights and constitutional provisions.',
            event_date: '2024-06-15', 
            time: '10:00 AM', 
            location: 'Nairobi County Hall', 
            event_type: 'civic_education' 
        },
        { 
            id: 2, 
            title: 'Youth Leadership Summit 2024', 
            description: 'Annual youth leadership summit bringing together young leaders from across Kenya.',
            event_date: '2024-06-20', 
            time: '9:00 AM', 
            location: 'Mombasa Convention Center', 
            event_type: 'youth' 
        },
        { 
            id: 3, 
            title: 'Women Empowerment Workshop', 
            description: 'Interactive workshop on economic empowerment and leadership skills for women.',
            event_date: '2024-07-05', 
            time: '2:00 PM', 
            location: 'Kisumu Social Hall', 
            event_type: 'women' 
        },
        { 
            id: 4, 
            title: 'Policy Advocacy Training', 
            description: 'Training on effective policy advocacy strategies for sustainable development.',
            event_date: '2024-07-15', 
            time: '11:00 AM', 
            location: 'Nakuru Town Hall', 
            event_type: 'advocacy' 
        },
        { 
            id: 5, 
            title: 'PLWD Inclusion Forum', 
            description: 'Special forum on inclusion of persons living with disabilities in community development.',
            event_date: '2024-08-01', 
            time: '10:00 AM', 
            location: 'Nairobi', 
            event_type: 'general' 
        }
    ];
    
    res.json({ success: true, count: events.length, events });
});

// ============================================
// NEWSLETTER
// ============================================
app.post('/api/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const existing = subscribers.find(s => s.email === email);
    if (existing) {
        return res.status(409).json({ success: false, message: 'Already subscribed' });
    }
    
    subscribers.push({ email, subscribed_at: new Date().toISOString() });
    
    res.json({ success: true, message: 'Successfully subscribed!' });
});

// ============================================
// ADMIN
// ============================================
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@ufa.org' && password === 'UFAadmin2024!') {
        return res.json({ 
            success: true, 
            message: 'Admin login successful',
            token: 'admin_token_secure_2024'
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

app.get('/api/admin/users', (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') {
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

app.get('/api/admin/members', (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const memberList = members.map(m => {
        const user = users.find(u => u.id === m.user_id);
        return {
            memberId: m.id,
            name: user ? user.full_name : 'Unknown',
            email: user ? user.email : 'Unknown',
            phone: user ? user.phone : '',
            county: user ? user.county : '',
            membershipType: m.membership_type,
            status: m.status,
            joinedDate: m.membership_date
        };
    });
    
    res.json({ success: true, count: memberList.length, members: memberList });
});

app.get('/api/admin/subscribers', (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({ success: true, count: subscribers.length, subscribers });
});

app.get('/api/admin/stats', (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({
        success: true,
        stats: {
            totalUsers: users.length,
            totalMembers: members.length,
            totalSubscribers: subscribers.length
        }
    });
});

// ============================================
// API INFO
// ============================================
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'UFA API is running!',
        version: '1.0.0',
        stats: { 
            users: users.length, 
            members: members.length, 
            subscribers: subscribers.length 
        }
    });
});

module.exports = app;