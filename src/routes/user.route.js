import { Router } from "express";
import UploadToDisk from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  createNewPassword,
  getCurrentUserInfo,
  UpdateAccountInfo,
  UpdateUserAvatar,
  UpdateUserCoverImage,
  getUserChannelProfile,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/Auth.middleware.js";

const userRouter = Router();

// REGISTER URL
userRouter.route("/register").post(
  UploadToDisk.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// LOGIN URL
userRouter.route("/login").post(loginUser);

// LOGOUT URL
userRouter.route("/logout").post(verifyJWT, logOutUser);

// REFRESH ACCESS TOKEN
userRouter.route("/refresh-access-token").post(refreshAccessToken);

// CREATE NEW PASSWORD
userRouter.route("/create-new-password").patch(verifyJWT, createNewPassword);

// GET CURRENT USER INFO
userRouter.route("/get-current-user-info").get(verifyJWT, getCurrentUserInfo);

// UPDATE ACCOUNT (TEXT ONLY)
userRouter.route("/update-user-account").patch(verifyJWT, UpdateAccountInfo);

// UPDATE AVATAR FILE
userRouter
  .route("/update-avatar-file")
  .patch(verifyJWT, UploadToDisk.single("avatar"), UpdateUserAvatar);

// UPDATE COVER IMAGE FILE
userRouter
  .route("/update-coverImage-file")
  .patch(verifyJWT, UploadToDisk.single("coverImage"), UpdateUserCoverImage);

// fetch user Channel info
userRouter.route("/channel-info/:username").get(verifyJWT, getUserChannelProfile);
export default userRouter;
