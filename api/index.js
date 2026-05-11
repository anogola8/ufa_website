const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// In-memory storage
const users = [];
const members = [];
const subscribers = [];

// Middleware
app.use(cors());
app.use(express.json());

// JWT and bcrypt
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ============================================
// AUTH ROUTES
// ============================================

// Register
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
            process.env.JWT_SECRET || 'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ User registered: ${full_name}`);
        
        res.status(201).json({ success: true, message: 'Registration successful!', token, userId: user.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ User logged in: ${user.full_name}`);
        
        res.json({ success: true, token, user: { id: user.id, name: user.full_name, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// ============================================
// MEMBER ROUTES
// ============================================

app.post('/api/members/register', async (req, res) => {
    try {
        const { userId, membership_type, organization_name } = req.body;
        
        if (!userId || !membership_type) {
            return res.status(400).json({ success: false, message: 'User ID and membership type required' });
        }
        
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
        
        console.log(`✅ New member: User ${userId}`);
        
        res.status(201).json({ success: true, message: 'Membership registered!', memberId: member.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// ============================================
// EVENTS ROUTES
// ============================================

app.get('/api/events', (req, res) => {
    const events = [
        { id: 1, title: 'County Civic Education Forum', description: 'Comprehensive civic education forum on citizens rights and constitutional provisions.', event_date: '2024-06-15', time: '10:00 AM', location: 'Nairobi County Hall', event_type: 'civic_education' },
        { id: 2, title: 'Youth Leadership Summit 2024', description: 'Annual youth leadership summit bringing together young leaders from across Kenya.', event_date: '2024-06-20', time: '9:00 AM', location: 'Mombasa Convention Center', event_type: 'youth' },
        { id: 3, title: 'Women Empowerment Workshop', description: 'Interactive workshop on economic empowerment and leadership skills for women.', event_date: '2024-07-05', time: '2:00 PM', location: 'Kisumu Social Hall', event_type: 'women' },
        { id: 4, title: 'Policy Advocacy Training', description: 'Training on effective policy advocacy strategies for sustainable development.', event_date: '2024-07-15', time: '11:00 AM', location: 'Nakuru Town Hall', event_type: 'advocacy' },
        { id: 5, title: 'PLWD Inclusion Forum', description: 'Special forum on inclusion of persons living with disabilities in community development programs.', event_date: '2024-08-01', time: '10:00 AM', location: 'Nairobi', event_type: 'general' }
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
    
    console.log(`📧 New subscriber: ${email}`);
    
    res.json({ success: true, message: 'Successfully subscribed!' });
});

// ============================================
// API INFO
// ============================================

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'UFA API is running! 🇰🇪',
        version: '1.0.0',
        stats: { users: users.length, members: members.length, subscribers: subscribers.length },
        endpoints: {
            auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login' },
            members: { register: 'POST /api/members/register' },
            events: { list: 'GET /api/events' },
            newsletter: { subscribe: 'POST /api/newsletter/subscribe' }
        }
    });
});

// ============================================
// EXPORT FOR VERCEL
// ============================================

module.exports = app;