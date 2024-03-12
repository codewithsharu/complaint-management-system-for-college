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
    const branch


 = req.body.branch


;
    const rollNumber = req.body.rollNumber;
    const complaintMessage = req.body.complaintMessage;

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

app.get('/admin', (req, res) => {
    const fetchComplaintsQuery = 'SELECT * FROM complaints';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
      if (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.render('admin', { complaints: complaints });
    });
  });

  app.get('/a/:branch/:roll', (req, res) => {
    const branch = req.params.branch;
    const rollNumber = req.params.roll;
    
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

            const deleteQuery = `DELETE FROM complaints WHERE branch = ? AND roll_number = ?`;
            connection.query(deleteQuery, [branch, rollNumber], (err, result) => {
                if(err) {
                    console.error('Error deleting complaints:', err);
                    return res.status(500).send('Error deleting complaints');
                }

                console.log('Complaints moved successfully');
                res.redirect('/admin');
            });
        });
    });
});


app.get('/csm', (req, res) => {
    const branch = 'csm';
    const fetchComplaintsQuery = 'SELECT * FROM csm';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('csm', { branch: branch, complaints: complaints });
    });
});

app.get('/cse', (req, res) => {
    const branch = 'cse';
    const fetchComplaintsQuery = 'SELECT * FROM cse';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('cse', { branch: branch, complaints: complaints });
    });
});

app.get('/eee', (req, res) => {
    const branch = 'eee';
    const fetchComplaintsQuery = 'SELECT * FROM eee';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('eee', { branch: branch, complaints: complaints });
    });
});

app.get('/ece', (req, res) => {
    const branch = 'ece';
    const fetchComplaintsQuery = 'SELECT * FROM ece';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('ece', { branch: branch, complaints: complaints });
    });
});

app.get('/civil', (req, res) => {
    const branch = 'civil';
    const fetchComplaintsQuery = 'SELECT * FROM civil';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('civil', { branch: branch, complaints: complaints });
    });
});

app.get('/mec', (req, res) => {
    const branch = 'mec';
    const fetchComplaintsQuery = 'SELECT * FROM mec';
    connection.query(fetchComplaintsQuery, (err, complaints) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('mec', { branch: branch, complaints: complaints });
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
