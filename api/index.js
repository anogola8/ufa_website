const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../backend/config/supabase');

const app = express();

app.use(cors());
app.use(express.json());

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, county, ward } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        
        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        
        const password_hash = await bcrypt.hash(password, 12);
        
        // Insert user
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert([{ full_name, email, password_hash, phone, county, ward }])
            .select()
            .single();
        
        if (error) throw error;
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ success: true, message: 'Registration successful!', token, userId: user.id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'ufa_secret_2024',
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, user: { id: user.id, name: user.full_name, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Members
app.post('/api/members/register', async (req, res) => {
    try {
        const { userId, membership_type, organization_name } = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('members')
            .insert([{ user_id: userId, membership_type, organization_name }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({ success: true, message: 'Membership registered!', memberId: data.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Events
app.get('/api/events', async (req, res) => {
    try {
        const { data: events, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });
        
        if (error) throw error;
        
        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// Newsletter
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        const { error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert([{ email }]);
        
        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ success: false, message: 'Already subscribed' });
            }
            throw error;
        }
        
        res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Subscription failed' });
    }
});

// Admin - Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, phone, county, ward, created_at')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Admin - Get all members
app.get('/api/admin/members', async (req, res) => {
    try {
        const { data: members, error } = await supabaseAdmin
            .from('members')
            .select(`
                id,
                user_id,
                membership_type,
                organization_name,
                status,
                membership_date,
                users!inner(full_name, email, phone, county)
            `)
            .order('membership_date', { ascending: false });
        
        if (error) throw error;
        
        const formatted = members.map(m => ({
            memberId: m.id,
            name: m.users?.full_name || 'Unknown',
            email: m.users?.email || 'Unknown',
            phone: m.users?.phone || '',
            county: m.users?.county || '',
            membershipType: m.membership_type,
            organization: m.organization_name || 'N/A',
            status: m.status,
            joinedDate: m.membership_date
        }));
        
        res.json({ success: true, count: formatted.length, members: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
});

// API Info
app.get('/api', (req, res) => {
    res.json({ success: true, message: 'UFA API with Supabase is running! 🇰🇪', version: '2.0.0' });
});

module.exports = app;