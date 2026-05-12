const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ufa_secret_key_2024';

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required. Please login.' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Invalid or expired token. Please login again.' 
        });
    }
};

// Optional auth (doesn't require authentication)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'ufa_organization_secret_key_2024_super_secure'
            );
            req.user = decoded;
        }
    } catch (error) {
        // Continue without user
    }
    next();
};

module.exports = { authMiddleware, optionalAuth };