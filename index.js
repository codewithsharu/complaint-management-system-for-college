const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const qr = require('qrcode');
const path = require("path");
const { Complaint, Alldata } = require('./db'); 
const app = express();
const PORT = process.env.PORT || 3000;
const favicon = require('serve-favicon');
const session = require('express-session');
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Example: serve static files from 'public' folder
app.set('view engine', 'ejs'); // Example: set view engine to ejs for rendering templates

// MongoDB connection URL
const mongoURI = 'mongodb://localhost:27017/your_database_name';

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Event listeners for MongoDB connection status
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});



// ??????? VERIFIED ??????


function generateRefId() {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000); // Generate 8 random digits
    return `${timestamp}${randomDigits}`;
}

app.post('/submit_complaint', async (req, res) => {
    const { branch, rollNumber, complaintType, complaintMessage } = req.body;

    // Generate refId
    const refId = generateRefId();

    try {
        // Create a new complaint document
        const newComplaint = new Complaint({
            branch,
            rollNumber,
            complaintType,
            complaintMessage,
            refId
        });

        // Save complaint to MongoDB
        const savedComplaint = await newComplaint.save();

        
        console.log("INSERTING INTO ALLDATA");
        // Insert refId into Alldata collection
        const newData = new Alldata({
            refid: refId,
            status: 'pending' // Default status for Alldata
        });
        await newData.save();
        
        console.log("AFTER INSERTING INTO ALLDATA");

        // Generate QR code URL
        const qrCodeUrl = await qr.toDataURL(`http://localhost:${PORT}/c/qr/${refId}`);

        // Render response with QR code URL and refId
        res.render('complaint_ref_id', { qrCodeUrl, refId });

    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).send('Error submitting complaint');
    }
});



app.use(session({
    secret: 'shgvashggcfgcvcgv',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))); 
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
app.post('/c/check_complaint_status', async (req, res) => {
    const refId = req.body.refId;

    try {
        const data = await Alldata.findOne({ refid: refId });

        console.log("DATA IS ");
        console.log(data);

        if (data) {
            const status = data.status;
            return res.render('complaint_status', { statusMessage: { status: status, refId: refId } });
        } else {
            return res.render('complaint_status', { statusMessage: { status: 'Invalid Ref ID', refId: refId } });
        }
    } catch (err) {
        console.error('Error finding complaint:', err);
        return res.status(500).send('Internal Server Error');
    }
});



// ?????????????????????????????????????????????????????






function authenticateAdmin(req, res, next) {
    if (req.session.authenticatedAdmin) {
        next();
    } else {
        res.render('admin-login');
    }
}

app.get('/admin', authenticateAdmin, (req, res) => {
  
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
    req.session.authenticatedAdmin = true; 
    res.redirect('/admin');
});

app.get('/a/all', (req, res) => {
    const fetchComplaintsQuery = 'SELECT id, branch, roll_number, message, created_at, status, ref_id, solved_at  FROM alldata';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        let pendingCount = 0;
        let processingCount = 0;
        let solvedCount = 0;

        complaints.forEach(complaint => {
            switch (complaint.status) {
                case 'pending':
                    pendingCount++;
                    break;
                case 'processing':
                    processingCount++;
                    break;
                case 'solved':
                    solvedCount++;
                    break;
                default:
                    
                    break;
            }
        });

        res.render('alldata', { 
            complaints: complaints, 
            pendingCount: pendingCount,
            processingCount: processingCount,
            solvedCount: solvedCount
        });
    });
});


app.get('/a/:branch/:roll/:ref_id', (req, res) => {
    const branch = req.params.branch;
    const rollNumber = req.params.roll;
    const refId = req.params.ref_id; 

    const selectQuery = `SELECT * FROM complaints WHERE ref_id = ? AND roll_number = ?`;
    connection.query(selectQuery, [refId, rollNumber], (err, results) => {
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




function authenticateBranch(req, res, next) {
    if (req.session.authenticatedHod){
        next();
    } else {
        const branch = req.params.branch;
        res.render('branch-login', { branch });
    }
}

app.post('/:branch/login', (req, res) => {
    const password = req.body.password;
    const branch = req.params.branch;
   
    if (password === '12345') { 
        req.session.authenticatedHod = true; 
   
        res.redirect(`/${branch}`);
    } else {

        res.send("wrong password");
    }
});


app.get('/:branch', authenticateBranch, (req, res) => {
    
    const validBranches = ['csm', 'cse', 'ece', 'csd', 'eee', 'mec', 'civil', 'alldata','mba','mt','it'];
    const branch = req.params.branch.toLowerCase(); 
    if (!validBranches.includes(branch)) {
        res.status(400).send('Invalid entry');
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

            const insertQuery = `INSERT INTO solved (branch, roll_number, message, created_at, status, ref_id, type) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const values = [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'solved', refId,complaint.type];

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

// app.post('/c/check_complaint_status', (req, res) => {
//     const refId = req.body.refId;

//     const selectQuery = `SELECT status FROM alldata WHERE ref_id = ?`;
//     connection.query(selectQuery, [refId], (err, results) => {
//         if (err) {
//             console.error('Error selecting complaint:', err);
//             return res.status(500).send('Internal Server Error');
//         }

//         if (results.length > 0) {
//             const status = results[0].status;
//             return res.render('complaint_status', { statusMessage: { status: status, refId: refId } });
//         } else {
//             return res.render('complaint_status', { statusMessage: { status: 'Invalid Ref ID', refId: refId } });
//         }
//     });
// });





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



// Example route: Display a form to submit a complaint
app.get('/submit_complaint', (req, res) => {
    res.render('complaint_form'); // Example: render a complaint form using an ejs template
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



app.get('/', (req, res) => {
    res.render('home');
});