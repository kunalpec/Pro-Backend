// modules...
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import app from "./app.js";

// helper function...
dotenv.config({
  path: ".env",
}); 

// connecting to Data Base function in db/db.js...
connectDB()
  .then(() => {

    // if express app not run proper way...
    app.on("error", (error) => {
      console.error("Error in Express app:", error.message);
      throw error;
    });

    // if express app run in proper way...
    app.listen(process.env.PORT, () => {
      console.log(`Server is running at :${process.env.PORT}`);
    });
    
  })
  .catch((error) => {
    console.log("Mongo db connection loss !!!...");
  });






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
