import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, nezr) => {
  try {
    // access token from frontsend website || mobile
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    // if token is not avaliable from frontend
    if (!token) {
      throw ApiError(400, "AccessToken is not there in request header...");
    }
  
    // if token is present
    const DecodedInfo = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
  
    // get the user info
    const userInfo = await User.findById(DecodedInfo?._id).select(
      "-pasword -refreshToken"
    );
  
    // if user not present
    if (!userInfo) {
      throw ApiError(401, "Invalid Access Token...");
    }
  
    req.user = userInfo;
    next();
  } catch (error) {
    throw ApiError(401,"Invalid Access Token...")
  }
});


export default verifyJWT;