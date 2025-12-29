import mongoose from "mongoose";

const SubscriptionSchema = mongoose.Schema(
  {
    subscriber: [
      {
        type: mongoose.Schema.Types.ObjectId, // one Who is Subscribing the channel
        ref: "User",
      },
    ],
    channel: {
      type: mongoose.Schema.Types.ObjectId, // whom user subscribing 
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);
