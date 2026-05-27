const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: process.env.EMAIL_USER,
  subject: 'BookIt Test Email',
  text: 'If you receive this email nodemailer is working correctly!',
}, (err, info) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});