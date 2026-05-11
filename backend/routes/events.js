const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const sampleEvents = [
        {
            id: 1,
            title: 'County Civic Education Forum',
            description: 'Comprehensive civic education forum on citizens rights and responsibilities.',
            event_date: '2024-06-15T10:00:00',
            location: 'Nairobi County',
            event_type: 'civic_education'
        },
        {
            id: 2,
            title: 'Youth Leadership Summit 2024',
            description: 'Annual summit bringing together young leaders from across Kenya.',
            event_date: '2024-06-20T09:00:00',
            location: 'Mombasa',
            event_type: 'youth'
        },
        {
            id: 3,
            title: 'Women Empowerment Workshop',
            description: 'Workshop on economic empowerment and leadership for women.',
            event_date: '2024-07-05T14:00:00',
            location: 'Kisumu',
            event_type: 'women'
        }
    ];
    
    res.json({ success: true, events: sampleEvents });
});

module.exports = router;
