const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        mealType: {
            type: String,
            enum: ["breakfast", "lunch", "dinner", "snacks"],
            required: true,
        },

        date: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Meal", mealSchema);
