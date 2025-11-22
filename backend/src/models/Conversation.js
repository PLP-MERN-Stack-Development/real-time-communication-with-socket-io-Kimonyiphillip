const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    name: { 
      type: String,
      default: ""
    },
    isGroup: { 
      type: Boolean, 
      default: false 
    },
    isGlobal: {
      type: Boolean,
      default: false
    },
    adminId: { 
      type: String 
    },
    members: [
      {
        type: String, // Clerk user IDs
        required: true
      }
    ],
    lastMessage: {
      text: String,
      senderId: String,
      senderName: String,
      senderAvatar: String,
      createdAt: Date,
      type: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text"
      }
    },
    lastMessageAt: { 
      type: Date,
      default: Date.now 
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for better performance
conversationSchema.index({ members: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isGlobal: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
