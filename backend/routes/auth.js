const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Register new user
router.post('/register', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required')
], async (req, res) => {
    try {
        // Check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: errors.array() 
            });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(req.body.email);
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'User with this email already exists' 
            });
        }

        // Create user
        const userId = await User.create(req.body);
        
        // Generate token
        const token = jwt.sign(
            { 
                id: userId, 
                email: req.body.email,
                role: 'member' 
            },
            process.env.JWT_SECRET || 'ufa_organization_secret_key_2024_super_secure',
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            success: true,
            message: 'Registration successful! Welcome to UFA.',
            token,
            userId 
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
router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        const { email, password } = req.body;
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'ufa_organization_secret_key_2024_super_secure',
            { expiresIn: '7d' }
        );

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

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch profile' 
        });
    }
});

module.exports = router;