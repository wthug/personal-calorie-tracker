const router = require('express').Router();
const Meal = require('../models/meal.model');
const FoodItem = require('../models/foodItem.model');

//Add a new meal 
router.route('/add').post(async (req, res) => {
    try {
        const { mealType, date, foodItems } = req.body;

        const userId = req.user.id;

        const newMeal = new Meal({
            user: userId,
            mealType,
            date: date
        });

        const savedMeal = await newMeal.save();

        let savedFoodItems = [];
        if (foodItems && foodItems.length > 0) {
            const foodItemsWithMealId = foodItems.map(item => ({
                ...item,
                meal: savedMeal._id
            }));

            savedFoodItems = await FoodItem.insertMany(foodItemsWithMealId);
        }

        res.status(201).json({
            message: 'Meal added successfully!',
            meal: savedMeal,
            foodItems: savedFoodItems
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET request: Fetch meals for the logged in user with optional filters
router.route('/').get(async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, mealType } = req.query;

        // Build the query object
        let query = { user: userId };

        // 1. Add date range filter if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                // Set to beginning of the start day
                query.date.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            }
            if (endDate) {
                // Set to end of the end day
                query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
            }
        }

        // 2. Add meal type filter if provided
        if (mealType) {
            query.mealType = mealType;
        }

        // Find meals matching the query and sort by date (newest first)
        const meals = await Meal.find(query).sort({ date: -1 });

        res.json(meals);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
