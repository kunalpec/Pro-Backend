import { Router } from "express";
import UploadToDisk from "../middlewares/multer.middleware.js";
import registerUser from "../controllers/user.controller.js";

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
