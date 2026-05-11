const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// IN-MEMORY STORAGE (works without database)
// ============================================
const users = [];
const members = [];
const subscribers = [];

// ============================================
// AUTH ROUTES
// ============================================
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, county, ward } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email and password are required' 
            });
        }
        
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
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
            process.env.JWT_SECRET || 'ufa_secret_key_2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ New user registered: ${full_name} (${email})`);
        
        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to UFA.',
            token,
            userId: user.id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed. Please try again.' 
        });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'ufa_secret_key_2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ User logged in: ${user.full_name}`);
        
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed. Please try again.' 
        });
    }
});

// ============================================
// MIDDLEWARE
// ============================================
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ufa_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
}

// ============================================
// PROFILE ROUTE
// ============================================
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
        });
    }
    
    res.json({
        success: true,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            county: user.county,
            ward: user.ward,
            role: user.role,
            created_at: user.created_at
        }
    });
});

// ============================================
// MEMBER ROUTES
// ============================================
app.post('/api/members/register', async (req, res) => {
    try {
        const { userId, membership_type, organization_name } = req.body;
        
        if (!userId || !membership_type) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and membership type are required' 
            });
        }
        
        const existingMember = members.find(m => m.user_id === parseInt(userId));
        if (existingMember) {
            return res.status(409).json({ 
                success: false, 
                message: 'You are already registered as a member' 
            });
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
        
        console.log(`✅ New member registered: User ID ${userId} as ${membership_type}`);
        
        res.status(201).json({
            success: true,
            message: 'Membership registration successful!',
            memberId: member.id
        });
    } catch (error) {
        console.error('Member registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Membership registration failed' 
        });
    }
});

app.get('/api/members', (req, res) => {
    res.json({
        success: true,
        count: members.length,
        members: members
    });
});

// ============================================
// EVENTS ROUTES
// ============================================
app.get('/api/events', (req, res) => {
    const events = [
        {
            id: 1,
            title: 'County Civic Education Forum',
            description: 'Join us for a comprehensive civic education forum focused on citizens rights and responsibilities.',
            event_date: '2024-06-15T10:00:00',
            location: 'Nairobi County Hall',
            event_type: 'civic_education',
            status: 'upcoming'
        },
        {
            id: 2,
            title: 'Youth Leadership Summit 2024',
            description: 'Annual youth leadership summit bringing together young leaders from across Kenya.',
            event_date: '2024-06-20T09:00:00',
            location: 'Mombasa Convention Center',
            event_type: 'youth',
            status: 'upcoming'
        },
        {
            id: 3,
            title: 'Women Empowerment Workshop',
            description: 'Interactive workshop focused on economic empowerment and leadership skills for women.',
            event_date: '2024-07-05T14:00:00',
            location: 'Kisumu Social Hall',
            event_type: 'women',
            status: 'upcoming'
        },
        {
            id: 4,
            title: 'Policy Advocacy Training',
            description: 'Training on effective policy advocacy strategies for sustainable development.',
            event_date: '2024-07-15T11:00:00',
            location: 'Nakuru Town Hall',
            event_type: 'advocacy',
            status: 'upcoming'
        },
        {
            id: 5,
            title: 'PLWD Inclusion Workshop',
            description: 'Special workshop on inclusion of persons living with disabilities in community programs.',
            event_date: '2024-08-01T10:00:00',
            location: 'Nairobi',
            event_type: 'general',
            status: 'upcoming'
        }
    ];
    
    res.json({ 
        success: true, 
        count: events.length,
        events: events 
    });
});

// ============================================
// NEWSLETTER SUBSCRIPTION
// ============================================
app.post('/api/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    const existing = subscribers.find(s => s.email === email);
    if (existing) {
        return res.status(409).json({ 
            success: false, 
            message: 'This email is already subscribed' 
        });
    }
    
    subscribers.push({
        email,
        subscribed_at: new Date().toISOString()
    });
    
    console.log(`📧 New newsletter subscriber: ${email}`);
    
    res.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter!' 
    });
});

// ============================================
// API INFO
// ============================================
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'UFA API is running! 🇰🇪',
        version: '1.0.0',
        stats: {
            users: users.length,
            members: members.length,
            subscribers: subscribers.length
        },
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile'
            },
            members: {
                register: 'POST /api/members/register',
                list: 'GET /api/members'
            },
            events: {
                list: 'GET /api/events'
            },
            newsletter: {
                subscribe: 'POST /api/newsletter/subscribe'
            }
        }
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        🚀 UFA SERVER IS RUNNING          ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`   📡 Server:  http://localhost:${PORT}`);
    console.log(`   🔌 API:     http://localhost:${PORT}/api`);
    console.log('');
    console.log('   💡 No database required');
    console.log('   📊 Using IN-MEMORY storage');
    console.log('');
});