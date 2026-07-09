require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on the Port ${PORT}`);
});
