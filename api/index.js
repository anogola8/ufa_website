const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected');
} else {
    console.log('⚠️ Supabase not configured - using memory storage');
}

// Helper: Get users array (from DB or memory)
let memoryUsers = [];
let memoryMembers = [];
let memorySubscribers = [];

// ============================================
// REGISTER
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, county, ward } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        
        if (supabase) {
            // Use Supabase
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'User already exists' });
            }
            
            const { data: user, error } = await supabase
                .from('users')
                .insert([{ full_name, email, password_hash, phone: phone || null, county: county || null, ward: ward || null }])
                .select()
                .single();
            
            if (error) throw error;
            
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'ufa_secret_2024', { expiresIn: '7d' });
            
            return res.status(201).json({ success: true, message: 'Registration successful!', token, userId: user.id });
        } else {
            // Use memory
            const existingUser = memoryUsers.find(u => u.email === email);
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'User already exists' });
            }
            
            const user = { id: memoryUsers.length + 1, full_name, email, password_hash, phone: phone || '', county: county || '', ward: ward || '', role: 'member', created_at: new Date().toISOString() };
            memoryUsers.push(user);
            
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'ufa_secret_2024', { expiresIn: '7d' });
            
            return res.status(201).json({ success: true, message: 'Registration successful!', token, userId: user.id });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
    }
});

// ============================================
// LOGIN
// ============================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        let user = null;
        
        if (supabase) {
            const { data } = await supabase.from('users').select('*').eq('email', email).single();
            user = data;
        } else {
            user = memoryUsers.find(u => u.email === email);
        }
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'ufa_secret_2024', { expiresIn: '7d' });
        
        res.json({ success: true, token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role } });
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
        
        if (supabase) {
            const { data: existing } = await supabase.from('members').select('id').eq('user_id', userId).single();
            if (existing) {
                return res.status(409).json({ success: false, message: 'Already registered' });
            }
            
            const { data: member, error } = await supabase.from('members').insert([{ user_id: userId, membership_type, organization_name: organization_name || null }]).select().single();
            if (error) throw error;
            
            return res.status(201).json({ success: true, message: 'Membership registered!', memberId: member.id });
        } else {
            const existing = memoryMembers.find(m => m.user_id === parseInt(userId));
            if (existing) {
                return res.status(409).json({ success: false, message: 'Already registered' });
            }
            
            const member = { id: memoryMembers.length + 1, user_id: parseInt(userId), membership_type, organization_name: organization_name || '', status: 'active', membership_date: new Date().toISOString() };
            memoryMembers.push(member);
            
            return res.status(201).json({ success: true, message: 'Membership registered!', memberId: member.id });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// ============================================
// EVENTS
// ============================================
app.get('/api/events', async (req, res) => {
    try {
        if (supabase) {
            const { data: events, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
            if (error) throw error;
            return res.json({ success: true, count: events.length, events });
        } else {
            const events = [
                { id: 1, title: 'County Civic Education Forum', description: 'Comprehensive civic education forum.', event_date: '2024-06-15', time: '10:00 AM', location: 'Nairobi County Hall', event_type: 'civic_education' },
                { id: 2, title: 'Youth Leadership Summit 2024', description: 'Annual youth leadership summit.', event_date: '2024-06-20', time: '9:00 AM', location: 'Mombasa', event_type: 'youth' },
                { id: 3, title: 'Women Empowerment Workshop', description: 'Workshop on economic empowerment.', event_date: '2024-07-05', time: '2:00 PM', location: 'Kisumu', event_type: 'women' },
                { id: 4, title: 'Policy Advocacy Training', description: 'Training on policy advocacy.', event_date: '2024-07-15', time: '11:00 AM', location: 'Nakuru', event_type: 'advocacy' },
                { id: 5, title: 'PLWD Inclusion Forum', description: 'Forum on inclusion.', event_date: '2024-08-01', time: '10:00 AM', location: 'Nairobi', event_type: 'general' }
            ];
            return res.json({ success: true, count: events.length, events });
        }
    } catch (error) {
        const events = [
            { id: 1, title: 'County Civic Education Forum', location: 'Nairobi', date: '2024-06-15' },
            { id: 2, title: 'Youth Leadership Summit', location: 'Mombasa', date: '2024-06-20' },
            { id: 3, title: 'Women Empowerment Workshop', location: 'Kisumu', date: '2024-07-05' }
        ];
        res.json({ success: true, events });
    }
});

// ============================================
// NEWSLETTER
// ============================================
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });
        
        if (supabase) {
            const { error } = await supabase.from('newsletter_subscribers').insert([{ email }]);
            if (error) {
                if (error.code === '23505') return res.status(409).json({ success: false, message: 'Already subscribed' });
                throw error;
            }
        } else {
            const existing = memorySubscribers.find(s => s.email === email);
            if (existing) return res.status(409).json({ success: false, message: 'Already subscribed' });
            memorySubscribers.push({ email, subscribed_at: new Date().toISOString() });
        }
        
        res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Subscription failed' });
    }
});

// ============================================
// ADMIN
// ============================================
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@ufa.org' && password === 'UFAadmin2024!') {
        return res.json({ success: true, token: 'admin_token_secure_2024' });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/admin/users', async (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    if (supabase) {
        const { data: users, error } = await supabase.from('users').select('id, full_name, email, phone, county, ward, created_at').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: 'Error' });
        return res.json({ success: true, count: users.length, users: users.map(u => ({ id: u.id, name: u.full_name, email: u.email, phone: u.phone, county: u.county, ward: u.ward, registered: u.created_at })) });
    }
    
    const userList = memoryUsers.map(u => ({ id: u.id, name: u.full_name, email: u.email, phone: u.phone, county: u.county, ward: u.ward, registered: u.created_at }));
    res.json({ success: true, count: userList.length, users: userList });
});

app.get('/api/admin/members', async (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    if (supabase) {
        const { data, error } = await supabase.from('members').select('*, users!inner(full_name, email, phone, county)').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: 'Error' });
        const formatted = data.map(m => ({ memberId: m.id, name: m.users?.full_name || 'Unknown', email: m.users?.email || 'Unknown', phone: m.users?.phone || '', county: m.users?.county || '', membershipType: m.membership_type, status: m.status, joinedDate: m.membership_date }));
        return res.json({ success: true, count: formatted.length, members: formatted });
    }
    
    const memberList = memoryMembers.map(m => { const user = memoryUsers.find(u => u.id === m.user_id); return { memberId: m.id, name: user?.full_name || 'Unknown', email: user?.email || 'Unknown', phone: user?.phone || '', county: user?.county || '', membershipType: m.membership_type, status: m.status, joinedDate: m.membership_date }; });
    res.json({ success: true, count: memberList.length, members: memberList });
});

app.get('/api/admin/subscribers', async (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    if (supabase) {
        const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: 'Error' });
        return res.json({ success: true, count: data.length, subscribers: data });
    }
    
    res.json({ success: true, count: memorySubscribers.length, subscribers: memorySubscribers });
});

app.get('/api/admin/stats', async (req, res) => {
    if (req.query.token !== 'admin_token_secure_2024') return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    if (supabase) {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: memberCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
        const { count: subCount } = await supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true });
        return res.json({ success: true, stats: { totalUsers: userCount, totalMembers: memberCount, totalSubscribers: subCount } });
    }
    
    res.json({ success: true, stats: { totalUsers: memoryUsers.length, totalMembers: memoryMembers.length, totalSubscribers: memorySubscribers.length } });
});

// ============================================
// API INFO
// ============================================
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'UFA API is running! 🇰🇪',
        version: '2.0.0',
        database: supabase ? 'Supabase (PostgreSQL)' : 'Memory Storage'
    });
});

module.exports = app;