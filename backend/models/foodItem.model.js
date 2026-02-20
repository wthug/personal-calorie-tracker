const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
    {
        meal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meal",
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        quantity: {
            type: String, 
            required: true,
        },

        calories: {
            type: Number,
            required: true,
        },

        protein: Number,
        carbs: Number,
        fat: Number,

        vitamins: {
            type: Map,
            of: Number, 
        },

        minerals: {
            type: Map,
            of: Number,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
