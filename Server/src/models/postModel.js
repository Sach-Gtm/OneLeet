const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        authorName: { type: String }, // denormalised for display
        body: { type: String, required: true, trim: true, maxlength: [3000, "Reply too long"] },
    },
    { timestamps: true }
);

// A community discussion / Q&A thread.
const PostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [160, "Title too long"],
        },
        body: {
            type: String,
            required: [true, "Body is required"],
            trim: true,
            maxlength: [5000, "Body too long"],
        },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        authorName: { type: String },
        subject: { type: String, trim: true, index: true },
        upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        replies: [ReplySchema],
    },
    { timestamps: true }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ title: "text", body: "text" });

module.exports = mongoose.model("Post", PostSchema);
