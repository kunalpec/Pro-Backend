import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

  const { username, email, fullname, password } = req.body;

  // validate input
  if ([username, email, fullname, password].some(
    (field) => !field || field.trim() === ""
  )) {
    throw new ApiError(400, "All fields are required...");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Email should be correct...");
  }

  // check existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with this email or username already exists..."
    );
  }

  // files
  const avatarLocalPath = req.files?.Avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.CoverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "User Avatar is required...");
  }

  // upload
  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  const uploadedCoverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!uploadedAvatar) {
    throw new ApiError(400, "Avatar upload failed on Cloudinary...");
  }

  // create user
  const user = await User.create({
    username: username.toLowerCase(),
    fullname: fullname.toLowerCase(),
    email,
    password,
    avatar: uploadedAvatar.url,
    coverImage: uploadedCoverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User not created...");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdUser, "User registered successfully...")
    );
});

export default registerUser;
