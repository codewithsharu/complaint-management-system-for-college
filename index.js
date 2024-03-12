const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = 3000;
const path = require("path");

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aitamportal'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

app.use('/public/images/', express.static('./public/images'));

app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('select_table');
});

app.post('/select_table', (req, res) => {
    const branch = req.body.branch;
    res.render('complaint_form', { branch: branch });
});

app.post('/submit_complaint', (req, res) => {
    const branch = req.body.branch;
    const rollNumber = req.body.rollNumber;
    const complaintMessage = req.body.complaintMessage;

    const insertComplaintQuery = `INSERT INTO complaints (branch, roll_number, message) VALUES (?, ?, ?)`;
    connection.query(insertComplaintQuery, [branch, rollNumber, complaintMessage], (error, results) => {
        if (error) {
            console.error('Error inserting complaint:', error);
            return res.status(500).send('Error submitting complaint');
        }
        
        // Fetch the newly inserted ref_id
        const fetchRefIdQuery = `SELECT ref_id FROM complaints WHERE id = ?`;
        connection.query(fetchRefIdQuery, [results.insertId], (err, rows) => {
            if (err) {
                console.error('Error fetching ref_id:', err);
                return res.status(500).send('Error fetching ref_id');
            }
            
            const refId = rows[0].ref_id;
            // Render a page to display the ref_id
            res.render('complaint_ref_id', { refId: refId });
        });
    });
});


app.get('/admin', (req, res) => {
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

// Include ref_id in the API endpoint
app.get('/a/:branch/:roll/:ref_id', (req, res) => {
    const branch = req.params.branch;
    const rollNumber = req.params.roll;
    const refId = req.params.ref_id; // Get the ref_id

    const selectQuery = `SELECT * FROM complaints WHERE branch = ? AND roll_number = ?`;
    connection.query(selectQuery, [branch, rollNumber], (err, results) => {
        if (err) {
            console.error('Error selecting complaints:', err);
            return res.status(500).send('Error selecting complaints');
        }

        if (results.length === 0) {
            return res.status(404).send('No complaints found for this branch and roll number');
        }

        // Update status to 'processing' in the alldata table
        const updateStatusQuery = `UPDATE alldata SET status = 'processing' WHERE ref_id = ?`;
        connection.query(updateStatusQuery, [refId], (err, result) => {
            if (err) {
                console.error('Error updating status in alldata table:', err);
                return res.status(500).send('Error updating status in alldata table');
            }

            const tableName = branch;
            const insertQuery = `INSERT INTO ${tableName} (branch, roll_number, message, created_at, status, ref_id) VALUES ?`;
            const values = results.map(complaint => [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'pending', refId]); // Include ref_id

            connection.query(insertQuery, [values], (err, result) => {
                if (err) {
                    console.error('Error inserting complaints into branch table:', err);
                    return res.status(500).send('Error moving complaints to branch table');
                }

                const deleteQuery = `DELETE FROM complaints WHERE branch = ? AND roll_number = ?`;
                connection.query(deleteQuery, [branch, rollNumber], (err, result) => {
                    if (err) {
                        console.error('Error deleting complaints:', err);
                        return res.status(500).send('Error deleting complaints');
                    }

                    console.log('Complaints moved successfully');
                    res.redirect('/admin');
                });
            });
        });
    });
});



// Include ref_id in the branch routes
app.get('/:branch', (req, res) => {
    const branch = req.params.branch;
    const fetchComplaintsQuery = `SELECT * FROM ${branch}`;
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render(branch, { branch: branch, complaints: complaints });
    });
});
app.post('/mark_as_solved/:branch/:refId', (req, res) => {
    const branch = req.params.branch;
    const refId = req.params.refId;

    const sourceTable = branch; // Assuming the source table has the same name as the branch

    // Update the status to "processing" in the alldata table
    const updateStatusQuery = `UPDATE alldata SET status = 'solved' WHERE ref_id = ?`;
    connection.query(updateStatusQuery, [refId], (err, result) => {
        if (err) {
            console.error('Error updating status in alldata table:', err);
            return res.status(500).send('Error updating status in alldata table');
        }

        // Get the complaint details from the source table
        const selectQuery = `SELECT * FROM ${sourceTable} WHERE ref_id = ?`;
        connection.query(selectQuery, [refId], (err, results) => {
            if (err) {
                console.error('Error selecting complaint:', err);
                return res.status(500).send('Error selecting complaint');
            }

            if (results.length === 0) {
                return res.status(404).send('No complaint found with this ref id');
            }

            const complaint = results[0];

            // Insert the complaint into the solved table
            const insertQuery = `INSERT INTO solved (branch, roll_number, message, created_at, status, ref_id) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'solved', refId];

            connection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error inserting complaint into solved table:', err);
                    return res.status(500).send('Error moving complaint to solved table');
                }

                // Delete the complaint from the source table
                const deleteQuery = `DELETE FROM ${sourceTable} WHERE ref_id = ?`;
                connection.query(deleteQuery, [refId], (err, result) => {
                    if (err) {
                        console.error('Error deleting complaint from source table:', err);
                        return res.status(500).send('Error deleting complaint');
                    }

                    console.log('Complaint marked as solved and moved to solved table successfully');
                    res.redirect('/admin');
                });
            });
        });
    });
});


// Define a route to render the complaint status page
app.get('/c/check', (req, res) => {
    // Get the statusMessage from the request or set a default value
    const statusMessage = req.query.statusMessage || 'No status message available';
    res.render('complaint_status', { statusMessage: statusMessage });


});

// API endpoint to check complaint status based on refId
app.post('/c/check_complaint_status', (req, res) => {
    const refId = req.body.refId;

    // Check if the refId exists in alldata table
    const selectQuery = `SELECT status FROM alldata WHERE ref_id = ?`;
    connection.query(selectQuery, [refId], (err, results) => {
        if (err) {
            console.error('Error selecting complaint:', err);
            return res.status(500).send('Internal Server Error');
        }

        // If refId exists in alldata table
        if (results.length > 0) {
            const status = results[0].status;
            return res.render('complaint_status', { statusMessage: status });
        } else {
            // If refId does not exist in alldata table
            return res.render('complaint_status', { statusMessage: 'Invalid Ref ID' });
        }
    });
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
