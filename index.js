require('dotenv').config();

const express = require('express'); 
const app = express(); 
const session = require('express-session');



app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET 
}));

app.set('view engine', 'ejs');

const userRoutes = require('./routes/userRoute');

app.use('/',userRoutes);




const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const qr = require('qrcode');
const path = require("path");
const { Complaint, Alldata, Solved } = require('./db');

const PORT = process.env.PORT || 3000;
const favicon = require('serve-favicon');

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var nodemailer = require('nodemailer');
const moment = require('moment');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aitam.grievance.cell@gmail.com',
        pass: 'plzs tfdm peob pjdd'
    }
});


// CHECK GA

app.get('/logout', (req, res) => {

    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://complaint-management-system-for-college-2bte.onrender.com/');
        // res.redirect('/');
    });
});


app.get('/displayEmail', (req, res) => {
    const email = req.session.verifiedemail;
    res.render('displayEmail', { email });
});



app.get('/gc/c', (req, res) => {
  
    // Get current date and time formatted
    const formattedDateTime = moment().format('MMMM Do YYYY, h:mm:ss a');

    // HTML-formatted email content
    var mailOptions = {
        from: 'aitam.grievance.cell@gmail.com',
        to: 'tirumalareddi712@gmail.com',
        subject: 'Complaint Registration Confirmation',
        html: `
    <p>CHECKKING!!!!!!,</p>
   
`
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.send("done");

});


const mongoURI = 'mongodb+srv://wbest5991:BuXQEithRk1oSOrW@cluster0.vnkbvtr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
//  const mongoURI = 'mongodb://localhost:27017/cp'


mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});





function generateRefId() {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000); // Generate 8 random digits
    return `${timestamp}${randomDigits}`;
}


app.post('/submit_complaint', async (req, res) => {
    const { branch, rollNumber, email, complaintType, complaintMessage } = req.body;


    const refId = generateRefId();

    try {



        console.log("check");


        const now = new Date();


        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;

        const newComplaint = new Complaint({
            branch,
            rollNumber,
            complaintType,
            complaintMessage,
            refId,
            createdDate: formattedDate
        });



        const savedComplaint = await newComplaint.save();


        const newData = new Alldata({
            refid: refId,
            status: 'pending',
            message: complaintMessage,
            rollNumber: rollNumber,
            mail: email,
            createdDate: formattedDate
        });
        await newData.save();


        const qrCodeUrl = await qr.toDataURL(`https://complaint-management-system-for-college-2bte.onrender.com/c/qr/${refId}`);


        res.render('complaint_ref_id', { qrCodeUrl, refId });


        // Get current date and time formatted
        const formattedDateTime = moment().format('MMMM Do YYYY, h:mm:ss a');

        // HTML-formatted email content
        var mailOptions = {
            from: 'aitam.grievance.cell@gmail.com',
            to: `${email}`,
            subject: 'Complaint Registration Confirmation',
            html: `
        <p>Dear User,</p>
        <p>Your complaint has been successfully registered with AITAM Portal.</p>
        <p><strong>Reference ID:</strong> ${refId}</p>
        <p>Date & Time: ${formattedDateTime}</p>
        <p>Thank you for using our service.</p>
        <a href="https://complaint-management-system-for-college-2bte.onrender.com/c/qr/${refId}" target="_blank">CHECK-STATUS</a>

        <p>Best regards,<br>AITAM Portal Team</p>
    `
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });


    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).send('Error submitting complaint');
    }
});



// app.use(session({
//     secret: 'shgvashggcfgcvcgv',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
// }));



app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/public/images/', express.static('./public/images'));

app.set("views", path.join(__dirname, "/views"));


app.use(bodyParser.urlencoded({ extended: true }));








app.get('/', async (req, res) => {
    console.log("home checkk");
    const email = req.session.verifiedemail;
    try {
        const complaints = await Alldata.find();

        console.log(complaints);

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

        res.render('home', {
            complaints: complaints,
            pendingCount: pendingCount,
            processingCount: processingCount,
            solvedCount: solvedCount,email
        });
    } catch (error) {
        console.error(error);

        res.status(500).send('Internal Server Error');
    }
});


app.get('/hod', (req, res) => {
    res.render('hod');
});

app.get('/st', (req, res) => {
    res.render('select_table');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/st/:branch', (req, res) => {
    const branch = req.params.branch;
    const email = req.session.verifiedemail;
    req.session.branch = branch;

    res.render('complaint_form', { branch,email });
    console.log("CHECK branch");
    console.log(req.session.branch);
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



function authenticateAdmin(req, res, next) {
    if (req.session.authenticatedAdmin) {
        next();
    } else {
        res.render('admin-login');
    }
}
app.get('/admin', authenticateAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find({});

        console.log(complaints);
        res.render('admin', { complaints: complaints });
    } catch (err) {
        console.error('Error fetching complaints from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
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


app.get('/submit_complaint', (req, res) => {
    res.render('complaint_form');
});





app.post('/mark_as_solved/:branch/:refId', async (req, res) => {

    const branch = req.params.branch;
    const refId = req.params.refId;
    console.log("FIRST STEP");
    console.log(refId);
    console.log("CHECK !");

    try {
        // Step 1: Fetch documents from MongoDB Approved collection using ref_id

        const complaints = await Complaint.find({ refId: refId });



        if (complaints.length === 0) {
            return res.status(404).send('No complaints found for this branch and roll number');
        }

        console.log("FIRST STEP");
        console.log(complaints);
        console.log("SUCESS 1");




        // Step 2: Insert documents into MongoDB solved collection
        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;

        const newComplaint = new Solved({

            refid: refId,
            solvedDate: formattedDate
        });

        const savedComplaint = await newComplaint.save();


        // Step 3: Update status to 'solved' in alldata collection at ref_id

        const updateResult = await Alldata.updateOne({ refid: refId }, { $set: { status: 'solved', solvedDate: formattedDate } });

        if (updateResult.modifiedCount === 0) {
            throw new Error('No document found in alldata collection to update');
        }

        const result = await Alldata.findOne({ refid: refId });
        const email = result.mail || null;
        if (result) {
           
            if (email) {
                console.log(`The email for refId ${refId} is: ${email}`);
            } else {
                console.log(`No email found for refId ${refId}`);
            }
        } else {
            console.log(`No document found with refId ${refId}`);
        }




        // Step 4: Delete one document from approved collection
        const deleteResult = await Complaint.deleteOne({ refId: refId });

        if (deleteResult.deletedCount === 0) {
            throw new Error('No document deleted from complaints collection');
        }

        console.log('Complaints moved successfully');
        res.redirect(`/${branch}`);


        
        const formattedDateTime = moment().format('MMMM Do YYYY, h:mm:ss a');

        // HTML-formatted email content
        var mailOptions = {
            from: 'aitam.grievance.cell@gmail.com',
            to: `${email}`,
            subject: 'Complaint Solved',
            html: `n
        <p>Dear User,</p>
        <p>Your complaint was solved</p>
        <p><strong>Reference ID:</strong> ${refId}</p>
        <p>Date & Time: ${formattedDateTime}</p>
        <p>Thank you for using our service.</p>
        <a href="https://complaint-management-system-for-college-2bte.onrender.com/c/qr/${refId}" target="_blank">CHECK-STATUS</a>

        <p>Best regards,<br>AITAM Portal Team</p>
    `
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        console.log("LAST STEP");
    }
});


app.get('/a/all', async (req, res) => {
    console.log("ALL DATA");
    try {
        const complaints = await Alldata.find();

        console.log(complaints);

        let pendingCount = 0;
        // let processingCount = 0;
        let solvedCount = 0;

        complaints.forEach(complaint => {
            switch (complaint.status) {
                case 'pending':
                    pendingCount++;
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
            solvedCount: solvedCount
        });
    } catch (error) {
        console.error(error);

        res.status(500).send('Internal Server Error');
    }
});


function authenticateBranch(req, res, next) {
    if (req.session.authenticatedHod) {
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

app.get('/:branch', authenticateBranch, async (req, res) => {
    const validBranches = ['csm', 'cse', 'ece', 'csd', 'eee', 'mec', 'civil', 'alldata', 'mba', 'mt', 'it'];
    const branch = req.params.branch.toLowerCase();

    if (!validBranches.includes(branch)) {
        res.status(400).send('Invalid entry');
        return;
    }

    try {

        const complaints = await Complaint.find({ branch: branch }).exec();


        res.render('table', { branch: branch, complaints: complaints });
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).send('Internal Server Error');
    }
});





app.get('/c/check', (req, res) => {
    const statusMessage = req.query.statusMessage || 'No status message available';
    res.render('complaint_status', { statusMessage: statusMessage });


});



app.get('/c/qr/:refId', async (req, res) => {


    const refId = req.params.refId;

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





// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


