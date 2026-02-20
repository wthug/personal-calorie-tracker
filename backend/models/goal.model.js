const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, 
        },

        dailyCalorieTarget: {
            type: Number,
            required: true,
        },

        proteinTarget: Number,
        carbTarget: Number,
        fatTarget: Number,

        weightGoal: Number, 
    },
    { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);
