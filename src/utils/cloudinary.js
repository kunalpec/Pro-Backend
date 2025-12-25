import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDIARY_CLOUD_NAME,
  api_key: process.env.CLOUDIARY_API_KEY,
  api_secret: process.env.CLOUDIARY_API_SECRET_KEY, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (local_file_path) => {
  try {
    const response = await cloudinary.uploader.upload(local_file_path, {
      resource_type: "auto",
    });
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  } finally {
    fs.unlink(local_file_path, (err) => {
      if (err) {
        console.error("Something went wrong:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
  }
};

export default uploadOnCloudinary;
