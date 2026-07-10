const Notification = require("../../models/notificationModel");

// POST /api/notifications — staff broadcast a notification to everyone.
async function create(req, res, next) {
    try {
        const title = (req.body.title || "").trim();
        const body = (req.body.body || "").trim();
        if (!title || !body) {
            return res
                .status(400)
                .json({ success: false, message: "Title and message are required" });
        }
        const notification = await Notification.create({
            title,
            body,
            createdBy: req.user._id,
        });
        return res
            .status(201)
            .json({ success: true, message: "Notification sent", notification });
    } catch (error) {
        next(error);
    }
}

// GET /api/notifications — the 30 most recent, each flagged read/unread for the
// current user, plus the unread count for the bell badge.
async function listForMe(req, res, next) {
    try {
        const items = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        const uid = req.user._id.toString();
        const notifications = items.map((n) => ({
            _id: n._id,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            read: (n.readBy || []).some((id) => id.toString() === uid),
        }));
        return res.status(200).json({
            success: true,
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/notifications/read-all — mark everything read for the current user.
async function markAllRead(req, res, next) {
    try {
        await Notification.updateMany(
            { readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
}

module.exports = { create, listForMe, markAllRead };
