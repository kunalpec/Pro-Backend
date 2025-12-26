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
