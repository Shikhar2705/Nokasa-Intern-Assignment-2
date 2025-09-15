require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios');
const nodemailer = require('nodemailer');

const API_URL = 'https://api.nokasa.co/check';
const RECIPIENT_EMAIL = 'support@nokasa.co';


// Configure the email transporter using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send alert email
async function sendAlertEmail(status, error) {
    const currentTime = new Date().toUTCString();
    const subject = 'Nokasa: Service down';
    const body = `
        Attention: The monitoring check for Nokasa API failed.

        Time: ${currentTime}
        Endpoint: ${API_URL}
        Response Status: ${status}
        
        Error Details: 
        ${error ? error.message : 'N/A'}
    `;

    const mailOptions = {
        from: `"Nokasa Monitor" <${process.env.EMAIL_USER}>`,
        to: RECIPIENT_EMAIL,
        subject: subject,
        text: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Alert email sent successfully.');
    } catch (emailError) {
        console.error('Error sending alert email:', emailError);
    }
}

// Main function to check the service status
async function checkService() {
    console.log(`Checking service at ${new Date().toISOString()}...`);
    try {
        const response = await axios.get(API_URL, { timeout: 10000 }); // 10-second timeout
        
        if (response.status !== 200) {
            console.log(`Service is down! Status: ${response.status}`);
            await sendAlertEmail(response.status, { message: `Received status code ${response.status}` });
        } else {
            console.log(`Service is up. Status: ${response.status}.`);
        }
    } catch (error) {
        // This catches network errors (e.g., server unreachable) or timeouts
        console.error('An error occurred during the check:', error.message);
        await sendAlertEmail(error.code || 'No Response', error);
    }
}

checkService();