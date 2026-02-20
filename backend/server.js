const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import and use JWT authentication middleware
const authMiddleware = require('./middleware/auth');
app.use(authMiddleware);

// Database connection
const uri = process.env.MONGODB_URI;
if (uri) {
    mongoose.connect(uri)
        .then(() => {
            console.log('MongoDB database connection established successfully');
        })
        .catch((err) => {
            console.log('MongoDB connection error:', err);
        });
} else {
    console.log('Warning: MONGODB_URI environment variable not defined. Skipping database connection.');
}

// Routes setup
const usersRouter = require('./routes/users');
const mealsRouter = require('./routes/meals');

app.use('/users', usersRouter);
app.use('/meals', mealsRouter);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Calorie Tracker API is running...');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
