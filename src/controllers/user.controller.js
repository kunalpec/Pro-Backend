import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

//---------------Helper Function-----------------------

const GenerateRefreshAndAccessToken = async (userId) => {
  try {
    const user = User.findById(userId);
    const generateRefreshToken = user.generateRefreshToken();
    const generateAccessToken = user.generateAccessToken();

    user.refreshToken = generateRefreshToken;
    await user.save({ ValidateBeforeSave: false }); // just save the data not validate it

    return { generateRefreshToken, generateAccessToken };
  } catch {
    throw ApiError(
      500,
      "something goes wrong while generating the jwt token..."
    );
  }
};

// User Registeration...
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

// User LoginUser...
const loginUser = asyncHandler(async (req, res) => {
  // 1️ Get data from the request body
  const { username, email, password } = req.body;

  // 2️ Validate that the user has provided either username or email
  if (!username && !email) {
    throw new ApiError(400, "Username || Email is Required...");
  }

  // 3️ Validate that password is provided
  if (!password) {
    throw new ApiError(400, "Password is Required...");
  }

  // 4️ Search for the user in the database by username OR email
  const userInfo = await User.findOne({
    $or: [{ username }, { email }],
  });

  // 5️ If user not found in DB, throw error
  if (!userInfo) {
    throw new ApiError(400, "User Not exist...");
  }

  // 6️ Check if the provided password matches the stored hashed password
  const isPasswordCorrect = await userInfo.isPasswordCorrect(password);

  // 7️ If password is incorrect, throw error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect...");
  }

  // 8️ If user exists and password is correct, generate JWT tokens
  const { RefreshToken, AccessToken } = await GenerateRefreshAndAccessToken(
    userInfo._id
  );

  // 9️ Send success response to client with tokens or redirect info
  const LoggedInUser = await User.findOne({
    $or: [{ username }, { email }],
  }).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    security: true,
  };

  return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          userInfo: LoggedInUser,
          UserRefreshToken: RefreshToken,
          UserAcessToken: AccessToken,
        },
        "user successfully LoggedIn..."
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  const userID = req.user._id;

  await User.findByIdAndUpdate(userID, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = {
    httpOnly: true,
    security: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(ApiResponse(200, "User LogOut Successfully..."));
});
export { registerUser, loginUser, logOutUser };
