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
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

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
      refreshToken: undefined,
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

// refresh Access Token controller
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

// create New Password controller
const createNewPassword = asyncHandler(async (req, res) => {
  // Get old and new password from request body
  const { newPassword, oldPassword } = req.body;

  // If new password and old password are the same, throw error
  if (newPassword === oldPassword) {
    throw new ApiError(400, "Both passwords are the same");
  }

  // Get user id from JWT authentication middleware
  const userId = req.user?._id;

  // Find user in database
  const userInfo = await User.findById(userId);

  // If user does not exist, throw error
  if (!userInfo) {
    throw new ApiError(401, "User not found");
  }

  // Check if old password matches the stored hashed password
  const isPasswordCorrect = await userInfo.isPasswordCorrect(oldPassword);

  // If old password is incorrect, throw error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect old password");
  }

  // Set new password (will be hashed by mongoose pre-save hook)
  userInfo.password = newPassword;

  // Save updated user without validating unchanged required fields
  await userInfo.save({ validateBeforeSave: false });

  // Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

// get the current user info controller
const getCurrentUserInfo = asyncHandler(async (req, res) => {
  // get the user info from JWT auth Function
  const userInfo = req.user;

  // send the response to frontend
  return res
    .status(200)
    .json(new ApiResponse(200, userInfo, "This is the current user Info..."));
});

// update the user account controller
const UpdateAccountInfo = asyncHandler(async (req, res) => {
  // make the possible changing fields
  const allowedFields = ["username", "fullname", "email"];
  // updation in this
  const updateData = {};

  // add the newly updated values in updated object
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // return error if not updation happen
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  // Update the values in user with id
  const updateUser = await User.findByIdAndUpdate(
    req.user._id, //current user
    { $set: updateData },
    {
      new: true,
      runValidators: true, // schema validation
    }
  ).select("-password -refreshToken");

  // Updated Succesfully
  res
    .status(200)
    .json(new ApiResponse(200, updateUser, "Profile updated successfully"));
});

// update Avatar file
const UpdateUserAvatar = asyncHandler(async (req, res) => {
  // get the req.file that contains new Avatar file
  const avatarLocalFile = req.file?.path;

  // if avatar file is missing
  if (!avatarLocalFile) {
    throw new ApiError(400, "Avatar file is missing...");
  }

  // if get then file send to cloudinary
  const uploadedAvatar = await uploadOnCloudinary(avatarLocalFile);

  // if url not get from cloudinary
  if (!uploadedAvatar?.url) {
    throw new ApiError(500, "Avatar upload failed...");
  }

  // if get then save the path in mongoDB database
  const updatedAvatar = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: uploadedAvatar.url,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");

  // send the new data to user
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedAvatar, "Avatar file Updated Successfully...")
    );
});

// update CoverImage file
const UpdateUserCoverImage = asyncHandler(async (req, res) => {
  // get the req.file that contains new CoverImage file
  const coverImageLocalFile = req.file?.path;

  // if avatar file is missing
  if (!coverImageLocalFile) {
    throw new ApiError(400, "coverImage file is missing...");
  }

  // if get then file send to cloudinary
  const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalFile);

  // if url not get from cloudinary
  if (!uploadedCoverImage?.url) {
    throw new ApiError(500, "coverImage upload failed...");
  }

  // if get then save the path in mongoDB database
  const updatedCoverImage = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: uploadedCoverImage.url,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");

  // send the new data to user
  return res
    .status(200)
    .json(
      new ApiResponse(200,updatedCoverImage, "Cover image updated successfully...")
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUserInfo,
  UpdateAccountInfo,
  UpdateUserAvatar,
  UpdateUserCoverImage
};
