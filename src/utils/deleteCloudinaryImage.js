import { v2 as cloudinary } from "cloudinary";
import ApiError from "./ApiError.js";

const deleteUploadFileToCloudinary = async (publicId, fileName = "File") => {
  try {
    // if publicId is missing, nothing to delete
    if (!publicId) return;

    const response = await cloudinary.uploader.destroy(publicId);

    // optional: check cloudinary response
    if (response.result !== "ok") {
      throw new ApiError(500, `${fileName} not deleted from Cloudinary`);
    }

    return response;
  } catch (error) {
    throw new ApiError(500, `${fileName} file deletion failed from Cloudinary`);
  }
};

export default deleteUploadFileToCloudinary;
