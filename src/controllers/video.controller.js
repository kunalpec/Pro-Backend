import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import deleteUploadFileToCloudinary from "../utils/deleteCloudinaryImage.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // 1️ query params
  const {
    page = "1",
    limit = "10",
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  // 2️ numbers
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 10);
  const skipdoc = (pageNumber - 1) * limitNumber;

  // 3️ filter
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  // 4️ sort (safe)
  const allowedSortFields = ["createdAt", "views", "title"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const sortOptions = {
    [safeSortBy]: sortType === "asc" ? 1 : -1,
  };

  // 5️ aggregation
  const result = await Video.aggregate([
    { $match: filter },
    { $sort: sortOptions },

    // Video Model
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        // User Model
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
    // get the multiple output from one input
    {
      $facet: {
        data: [{ $skip: skipdoc }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  // 6️⃣ response
  const videos = result[0].data;
  const totalVideos = result[0].totalCount[0]?.count || 0;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, totalVideos },
        "Successfully got the videos"
      )
    );
});

const publishVideo = asyncHandler(async (req, res) => {
  // 0 get the title, description
  const { title, description } = req.body;

  // 1 get the thumbnail, video
  const localVideoPath = req.files?.video[0]?.path;
  const localThumbnailPath = req.files?.thumbnail[0]?.path;

  // 2 Check the presence of paths
  if (!localVideoPath) throw new ApiError(400, "Video is missing");
  if (!localThumbnailPath) throw new ApiError(400, "Thumbnail is missing");

  // 3 Upload video to Cloudinary
  const uploadedVideo = await uploadOnCloudinary(localVideoPath);

  // error handling
  if (!uploadedVideo?.url || !uploadedVideo?.public_id) {
    throw new ApiError(500, "Video upload failed");
  }

  // 4 Upload thumbnail to Cloudinary
  const uploadedThumbnail = await uploadOnCloudinary(localThumbnailPath);

  // error handling
  if (!uploadedThumbnail?.url || !uploadedThumbnail?.public_id) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  // 5 Save video in DB
  const video = await Video.create({
    videoFile: {
      url: uploadedVideo.url,
      public_id: uploadedVideo.public_id,
    },
    thumbnail: {
      url: uploadedThumbnail.url,
      public_id: uploadedThumbnail.public_id,
    },
    title,
    description,
    duration: uploadedVideo.duration || 0,
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // 1. Get and validate videoId
  const { videoId } = req.params;

  console.log(videoId);
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // 2. Aggregate to populate owner info
  const result = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { fullname: 1, username: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
  ]);

  // 3. Check if video exists
  if (!result?.length) {
    throw new ApiError(404, "Video not found");
  }

  // 4. Return response
  return res
    .status(200)
    .json(new ApiResponse(200, result[0], "Successfully fetched video by ID"));
});

const updateVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // 1️⃣ validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // 2️⃣ get update fields
  const { title, description } = req.body;

  // 3️⃣ find video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 4️⃣ ownership check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  // 5️⃣ update text fields (no nesting)
  if (title) video.title = title;
  if (description) video.description = description;

  // 6️⃣ thumbnail update (guard-style)
  const localThumbnailPath = req.file?.path;
  if (localThumbnailPath) {
    const uploadedThumbnail = await uploadOnCloudinary(localThumbnailPath);

    if (!uploadedThumbnail?.url || !uploadedThumbnail?.public_id) {
      throw new ApiError(500, "Thumbnail upload failed");
    }

    await deleteUploadFileToCloudinary(video.thumbnail.public_id);

    video.thumbnail = {
      url: uploadedThumbnail.url,
      public_id: uploadedThumbnail.public_id,
    };
  }

  // 7️⃣ save & respond
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

export { getAllVideos, publishVideo, getVideoById, updateVideoById };
