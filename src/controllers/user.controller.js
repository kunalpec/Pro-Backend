import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  
  // 1. get the data from frontend
  const { username, email, fullname, password } = req.body;

  // 2. check the data whether empty or not
  if ([username, email, fullname, password].some(field?.trim === "")) {
    throw new ApiError(400, "All fields are required...");
  } else if (email.include("@")) {
    throw new ApiError(400, "Email should be correct...");
  }

  // 3. user already exist
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new (409, "User with this email or username already exists....")();
  }

  // 4. check files Avatar, CoverImage
  const AvatarlLocalPath = req.files?.Avatar[0]?.path;
  const CoverImageLocalPath = req.files?.CoverImage[0]?.path;

  if (!AvatarlLocalPath) {
    throw new (400, "User Avatar is Required...")();
  }

  // 5. save files to cloudinary
  const UploadedAvatar = await uploadOnCloudinary(AvatarlLocalPath);
  const UploadedCoverImage = await uploadOnCloudinary(CoverImageLocalPath);

  if (!UploadedAvatar) {
    throw new (400, "User Avatar is Required...")();
  }

  // 6. check the response for usercreation
  const UserDbResponse = await User.create({
    username: username.toLowerCase(),
    fullname: fullname.toLowerCase(),
    email: email,
    password: password,
    avatar: UploadedAvatar.url,
    coverImage: UploadedCoverImage?.url || "",
  });

  // 7. remove the passward and Refresh token feed from response to frontend
  const crestedUser = await User.findById(UserDbResponse._id).select(
    "-password -refreshToken"
  );

  if (crestedUser) {
    throw new ApiError(500, "User not created...");
  }

  // send res to user
  return res
    .status(201)
    .json(new ApiResponse(201, crestedUser, "User registed successfully..."));
});

export default registerUser;
