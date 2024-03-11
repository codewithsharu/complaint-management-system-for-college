// Require necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const port = 3000;
const path = require("path");

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aitamportal'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

// Serve static files from public directory
app.use('/public/images/', express.static('./public/images'));

// Set views directory and view engine
app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'ejs');

// Parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Route to select a table
app.get('/', (req, res) => {
    res.render('select_table');
});

// Route to handle table selection
app.post('/select_table', (req, res) => {
    const branch = req.body.branch;
    res.render('complaint_form', { branch: branch });
});

// Route to handle complaint submission
app.post('/submit_complaint', (req, res) => {
    const branch


 = req.body.branch


;
    const rollNumber = req.body.rollNumber;
    const complaintMessage = req.body.complaintMessage;

    // Insert the complaint into the database
    const insertComplaintQuery = `INSERT INTO complaints (branch, roll_number, message) VALUES (?, ?, ?)`;
    connection.query(insertComplaintQuery, [branch


, rollNumber, complaintMessage], (error, results) => {
        if (error) {
            console.error('Error inserting complaint:', error);
            return res.status(500).send('Error submitting complaint');
        }
        console.log('Complaint submitted successfully');
        res.redirect('/admin');
    });
});

// Route to display admin panel// Route to display admin panel
app.get('/admin', (req, res) => {
    // Fetch complaints data from the database
    const fetchComplaintsQuery = 'SELECT * FROM complaints';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
      if (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Render the admin.ejs file with complaints data
      res.render('admin', { complaints: complaints });
    });
  });

  // GET API endpoint to redirect with branch and roll parameters
  app.get('/a/:branch/:roll', (req, res) => {
    const branch = req.params.branch;
    const rollNumber = req.params.roll;
    
    // Determine the table name based on the branch
    let tableName = '';
    switch(branch) {
        case 'csm':
            tableName = 'csm';
            break;
        case 'cse':
            tableName = 'cse';
            break;
        case 'eee':
            tableName = 'eee';
            break;
        case 'ece':
            tableName = 'ece';
            break;
        case 'civil':
            tableName = 'civil';
            break;
        case 'mec':
            tableName = 'mec';
            break;
        default:
            return res.status(400).send('Invalid branch');
    }

    // Move data from complaints table to the respective branch table
    const selectQuery = `SELECT * FROM complaints WHERE branch = ? AND roll_number = ?`;
    connection.query(selectQuery, [branch, rollNumber], (err, results) => {
        if(err) {
            console.error('Error selecting complaints:', err);
            return res.status(500).send('Error selecting complaints');
        }

        if(results.length === 0) {
            return res.status(404).send('No complaints found for this branch and roll number');
        }

        const insertQuery = `INSERT INTO ${tableName} (branch, roll_number, message, created_at, status) VALUES ?`;
        const values = results.map(complaint => [complaint.branch, complaint.roll_number, complaint.message, complaint.created_at, 'pending']);

        connection.query(insertQuery, [values], (err, result) => {
            if(err) {
                console.error('Error inserting complaints into branch table:', err);
                return res.status(500).send('Error moving complaints to branch table');
            }

            // Delete the complaints from the complaints table
            const deleteQuery = `DELETE FROM complaints WHERE branch = ? AND roll_number = ?`;
            connection.query(deleteQuery, [branch, rollNumber], (err, result) => {
                if(err) {
                    console.error('Error deleting complaints:', err);
                    return res.status(500).send('Error deleting complaints');
                }

                console.log('Complaints moved successfully');
                res.send("sucess");
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
