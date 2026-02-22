const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        date: {
            type: Date,
            required: true,
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

goalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Goal", goalSchema);
