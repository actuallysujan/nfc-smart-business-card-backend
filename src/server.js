require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
