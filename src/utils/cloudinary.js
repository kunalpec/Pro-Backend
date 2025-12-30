import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("Local File Not Reach to Cloudinary...");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    return null;
  } finally {
    if (localFilePath) {
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error("File delete failed:", err.message);
        }
      });
    }
  }
};

export default uploadOnCloudinary;

// {
//   "asset_id": "9a1b2c3d4e5f",
//   "public_id": "users/avatar_kunal",
//   "version": 1712345678,
//   "version_id": "abc123xyz",
//   "signature": "abcdef123456",
//   "width": 512,
//   "height": 512,
//   "format": "jpg",
//   "resource_type": "image",
//   "created_at": "2025-01-10T10:20:30Z",
//   "tags": [],
//   "bytes": 84567,
//   "type": "upload",
//   "etag": "abcd1234",
//   "placeholder": false,
//   "url": "http://res.cloudinary.com/demo/image/upload/v1712345678/users/avatar_kunal.jpg",
//   "secure_url": "https://res.cloudinary.com/demo/image/upload/v1712345678/users/avatar_kunal.jpg",
//   "original_filename": "profile"
// }
