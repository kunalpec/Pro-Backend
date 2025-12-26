import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import UploadToDisk from "../middlewares/multer.middleware.js";

const userRouter = Router();
userRouter.route("/register").post(
  UploadToDisk.fields([
    {
      name:"Avatar",
      maxCount:1
    },
    {
      name:"CoverImage",
      maxCount:1
    }
  ]),
  registerUser);

export default userRouter;
