import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
//---------------Helper Function-----------------------
const generateRefreshAndAccessToken = async (userId) => {
  try {
    // 1️ get user from DB
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 2️ generate tokens using schema methods
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    // 3️ store refresh token in DB
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    // 4️ return tokens
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while generating tokens"
    );
  }
};

// User Registeration controller
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  // validate input
  if (
    [username, email, fullname, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
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
    .json(new ApiResponse(201, createdUser, "User registered successfully..."));
});

// Login user controller
const loginUser = asyncHandler(async (req, res) => {
  // Get username, email and password from request body
  const { username, email, password } = req.body;

  // Check if user provided either username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required...");
  }

  // Check if password is provided
  if (!password) {
    throw new ApiError(400, "Password is required...");
  }

  // Find user in database using username or email
  const userInfo = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If user does not exist, throw error
  if (!userInfo) {
    throw new ApiError(400, "User does not exist...");
  }

  // Compare entered password with stored hashed password
  const isPasswordCorrect = await userInfo.isPasswordCorrect(password);

  // If password is wrong, throw error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect...");
  }

  // Generate access token and refresh token
  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    userInfo._id
  );

  // Get user data without password and refresh token
  const loggedInUser = await User.findById(userInfo._id).select(
    "-password -refreshToken"
  );

  // Cookie options for security
  const options = {
    httpOnly: true, // JS cannot access cookie
    secure: process.env.NODE_ENV === "production", // only secure in real deployment
    sameSite: "lax", // allows local cookies
  };

  // Send response with cookies and user data
  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // set access token cookie
    .cookie("refreshToken", refreshToken, options) // set refresh token cookie
    .json(
      new ApiResponse(
        200,
        {
          userInfo: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User successfully logged in"
      )
    );
});

// Logout user controller
const logOutUser = asyncHandler(async (req, res) => {
  // get the user id from req.user from middleware in middleware file...
  const userID = req.user._id;

  // get undefined the refreshToken
  await User.findByIdAndUpdate(userID, {
    $set: {
      refreshToken: null,
    },
  });

  // set behavior of cookies
  const options = {
    httpOnly: true, // JS cannot access cookie
    secure: process.env.NODE_ENV === "production", // only secure in real deployment
    sameSite: "lax", // allows local cookies
  };

  //  return the response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User LogOut Successfully..."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // 1️ Get refresh token from cookie OR request body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  // 2️ If refresh token not sent → error
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decodedToken;

  // 3️ Verify refresh token (JWT check)
  // jwt.verify can throw error → so wrap in try-catch
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_SECRET_KEY
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // 4️ Find user from DB using id from refresh token
  const user = await User.findById(decodedToken._id);

  // 5️ If user not found
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // 6️ IMPORTANT SECURITY CHECK
  // Check if refresh token matches the one stored in DB
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token does not match");
  }

  // 7️ Generate new access token
  const { refreshToken: newRefreshToken, accessToken: newAccessToken } =
    await generateRefreshAndAccessToken(user._id);

  // 98 Save new refresh token in DB
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  // 10 Cookie options (security)
  const options = {
    httpOnly: true, // frontend JS cannot access
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // allows local cookies
  };

  // 11 Send new tokens to frontend
  return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          access: newAccessToken,
          refresh: newRefreshToken,
        },
        "New Tokens Generated Successfully..."
      )
    );
});

export { registerUser, loginUser, logOutUser, refreshAccessToken };
