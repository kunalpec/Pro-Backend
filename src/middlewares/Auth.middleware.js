import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // get token from cookie or Authorization header
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    // token missing
    if (!token) {
      throw new ApiError(401, "Access token is missing");
    }

    // verify token
    const decodedInfo = jwt.verify(token, process.env.ACCESS_SECRET_KEY);

    // get user from DB
    const userInfo = await User.findById(decodedInfo._id).select(
      "-password -refreshToken"
    );

    // user not found
    if (!userInfo) {
      throw new ApiError(401, "Invalid access token");
    }

    // attach user to request
    req.user = userInfo;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export default verifyJWT;
