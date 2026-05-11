const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../config/database');

const register = async (req, res) => {
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
        
        res.status(201).json({ success: true, message: 'Registration successful!', token, userId: user.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

const login = async (req, res) => {
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
        
        res.json({ success: true, token, user: { id: user.id, name: user.full_name, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

const getProfile = (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, county: user.county } });
};

module.exports = { register, login, getProfile };