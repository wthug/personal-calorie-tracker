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

// Fetch all meals for the logged in user
router.route('/').get(async (req, res) => {
    try {
        const userId = req.user.id;

        const meals = await Meal.find({ user: userId }).sort({ date: -1 });

        res.json(meals);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
