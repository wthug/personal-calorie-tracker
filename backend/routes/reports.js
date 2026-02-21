const router = require('express').Router();
const mongoose = require('mongoose');
const Meal = require('../models/meal.model');
const FoodItem = require('../models/foodItem.model');
const Goal = require('../models/goal.model');

// Fetching weekly summary grouped by day
router.route('/weekly').get(async (req, res) => {
    try {
        const userId = req.user.id;

        // Calculating date 7 days ago
        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 7);
        pastWeek.setHours(0, 0, 0, 0);

        // Performing an aggregation to join FoodItems with Meals and group by date
        const weeklyData = await FoodItem.aggregate([
            {
                // Joining with meals collection
                $lookup: {
                    from: 'meals',
                    localField: 'meal',
                    foreignField: '_id',
                    as: 'mealDetails'
                }
            },
            {
                // Deconstruct the mealDetails array
                $unwind: '$mealDetails'
            },
            {
                // Filter for this user's meals within the past week
                $match: {
                    'mealDetails.user': new mongoose.Types.ObjectId(userId),
                    'mealDetails.date': { $gte: pastWeek }
                }
            },
            {
                // Group by the formatted date string and sum up the macros
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$mealDetails.date" } },
                    totalCalories: { $sum: "$calories" },
                    totalProtein: { $sum: "$protein" },
                    totalCarbs: { $sum: "$carbs" },
                    totalFat: { $sum: "$fat" },
                    totalVitA: { $sum: "$vitamins.a" },
                    totalVitC: { $sum: "$vitamins.c" },
                    totalVitD: { $sum: "$vitamins.d" },
                    totalIron: { $sum: "$minerals.iron" },
                    totalCalcium: { $sum: "$minerals.calcium" },
                    totalMagnesium: { $sum: "$minerals.magnesium" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(weeklyData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Today's Goal vs Actual comparison
router.route('/today').get(async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user's active goal
        const goal = await Goal.findOne({ user: userId });

        if (!goal) {
            return res.status(404).json({ message: 'Setup your goals first to view comparison.' });
        }

        // Calculate today's start and end times
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Aggregate totals for today
        const todaysTotals = await FoodItem.aggregate([
            {
                $lookup: {
                    from: 'meals',
                    localField: 'meal',
                    foreignField: '_id',
                    as: 'mealDetails'
                }
            },
            { $unwind: '$mealDetails' },
            {
                $match: {
                    'mealDetails.user': new mongoose.Types.ObjectId(userId),
                    'mealDetails.date': { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    consumedCalories: { $sum: "$calories" },
                    consumedProtein: { $sum: "$protein" },
                    consumedCarbs: { $sum: "$carbs" },
                    consumedFat: { $sum: "$fat" },
                    consumedVitA: { $sum: "$vitamins.a" },
                    consumedVitC: { $sum: "$vitamins.c" },
                    consumedVitD: { $sum: "$vitamins.d" },
                    consumedIron: { $sum: "$minerals.iron" },
                    consumedCalcium: { $sum: "$minerals.calcium" },
                    consumedMagnesium: { $sum: "$minerals.magnesium" }
                }
            }
        ]);

        // If today's totals array is empty, default values to 0
        const actuals = todaysTotals.length > 0 ? todaysTotals[0] : {
            consumedCalories: 0,
            consumedProtein: 0,
            consumedCarbs: 0,
            consumedFat: 0,
            consumedVitA: 0,
            consumedVitC: 0,
            consumedVitD: 0,
            consumedIron: 0,
            consumedCalcium: 0,
            consumedMagnesium: 0
        };

        res.json({
            goal: {
                targetCalories: goal.dailyCalorieTarget,
                targetProtein: goal.proteinTarget || 0,
                targetCarbs: goal.carbTarget || 0,
                targetFat: goal.fatTarget || 0
            },
            actual: actuals
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Fetching today's trend by meal type
router.route('/today-trend').get(async (req, res) => {
    try {
        const userId = req.user.id;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayData = await FoodItem.aggregate([
            {
                $lookup: {
                    from: 'meals',
                    localField: 'meal',
                    foreignField: '_id',
                    as: 'mealDetails'
                }
            },
            { $unwind: '$mealDetails' },
            {
                $match: {
                    'mealDetails.user': new mongoose.Types.ObjectId(userId),
                    'mealDetails.date': { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: "$mealDetails.mealType",
                    totalCalories: { $sum: "$calories" }
                }
            }
        ]);

        res.json(todayData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
