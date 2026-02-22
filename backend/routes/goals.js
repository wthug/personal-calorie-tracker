const router = require('express').Router();
const Goal = require('../models/goal.model');

// Fetch the logged in user's goal
router.route('/').get(async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch the user's most recent goal
        const goal = await Goal.findOne({ user: userId }).sort({ date: -1 });

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's specific goal document, or insert a fresh one
        const goal = await Goal.findOneAndUpdate(
            { user: userId, date: today },
            {
                $set: {
                    dailyCalorieTarget,
                    proteinTarget,
                    carbTarget,
                    fatTarget,
                    weightGoal
                },
                $setOnInsert: {
                    user: userId,
                    date: today
                }
            },
            { returnDocument: 'after', upsert: true }
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
