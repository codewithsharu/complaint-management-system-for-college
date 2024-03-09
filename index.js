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
    const tableNumber = req.body.tableNumber;
    res.render('complaint_form', { tableNumber: tableNumber });
});

// Route to handle complaint submission
app.post('/submit_complaint', (req, res) => {
    const tableNumber = req.body.tableNumber;
    const rollNumber = req.body.rollNumber;
    const complaintMessage = req.body.complaintMessage;

    // Insert the complaint into the database
    const insertComplaintQuery = `INSERT INTO complaints (table_number, roll_number, message) VALUES (?, ?, ?)`;
    connection.query(insertComplaintQuery, [tableNumber, rollNumber, complaintMessage], (error, results) => {
        if (error) {
            console.error('Error inserting complaint:', error);
            return res.status(500).send('Error submitting complaint');
        }
        console.log('Complaint submitted successfully');
        res.redirect('/admin');
    });
});

// Route to display admin panel
app.get('/admin', (req, res) => {
    // Fetch data for all tables
    const fetchTablesQuery = `SELECT * FROM complaints`;
    connection.query(fetchTablesQuery, (error, tablesData) => {
        if (error) {
            console.error('Error fetching tables data:', error);
            return res.status(500).send('Internal Server Error');
        }
        // Fetch complaints for all tables
        const fetchComplaintsQuery = `SELECT * FROM complaints`;
        connection.query(fetchComplaintsQuery, (error, complaintsData) => {
            if (error) {
                console.error('Error fetching complaints data:', error);
                return res.status(500).send('Internal Server Error');
            }
            res.render('admin', { tablesData: tablesData, complaintsData: complaintsData });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
