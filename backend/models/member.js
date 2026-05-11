const pool = require('../config/database');

class Member {
    static async create(memberData) {
        const { user_id, membership_type, organization_name } = memberData;
        
        const [result] = await pool.execute(
            `INSERT INTO members (user_id, membership_type, organization_name, status, membership_date) 
             VALUES (?, ?, ?, 'pending', CURDATE())`,
            [user_id, membership_type, organization_name || null]
        );
        
        return result.insertId;
    }

    static async findByUserId(user_id) {
        const [rows] = await pool.execute(
            'SELECT * FROM members WHERE user_id = ?',
            [user_id]
        );
        return rows[0];
    }

    static async getAllMembers() {
        const [rows] = await pool.execute(
            `SELECT m.*, u.full_name, u.email, u.phone, u.county 
             FROM members m 
             JOIN users u ON m.user_id = u.id 
             ORDER BY m.membership_date DESC`
        );
        return rows;
    }

    static async updateStatus(memberId, status) {
        const [result] = await pool.execute(
            'UPDATE members SET status = ? WHERE id = ?',
            [status, memberId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Member;