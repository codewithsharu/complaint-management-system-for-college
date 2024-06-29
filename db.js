const mongoose = require('mongoose');

// Define Complaint schema
const complaintSchema = new mongoose.Schema({
    branch: { type: String, required: true },
    rollNumber: { type: String, required: true },
    complaintType: { type: String, required: true },
    complaintMessage: { type: String, required: true },
    refId: { type: String, required: true, unique: true },
    createdDate: { type: String }
});

// Define Alldata schema
const alldataSchema = new mongoose.Schema({
    refid: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    createdDate: { type: String },
    solvedDate: { type: String }
});

// Define Approved schema
const approvedSchema = new mongoose.Schema({
    branch: { type: String, required: true },
    rollNumber: { type: String, required: true },
    complaintType: { type: String, required: true },
    complaintMessage: { type: String, required: true },
    refId: { type: String, required: true, unique: true }
   
});


// Function to get date only
function getDateOnly(date) {
    // Ensure date is valid
    if (!date) return null;

    // Convert date to a formatted date string (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
}

// Create Complaint model
const Complaint = mongoose.model('Complaint', complaintSchema);

// Create Alldata model
const Alldata = mongoose.model('Approved', approvedSchema);

const Approved = mongoose.model('Approved', approvedSchema);

module.exports = { Complaint, Alldata, Approved };