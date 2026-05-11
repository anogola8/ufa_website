const getEvents = (req, res) => {
    const events = [
        { id: 1, title: 'County Civic Education Forum', description: 'Comprehensive civic education forum on citizens rights.', event_date: '2024-06-15', time: '10:00 AM', location: 'Nairobi County Hall', event_type: 'civic_education' },
        { id: 2, title: 'Youth Leadership Summit 2024', description: 'Annual youth summit for leaders across Kenya.', event_date: '2024-06-20', time: '9:00 AM', location: 'Mombasa Convention Center', event_type: 'youth' },
        { id: 3, title: 'Women Empowerment Workshop', description: 'Workshop on economic empowerment for women.', event_date: '2024-07-05', time: '2:00 PM', location: 'Kisumu Social Hall', event_type: 'women' },
        { id: 4, title: 'Policy Advocacy Training', description: 'Training on effective policy advocacy strategies.', event_date: '2024-07-15', time: '11:00 AM', location: 'Nakuru Town Hall', event_type: 'advocacy' },
        { id: 5, title: 'PLWD Inclusion Forum', description: 'Forum on inclusion in community development.', event_date: '2024-08-01', time: '10:00 AM', location: 'Nairobi', event_type: 'general' }
    ];
    
    res.json({ success: true, count: events.length, events });
};

module.exports = { getEvents };