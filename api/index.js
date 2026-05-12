const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'ufa_secret_2024';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (supabase) {
    console.log('✅ Supabase connected');
} else {
    console.log('⚠️ Supabase not configured - using memory storage');
}

const memoryUsers = [];
const memoryMembers = [];
const memorySubscribers = [];

const createToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
const sendError = (res, status, message) => res.status(status).json({ success: false, message });
const requiresValue = (value) => typeof value === 'string' && value.trim().length > 0;

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return sendError(res, 401, 'Authentication required');

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        sendError(res, 401, 'Invalid or expired token');
    }
};

const getUserByEmail = async (email) => {
    if (supabase) {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
    return memoryUsers.find((user) => user.email === email);
};

const getUserById = async (userId) => {
    if (supabase) {
        const { data, error } = await supabase.from('users').select('id, full_name, email, role, phone, county, ward').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
    return memoryUsers.find((user) => user.id === parseInt(userId, 10));
};

app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, password, phone, county, ward } = req.body;
    if (!requiresValue(full_name) || !requiresValue(email) || !requiresValue(password)) {
        return sendError(res, 400, 'Name, email, and password are required');
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) return sendError(res, 409, 'User already exists');

        const password_hash = await bcrypt.hash(password, 10);
        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .insert([{ full_name, email, password_hash, phone: phone || null, county: county || null, ward: ward || null }])
                .select()
                .single();
            if (error) throw error;
            return res.status(201).json({
                success: true,
                message: 'Registration successful!',
                token: createToken(data),
                userId: data.id,
                user: { id: data.id, name: data.full_name, email: data.email, role: data.role || 'member' }
            });
        }

        const user = {
            id: memoryUsers.length + 1,
            full_name,
            email,
            password_hash,
            phone: phone || '',
            county: county || '',
            ward: ward || '',
            role: 'member',
            created_at: new Date().toISOString(),
        };
        memoryUsers.push(user);
        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token: createToken(user),
            userId: user.id,
            user: { id: user.id, name: user.full_name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Register error:', error);
        sendError(res, 500, 'Registration failed');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!requiresValue(email) || !requiresValue(password)) {
        return sendError(res, 400, 'Email and password are required');
    }

    try {
        const user = await getUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return sendError(res, 401, 'Invalid credentials');
        }
        return res.json({ success: true, token: createToken(user), user: { id: user.id, name: user.full_name, email: user.email, role: user.role || 'member' } });
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 500, 'Login failed');
    }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user) return sendError(res, 404, 'User not found');
        return res.json({ success: true, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role || 'member', phone: user.phone || '', county: user.county || '', ward: user.ward || '' } });
    } catch (error) {
        console.error('Profile error:', error);
        sendError(res, 500, 'Could not load profile');
    }
});

app.post('/api/members/register', async (req, res) => {
    const { userId, membership_type, organization_name } = req.body;
    if (!requiresValue(`${userId}`) || !requiresValue(membership_type)) {
        return sendError(res, 400, 'User ID and membership type are required');
    }

    try {
        if (supabase) {
            const { data: existing } = await supabase.from('members').select('id').eq('user_id', userId).single();
            if (existing) return sendError(res, 409, 'Already registered');
            const { data, error } = await supabase
                .from('members')
                .insert([{ user_id: userId, membership_type, organization_name: organization_name || null }])
                .select()
                .single();
            if (error) throw error;
            return res.status(201).json({ success: true, message: 'Membership registered!', memberId: data.id });
        }

        const existing = memoryMembers.find((member) => member.user_id === parseInt(userId, 10));
        if (existing) return sendError(res, 409, 'Already registered');
        const member = { id: memoryMembers.length + 1, user_id: parseInt(userId, 10), membership_type, organization_name: organization_name || '', status: 'active', membership_date: new Date().toISOString() };
        memoryMembers.push(member);
        return res.status(201).json({ success: true, message: 'Membership registered!', memberId: member.id });
    } catch (error) {
        console.error('Member registration error:', error);
        sendError(res, 500, 'Membership registration failed');
    }
});

app.get('/api/events', async (req, res) => {
    try {
        if (supabase) {
            const { data: events, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
            if (error) throw error;
            return res.json({ success: true, count: events.length, events });
        }
        const events = [
            { id: 1, title: 'County Civic Education Forum', description: 'Comprehensive civic education forum.', event_date: '2024-06-15', time: '10:00 AM', location: 'Nairobi County Hall', event_type: 'civic_education' },
            { id: 2, title: 'Youth Leadership Summit 2024', description: 'Annual youth leadership summit.', event_date: '2024-06-20', time: '9:00 AM', location: 'Mombasa', event_type: 'youth' },
            { id: 3, title: 'Women Empowerment Workshop', description: 'Workshop on economic empowerment.', event_date: '2024-07-05', time: '2:00 PM', location: 'Kisumu', event_type: 'women' },
            { id: 4, title: 'Policy Advocacy Training', description: 'Training on policy advocacy.', event_date: '2024-07-15', time: '11:00 AM', location: 'Nakuru', event_type: 'advocacy' },
            { id: 5, title: 'PLWD Inclusion Forum', description: 'Forum on inclusion.', event_date: '2024-08-01', time: '10:00 AM', location: 'Nairobi', event_type: 'general' },
        ];
        return res.json({ success: true, count: events.length, events });
    } catch (error) {
        console.error('Events error:', error);
        const fallbackEvents = [
            { id: 1, title: 'County Civic Education Forum', description: 'Comprehensive civic education forum.', event_date: '2024-06-15', time: '10:00 AM', location: 'Nairobi County Hall', event_type: 'civic_education' },
            { id: 2, title: 'Youth Leadership Summit 2024', description: 'Annual youth leadership summit.', event_date: '2024-06-20', time: '9:00 AM', location: 'Mombasa', event_type: 'youth' },
            { id: 3, title: 'Women Empowerment Workshop', description: 'Workshop on economic empowerment.', event_date: '2024-07-05', time: '2:00 PM', location: 'Kisumu', event_type: 'women' },
            { id: 4, title: 'Policy Advocacy Training', description: 'Training on policy advocacy.', event_date: '2024-07-15', time: '11:00 AM', location: 'Nakuru', event_type: 'advocacy' },
            { id: 5, title: 'PLWD Inclusion Forum', description: 'Forum on inclusion.', event_date: '2024-08-01', time: '10:00 AM', location: 'Nairobi', event_type: 'general' },
        ];
        return res.json({ success: true, count: fallbackEvents.length, events: fallbackEvents });
    }
});

app.post('/api/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!requiresValue(email)) return sendError(res, 400, 'Email required');
    try {
        if (supabase) {
            const { error } = await supabase.from('newsletter_subscribers').insert([{ email }]);
            if (error) {
                if (error.code === '23505') return sendError(res, 409, 'Already subscribed');
                throw error;
            }
        } else {
            const existing = memorySubscribers.find((subscriber) => subscriber.email === email);
            if (existing) return sendError(res, 409, 'Already subscribed');
            memorySubscribers.push({ email, subscribed_at: new Date().toISOString() });
        }
        return res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
        console.error('Newsletter error:', error);
        sendError(res, 500, 'Subscription failed');
    }
});

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'UFA API is running! 🇰🇪', version: '2.0.0', database: supabase ? 'Supabase (PostgreSQL)' : 'Memory Storage' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 UFA API listening on http://localhost:${PORT}`);
    });
}

module.exports = app;