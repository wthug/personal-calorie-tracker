const router = require('express').Router();
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// GET request (Read): Find all users
router.route('/').get((req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('Error: ' + err));
});

// POST request (Register): Add a new user
router.route('/add').post(async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            process.env.JWT_SECRET || 'super_secret',
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User created successfully!',
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST request (Login)
router.route('/login').post(async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'super_secret',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Logged in successfully',
            token
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test authenticated route
router.route('/profile').get((req, res) => {
    // req.user comes from the auth middleware
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

module.exports = router;
