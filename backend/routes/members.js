const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

router.post('/register', async (req, res) => {
    try {
        const { userId, membership_type, organization_name } = req.body;
        
        if (!userId || !membership_type) {
            return res.status(400).json({ message: 'User ID and membership type required' });
        }

        const memberId = await Member.create({ user_id: userId, membership_type, organization_name });
        res.status(201).json({ message: 'Membership registered', memberId });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed' });
    }
});

module.exports = router;
