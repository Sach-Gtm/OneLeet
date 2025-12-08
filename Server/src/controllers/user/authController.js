
async function Logout(req, res) {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(0),
        });

        return res.status(200).json({
            message: "Logout successful",
        });

    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Server error during logout" });
    }
}

module.exports = {

    Logout
};