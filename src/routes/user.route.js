import { Router } from "express";
import UploadToDisk from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/Auth.middleware.js";

const userRouter = Router();

// REGISTER URL -----------PART 1
userRouter.route("/register").post(
  UploadToDisk.fields([
    {
      name: "Avatar",
      maxCount: 1,
    },
    {
      name: "CoverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// LOGIN URL --------------PART 2
userRouter.route("/login").post(loginUser);

// LOGOUT URL--------------PART 3
userRouter.route("/logout").post(verifyJWT, logOutUser);

// RefreshAccessToken
userRouter.route("refresh-access-token").post(refreshAccessToken);

export default userRouter;
