import { getRounds } from "bcrypt";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // use cloudinary services
      required: true,
    },
    coverImage: {
      type: String, // use cloudinary services
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save",async function(next){
  if (!this.isModified("password")) return next()
  this.password=await bcrypt.hash(this.password,10)
  next()
})

UserSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password);
}

export const User = mongoose.model("User", UserSchema);
