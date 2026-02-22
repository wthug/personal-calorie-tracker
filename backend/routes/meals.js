const router = require('express').Router();
const mongoose = require('mongoose');
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

// GET request: Fetch paginated food items with optional date filters
router.route('/food-items').get(async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let dateMatch = {};
        if (startDate || endDate) {
            if (startDate) {
                dateMatch.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
            }
            if (endDate) {
                dateMatch.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
            }
        }

        const pipeline = [
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
                    ...(Object.keys(dateMatch).length > 0 ? { 'mealDetails.date': dateMatch } : {})
                }
            },
            { $sort: { 'mealDetails.date': -1, createdAt: -1 } }
        ];

        const results = await FoodItem.aggregate([
            {
                $facet: {
                    metadata: [...pipeline, { $count: "total" }],
                    data: [...pipeline, { $skip: skip }, { $limit: parseInt(limit) }]
                }
            }
        ]);

        const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            foodItems: results[0].data,
            pagination: {
                total,
                page: parseInt(page),
                totalPages,
                limit: parseInt(limit)
            }
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

        // Convert userId to ObjectId for aggregation $match
        query.user = new mongoose.Types.ObjectId(userId);

        // Find meals matching the query and join with FoodItems
        const meals = await Meal.aggregate([
            { $match: query },
            { $sort: { date: -1 } },
            {
                $lookup: {
                    from: "fooditems",
                    localField: "_id",
                    foreignField: "meal",
                    as: "foodItems"
                }
            }
        ]);

        res.json(meals);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
