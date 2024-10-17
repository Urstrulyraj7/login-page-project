const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Database connected!');
});

// Routes
app.post('/signup', [
    check('email', 'Email is not valid').isEmail(),
    check('password', 'Password must be 6+ characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('SELECT email FROM users WHERE email = ?', [email], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            return res.status(400).json({ message: 'Email already registered!' });
        }

        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;

        // Send verification email
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Failed to send verification email.' });
            }

            db.query('INSERT INTO users SET ?', { username, email, password: hashedPassword, verified: false }, (err) => {
                if (err) throw err;
                return res.status(201).json({ message: 'Signup successful, please verify your email!' });
            });
        });
    });
});

app.get('/verify-email', (req, res) => {
    const token = req.query.token;

    if (!token) return res.status(400).json({ message: 'Invalid token.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Invalid or expired token.' });

        db.query('UPDATE users SET verified = true WHERE email = ?', [decoded.email], (err) => {
            if (err) throw err;
            return res.status(200).json({ message: 'Email verified successfully!' });
        });
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) throw err;
        if (result.length === 0) return res.status(400).json({ message: 'Username or password incorrect!' });

        const user = result[0];

        if (!user.verified) {
            return res.status(400).json({ message: 'Please verify your email before logging in!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Username or password incorrect!' });


        return res.status(200).json({ message: 'Login successful!' });
    });
});

// Password reset request
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) throw err;
        if (result.length === 0) return res.status(400).json({ message: 'No user found with that email address!' });

        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Send reset password email
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Failed to send password reset email.' });
            }

            return res.status(200).json({ message: 'Password reset email sent!' });
        });
    });
});

// Handle password reset
app.post('/reset-password', (req, res) => {
    const token = req.query.token;
    const { newPassword } = req.body;

    if (!token) return res.status(400).json({ message: 'Invalid token.' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Invalid or expired token.' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, decoded.email], (err) => {
            if (err) throw err;
            return res.status(200).json({ message: 'Password reset successfully!' });
        });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
