const router = require('express').Router();
const Goal = require('../models/goal.model');

// GET request: Fetch the logged in user's goal
router.route('/').get(async (req, res) => {
    try {
        const userId = req.user.id;
        const goal = await Goal.findOne({ user: userId });

        if (!goal) {
            return res.status(404).json({ message: 'No goal found for this user.' });
        }
        res.json(goal);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST request: Create or Update (Upsert) the user's goal
router.route('/').post(async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            dailyCalorieTarget,
            proteinTarget,
            carbTarget,
            fatTarget,
            weightGoal
        } = req.body;

        // Upsert: Find the document to update. If it doesn't exist, create it.
        const goal = await Goal.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                dailyCalorieTarget,
                proteinTarget,
                carbTarget,
                fatTarget,
                weightGoal
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: 'Goal saved successfully!',
            goal
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
