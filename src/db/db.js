import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// connectionInstance (mongoose)
//  ├── connection
//  │    ├── host
//  │    ├── port
//  │    ├── name
//  │    └── readyState
//  ├── models
//  ├── model()
//  ├── disconnect()

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`Connected to MongoDB ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
