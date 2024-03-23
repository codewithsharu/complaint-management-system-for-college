app.post('/admin/login', (req, res) => {
    const password = req.body.password;
    if (password !== '12345') {
        res.status(401).send('Unauthorized');
        return;
    }
    const fetchComplaintsQuery = 'SELECT id, branch, roll_number, message, created_at, status, ref_id FROM complaints';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('admin', { complaints: complaints });
    });
});