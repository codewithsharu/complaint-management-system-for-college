// // Z:\COLLEGE_MDB\cms\complaint-management-system-for-college\db.js

// const mongoose = require('mongoose');

// // Define Complaint schema
// const complaintSchema = new mongoose.Schema({
//     branch: { type: String, required: true },
//     rollNumber: { type: String, required: true },
//     complaintType: { type: String, required: true },
//     complaintMessage: { type: String, required: true },
//     refId: { type: String, required: true, unique: true }
// });

// // Create Complaint model
// const Complaint = mongoose.model('Complaint', complaintSchema);

// // Define Alldata schema
// const alldataSchema = new mongoose.Schema({
//     refid: { type: String, required: true, unique: true },
//     status: { type: String, default: 'pending' }
// });

// // Create Alldata model
// const Alldata = mongoose.model('Alldata', alldataSchema);

// module.exports = { Complaint, Alldata };


const mongoose = require('mongoose');

// Define Complaint schema
const complaintSchema = new mongoose.Schema({
    branch: { type: String, required: true },
    rollNumber: { type: String, required: true },
    complaintType: { type: String, required: true },
    complaintMessage: { type: String, required: true },
    refId: { type: String, required: true, unique: true }
});

// Create Complaint model
const Complaint = mongoose.model('Complaint', complaintSchema);

// Define Alldata schema
const alldataSchema = new mongoose.Schema({
    refid: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' }
});

// Create Alldata model
const Alldata = mongoose.model('Alldata', alldataSchema);

module.exports = { Complaint, Alldata };
