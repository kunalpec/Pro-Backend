// modules
import connectDB from "./db/db.js";
import dotenv from "dotenv";

// helper function
dotenv.config({
  path:".env"
});

connectDB();


















// import dotenv from "dotenv";
// import express from "express";
// helper function
// dotenv.config();
// app = express();
// // data base connection
// (async () => {
//   try {
//     // connect to mongo db
//     const connection = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${DB_NAME}`
//     );
//     console.log("Connected to MongoDB");

//     // app not able to listen
//     app.on("error", (error) => {
//       console.error("Error in Express app:", error.message);
//       throw error;
//     });

//     // app listening
//     app.listen(process.env.PORT, () => {
//       console.log(`Server is running on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error.message);
//     throw error;
//   }
// })();
