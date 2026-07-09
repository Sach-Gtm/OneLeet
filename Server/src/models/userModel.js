const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Denormalised prep stats surfaced on the dashboard / profile. These start at
// zero and will be updated by the Tests / PYQ features as they land.
const StatsSchema = new mongoose.Schema(
    {
        testsTaken: { type: Number, default: 0 },
        pyqsSolved: { type: Number, default: 0 },
        studyHours: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },     // percentage, 0-100
        streak: { type: Number, default: 0 },       // consecutive active days
        overallPrep: { type: Number, default: 0 },  // syllabus coverage %, 0-100
        lastActiveAt: { type: Date },               // for streak calculation
    },
    { _id: false }
);

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide your name"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        role: {
            type: String,
            enum: ["student", "teacher"],
            default: "student",
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone number too long"],
        },
        avatar: {
            type: String,
        },

        // Academic info (shown on the profile page)
        college: { type: String, trim: true, maxlength: [120, "College name too long"] },
        branch: { type: String, trim: true, maxlength: [80, "Branch name too long"] },
        yearOfStudy: { type: String, trim: true, maxlength: [40, "Value too long"] },
        targetExam: { type: String, trim: true, maxlength: [60, "Value too long"] },

        plan: {
            type: String,
            enum: ["free", "pro"],
            default: "free",
        },
        stats: {
            type: StatsSchema,
            default: () => ({}),
        },

        // Auth
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        resetPasswordToken: { type: String, select: false },
        resetPasswordExpire: { type: Date, select: false },
    },
    { timestamps: true }
);

// Hash the password whenever it is set/changed. Google-only accounts have no
// password, so guard on presence. (Mongoose 9 async hooks resolve via the
// returned promise — no `next` callback is passed.)
UserSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
