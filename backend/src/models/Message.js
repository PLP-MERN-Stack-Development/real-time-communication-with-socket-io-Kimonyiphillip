const mongoose = require("mongoose");
const { Schema } = mongoose;

const reactionSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  reaction: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    senderId: {
      type: String, // Clerk user id
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderAvatar: {
      type: String,
      default: ""
    },
    text: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text"
    },
    fileUrl: {
      type: String,
      default: ""
    },
    fileName: {
      type: String,
      default: ""
    },
    fileSize: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    readBy: {
      type: [String],
      default: []
    },
    reactions: [reactionSchema] // Array of reactions
  },
  { 
    timestamps: true 
  }
);

// Index for better message retrieval performance
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
