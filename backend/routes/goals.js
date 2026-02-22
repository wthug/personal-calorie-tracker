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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = {
            date: today,
            dailyCalorieTarget,
            proteinTarget,
            carbTarget,
            fatTarget
        };

        let goal = await Goal.findOne({ user: userId });

        if (goal) {
            goal.dailyCalorieTarget = dailyCalorieTarget;
            goal.proteinTarget = proteinTarget;
            goal.carbTarget = carbTarget;
            goal.fatTarget = fatTarget;
            goal.weightGoal = weightGoal;

            // Update today's snapshot if it exists, otherwise push a new one
            const existingIndex = goal.history.findIndex(h => {
                const hDate = new Date(h.date);
                hDate.setHours(0, 0, 0, 0);
                return hDate.getTime() === today.getTime();
            });

            if (existingIndex >= 0) {
                goal.history[existingIndex] = snapshot;
            } else {
                goal.history.push(snapshot);
            }
            await goal.save();
        } else {
            goal = new Goal({
                user: userId,
                dailyCalorieTarget,
                proteinTarget,
                carbTarget,
                fatTarget,
                weightGoal,
                history: [snapshot]
            });
            await goal.save();
        }

        res.status(200).json({
            message: 'Goal saved successfully!',
            goal
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
