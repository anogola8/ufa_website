const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { full_name, email, password, phone, county, ward } = userData;
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 12);
        
        const [result] = await pool.execute(
            `INSERT INTO users (full_name, email, password_hash, phone, county, ward) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [full_name, email, password_hash, phone || null, county || null, ward || null]
        );
        
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, phone, county, ward, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    static async updateProfile(id, updates) {
        const allowedFields = ['phone', 'county', 'ward'];
        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) return false;

        updateValues.push(id);
        const [result] = await pool.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        return result.affectedRows > 0;
    }
}

module.exports = User;