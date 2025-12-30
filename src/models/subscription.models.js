import mongoose from "mongoose";

const SubscriptionSchema = mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId, // whom user subscribing
      ref: "User",
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one Who is Subscribing the channel
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);
