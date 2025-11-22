const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const UserProfile = require("../models/UserProfile");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Check if user has access to conversation and return conversation
 */
const ensureConversationAccess = async (conversationId, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error("Invalid conversation id");
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  if (!conversation.members.includes(currentUserId)) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }

  return conversation;
};

/**
 * Get messages for a conversation with pagination
 */
exports.getMessagesForConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await ensureConversationAccess(conversationId, currentUserId);

  // Calculate pagination
  const skip = (page - 1) * limit;

  let messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 }) // Get newest first for pagination
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Reverse to show oldest first in UI
  messages = messages.reverse();

  // Mark messages as seen
  if (messages.length > 0) {
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUserId },
        readBy: { $ne: currentUserId }
      },
      {
        $addToSet: { readBy: currentUserId },
        $set: { status: "seen" }
      }
    );
  }

  // Update read status for real-time
  messages = messages.map((message) => {
    const readBy = Array.isArray(message.readBy) ? message.readBy : [];
    const hasRead = readBy.includes(currentUserId);
    const nextReadBy = hasRead ? readBy : [...readBy, currentUserId];
    const status = message.senderId === currentUserId ? message.status : "seen";
    return {
      ...message,
      readBy: nextReadBy,
      status
    };
  });

  // Reset unread count for this user
  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }
  if (conversation.unreadCounts instanceof Map) {
    conversation.unreadCounts.set(currentUserId, 0);
  } else {
    conversation.unreadCounts[currentUserId] = 0;
  }
  await conversation.save();

  res.json({
    messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: messages.length === parseInt(limit)
    }
  });
});

/**
 * Send a new message (text, image, or file)
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { conversationId, text, type = "text", fileUrl, fileName, fileSize } = req.body;

  if (!conversationId) {
    return res.status(400).json({ message: "conversationId is required" });
  }

  if (type === "text" && !text?.trim()) {
    return res.status(400).json({ message: "Text is required for text messages" });
  }

  if ((type === "image" || type === "file") && !fileUrl) {
    return res.status(400).json({ message: "fileUrl is required for file messages" });
  }

  const conversation = await ensureConversationAccess(conversationId, currentUserId);

  const profile =
    (await UserProfile.findOne({ clerkUserId: currentUserId })) ||
    {
      displayName: "You",
      avatarUrl: ""
    };

  const message = await Message.create({
    conversationId,
    senderId: currentUserId,
    senderName: profile.displayName,
    senderAvatar: profile.avatarUrl,
    text: text?.trim() || "",
    type,
    fileUrl: fileUrl || "",
    fileName: fileName || "",
    fileSize: fileSize || 0,
    readBy: [currentUserId],
    status: "sent",
    reactions: []
  });

  // Update conversation unread counts and last message
  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }

  const updateUnread = (memberId) => {
    if (conversation.unreadCounts instanceof Map) {
      const prev = conversation.unreadCounts.get(memberId) || 0;
      conversation.unreadCounts.set(memberId, memberId === currentUserId ? 0 : prev + 1);
    } else {
      const prev = conversation.unreadCounts[memberId] || 0;
      conversation.unreadCounts[memberId] = memberId === currentUserId ? 0 : prev + 1;
    }
  };

  conversation.members.forEach(updateUnread);

  conversation.lastMessage = {
    text: type === "text" ? message.text : `Sent a ${type}`,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar,
    createdAt: message.createdAt,
    type: message.type
  };
  conversation.lastMessageAt = message.createdAt;

  await conversation.save();

  // Real-time broadcasting
  if (global.io) {
    // Send to conversation room
    global.io.to(conversationId).emit("message:new", {
      conversationId, 
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        text: message.text,
        type: message.type,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        status: message.status,
        readBy: message.readBy,
        reactions: message.reactions,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }
    });

    // Notify conversation members of update
    conversation.members
      .filter((memberId) => memberId !== currentUserId)
      .forEach((memberId) => {
        global.io.to(memberId).emit("conversation:update", { 
          conversationId,
          unreadCount: conversation.unreadCounts instanceof Map 
            ? conversation.unreadCounts.get(memberId) || 0
            : conversation.unreadCounts[memberId] || 0
        });
      });

    // Send notification for new messages
    conversation.members
      .filter((memberId) => memberId !== currentUserId)
      .forEach((memberId) => {
        global.io.to(memberId).emit("notification:new", {
          type: "new_message",
          conversationId,
          message: {
            text: type === "text" ? text : `Sent a ${type}`,
            senderName: message.senderName
          }
        });
      });
  }

  res.status(201).json(message);
});

/**
 * Add reaction to a message
 */
exports.addReaction = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { messageId } = req.params;
  const { reaction } = req.body;

  if (!messageId || !reaction) {
    return res.status(400).json({ message: "messageId and reaction are required" });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  // Check if user has access to the conversation
  await ensureConversationAccess(message.conversationId, currentUserId);

  // Remove existing reaction from this user
  message.reactions = message.reactions.filter(r => r.userId !== currentUserId);
  
  // Add new reaction
  message.reactions.push({
    userId: currentUserId,
    reaction,
    createdAt: new Date()
  });

  await message.save();

  // Broadcast reaction in real-time
  if (global.io) {
    global.io.to(message.conversationId.toString()).emit("message:react", {
      messageId: message._id,
      userId: currentUserId,
      reaction,
      conversationId: message.conversationId
    });
  }

  res.json(message);
});