require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/config/db");
const { startEmailHealthChecks } = require("./src/utils/email");

connectDB();

// Probe email deliverability so OTP only turns on when mail can actually be
// sent from this host (and turns itself back off if that changes).
startEmailHealthChecks();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on the Port ${PORT}`);
});
