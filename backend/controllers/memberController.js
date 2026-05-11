const { members } = require('../config/database');

const registerMember = async (req, res) => {
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
        
        res.status(201).json({ success: true, message: 'Membership registered!', memberId: member.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

const getAllMembers = (req, res) => {
    res.json({ success: true, count: members.length, members });
};

module.exports = { registerMember, getAllMembers };