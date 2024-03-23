const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = 3000;
const path = require("path");
const qr = require('qrcode');
const favicon = require('serve-favicon');
const session = require('express-session');

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


app.use(session({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))); // Serve favicon.ico file

app.use('/public/images/', express.static('./public/images'));

app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/st', (req, res) => {
    res.render('select_table');
});

app.get('/st/:branch', (req, res) => {
    const branch = req.params.branch;
    res.render('complaint_form', { branch: branch });
});
app.post('/submit_complaint', (req, res) => {
    const branch = req.body.branch;
    const rollNumber = req.body.rollNumber;
    const complaintType = req.body.complaintType; 
    const complaintMessage = req.body.complaintMessage;

    const insertComplaintQuery = `INSERT INTO complaints (branch, roll_number, type, message) VALUES (?, ?, ?, ?)`; // Include 'type' in the query
    connection.query(insertComplaintQuery, [branch, rollNumber, complaintType, complaintMessage], (error, results) => {
        if (error) {
            console.error('Error inserting complaint:', error);
            return res.status(500).send('Error submitting complaint');
        }
        
        const fetchRefIdQuery = `SELECT ref_id FROM complaints WHERE id = ?`;
        connection.query(fetchRefIdQuery, [results.insertId], (err, rows) => {
            if (err) {
                console.error('Error fetching ref_id:', err);
                return res.status(500).send('Error fetching ref_id');
            }
            
            const refId = rows[0].ref_id;

            qr.toDataURL(`http://localhost:3000/c/qr/${refId}`, (err, url) => {
                if (err) {
                    console.error('Error generating QR code:', err);
                    res.status(500).send('Error generating QR code');
                } else {
                    res.render('complaint_ref_id', { qrCodeUrl: url, refId: refId });
                }
            });
        });
    });
});




// app.get('/admin', (req, res) => {
//     res.render('admin-password');
// });

// Middleware to check authentication
function authenticate(req, res, next) {
    if (req.session.authenticated) {
        // User is authenticated, proceed to the next middleware
        next();
    } else {
        // User is not authenticated, redirect to admin login page
        res.render('admin-login');
    }
}

// Route for /admin
app.get('/admin', authenticate, (req, res) => {
    // Only accessible if authenticated
    // Your admin panel logic goes here
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




app.post('/admin/login', (req, res) => {
    const password = req.body.password;
    if (password !== '12345') {
        res.status(401).send('Unauthorized');
        return;
    }
    req.session.authenticated = true; // Set session variable upon successful login
    // Redirect to admin panel or dashboard
    res.redirect('/admin');
});

app.get('/a/all', (req, res) => {
    const fetchComplaintsQuery = 'SELECT id, branch, roll_number, message, created_at, status, ref_id FROM alldata';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('alldata', { complaints: complaints });
    });
});

app.get('/a/:branch/:roll/:ref_id', (req, res) => {
    const branch = req.params.branch;
    const rollNumber = req.params.roll;
    const refId = req.params.ref_id; 

    const selectQuery = `SELECT * FROM complaints WHERE branch = ? AND roll_number = ?`;
    connection.query(selectQuery, [branch, rollNumber], (err, results) => {
        if (err) {
            console.error('Error selecting complaints:', err);
            return res.status(500).send('Error selecting complaints');
        }

        if (results.length === 0) {
            return res.status(404).send('No complaints found for this branch and roll number');
        }

        const updateStatusQuery = `UPDATE alldata SET status = 'processing' WHERE ref_id = ?`;
        connection.query(updateStatusQuery, [refId], (err, result) => {
            if (err) {
                console.error('Error updating status in alldata table:', err);
                return res.status(500).send('Error updating status in alldata table');
            }

            const tableName = branch;
            const insertQuery = `INSERT INTO ${tableName} (branch, roll_number, message, created_at, status, ref_id,type) VALUES ?`;
            const values = results.map(complaint => [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'pending', refId,complaint.type]); // Include ref_id

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



app.get('/:branch', (req, res) => {
    const validBranches = ['csm', 'cse', 'ece', 'csd', 'eee', 'mec', 'civil', 'alldata','solved'];
    const branch = req.params.branch.toLowerCase(); 
    if (!validBranches.includes(branch)) {
        res.status(400).send('Invalid entry');
        return;
    }
    res.render('password', { branch: branch });
});

app.post('/:branch/complaints', (req, res) => {
    const password = req.body.password;
    if (password !== '12345') {
        res.status(401).send('Unauthorized');
        return;
    }
    const fetchComplaintsQuery = `SELECT * FROM ${req.params.branch.toLowerCase()}`;
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('table', { branch: req.params.branch.toLowerCase(), complaints: complaints });
    });
});


app.post('/mark_as_solved/:branch/:refId', (req, res) => {
    const branch = req.params.branch;
    const refId = req.params.refId;

    const sourceTable = branch; 

    const updateStatusQuery = `UPDATE alldata SET status = 'solved' WHERE ref_id = ?`;
    connection.query(updateStatusQuery, [refId], (err, result) => {
        if (err) {
            console.error('Error updating status in alldata table:', err);
            return res.status(500).send('Error updating status in alldata table');
        }

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

            const insertQuery = `INSERT INTO solved (branch, roll_number, message, created_at, status, ref_id) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'solved', refId];

            connection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error inserting complaint into solved table:', err);
                    return res.status(500).send('Error moving complaint to solved table');
                }

                const deleteQuery = `DELETE FROM ${sourceTable} WHERE ref_id = ?`;
                connection.query(deleteQuery, [refId], (err, result) => {
                    if (err) {
                        console.error('Error deleting complaint from source table:', err);
                        return res.status(500).send('Error deleting complaint');
                    }

                    console.log('Complaint marked as solved and moved to solved table successfully');
                    res.redirect(`/${sourceTable}`);

                });
            });
        });
    });
});


app.get('/c/check', (req, res) => {
    const statusMessage = req.query.statusMessage || 'No status message available';
    res.render('complaint_status', { statusMessage: statusMessage });


});

app.post('/c/check_complaint_status', (req, res) => {
    const refId = req.body.refId;

    const selectQuery = `SELECT status FROM alldata WHERE ref_id = ?`;
    connection.query(selectQuery, [refId], (err, results) => {
        if (err) {
            console.error('Error selecting complaint:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const status = results[0].status;
            return res.render('complaint_status', { statusMessage: { status: status, refId: refId } });
        } else {
            return res.render('complaint_status', { statusMessage: { status: 'Invalid Ref ID', refId: refId } });
        }
    });
});



app.get('/c/qr/:refId', (req, res) => {
    const refId = req.params.refId;

    const selectQuery = `SELECT status FROM alldata WHERE ref_id = ?`;
    connection.query(selectQuery, [refId], (err, results) => {
        if (err) {
            console.error('Error selecting complaint:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const status = results[0].status;
            return res.render('complaint_status', { statusMessage: { status: status, refId: refId } });
        } else {
            return res.render('complaint_status', { statusMessage: { status: 'Invalid Ref ID', refId: refId } });
        }
    });
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
