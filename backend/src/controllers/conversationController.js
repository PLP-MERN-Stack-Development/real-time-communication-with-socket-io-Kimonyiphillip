const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const UserProfile = require("../models/UserProfile");
const asyncHandler = require("../utils/asyncHandler");

const pickProfiles = async (userIds) => {
  const uniqueIds = [...new Set(userIds)];
  const profiles = await UserProfile.find({
    clerkUserId: { $in: uniqueIds }
  }).select("clerkUserId displayName avatarUrl email lastSeenAt");

  const map = new Map();
  profiles.forEach((profile) => {
    map.set(profile.clerkUserId, profile);
  });

  // Ensure there is stub record for missing profiles
  uniqueIds.forEach((id) => {
    if (!map.has(id)) {
      map.set(id, {
        clerkUserId: id,
        displayName: `User ${id.slice(-4)}`,
        avatarUrl: "",
        lastSeenAt: null
      });
    }
  });

  return map;
};

const mapProfileToPlain = (profile, clerkUserId) => {
  if (!profile) {
    return {
      clerkUserId,
      displayName: `User ${clerkUserId.slice(-4)}`,
      avatarUrl: "",
      email: "",
      lastSeenAt: null
    };
  }

  const plain = profile.toObject ? profile.toObject({ getters: false, virtuals: false }) : profile;

  return {
    clerkUserId,
    displayName: plain.displayName || `User ${clerkUserId.slice(-4)}`,
    avatarUrl: plain.avatarUrl || "",
    email: plain.email || "",
    lastSeenAt: plain.lastSeenAt || null
  };
};

const formatConversation = (conversation, profileMap, currentUserId) => {
  const isGroup = conversation.isGroup;
  const isGlobal = conversation.isGlobal;
  const members = conversation.members.map((id) =>
    mapProfileToPlain(profileMap.get(id), id)
  );
  const otherMembers = members.filter((member) => member.clerkUserId !== currentUserId);
  const primaryMember = otherMembers[0] || members[0];

  const title = isGlobal 
    ? "Global Chat" 
    : conversation.name || (isGroup
      ? (conversation.name || "Group chat")
      : primaryMember?.displayName || "Conversation");

  const avatar = isGroup
    ? ""
    : primaryMember?.avatarUrl || "";

  const unreadCounts = conversation.unreadCounts || new Map();

  return {
    id: conversation._id.toString(),
    name: title,
    isGroup,
    isGlobal,
    avatar,
    members,
    unreadCount: unreadCounts.get
      ? unreadCounts.get(currentUserId) || 0
      : unreadCounts[currentUserId] || 0,
    lastMessage: conversation.lastMessage
      ? {
          ...conversation.lastMessage,
          createdAt: conversation.lastMessage.createdAt
        }
      : null,
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    createdAt: conversation.createdAt,
    adminId: conversation.adminId || null
  };
};

/**
 * Get user's conversations including global room
 */
exports.listMyConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;

  // Get personal conversations
  const personalConversations = await Conversation.find({
    members: currentUserId,
    isGlobal: false
  }).sort({ lastMessageAt: -1, updatedAt: -1 });

  // Get global room
  const globalRoom = await Conversation.findOne({ isGlobal: true });
  
  let allConversations = [...personalConversations];
  
  // Add user to global room members if not already there
  if (globalRoom && !globalRoom.members.includes(currentUserId)) {
    globalRoom.members.push(currentUserId);
    await globalRoom.save();
  }
  
  if (globalRoom) {
    allConversations.unshift(globalRoom); // Put global room first
  }

  const profileMap = await pickProfiles(allConversations.flatMap((c) => c.members));

  const payload = allConversations.map((conversation) =>
    formatConversation(conversation, profileMap, currentUserId)
  );

  res.json(payload);
});

/**
 * Create or get 1-on-1 conversation
 */
exports.ensureConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ message: "targetUserId required" });
  }

  if (targetUserId === currentUserId) {
    return res.status(400).json({ message: "Cannot start a conversation with yourself" });
  }

  let conversation = await Conversation.findOne({
    isGroup: false,
    isGlobal: false,
    members: { $all: [currentUserId, targetUserId], $size: 2 }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      members: [currentUserId, targetUserId],
      lastMessageAt: null,
      unreadCounts: Object.fromEntries([
        [currentUserId, 0],
        [targetUserId, 0]
      ])
    });
  }

  const profiles = await pickProfiles(conversation.members);
  const formatted = formatConversation(conversation, profiles, currentUserId);

  res.status(201).json(formatted);
});

/**
 * Get conversation details
 */
exports.getConversationDetail = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation id" });
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  // For global room, allow access to all users
  if (!conversation.isGlobal && !conversation.members.includes(currentUserId)) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  // Add user to global room if accessing it
  if (conversation.isGlobal && !conversation.members.includes(currentUserId)) {
    conversation.members.push(currentUserId);
    await conversation.save();
  }

  const profiles = await pickProfiles(conversation.members);
  const formatted = formatConversation(conversation, profiles, currentUserId);

  res.json(formatted);
});

/**
 * Create group conversation
 */
exports.createGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.auth.userId;
  const { name, memberIds } = req.body;

  if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ message: "Name and at least one member are required" });
  }

  // Include current user in members
  const allMembers = [...new Set([currentUserId, ...memberIds])];

  const conversation = await Conversation.create({
    name,
    isGroup: true,
    adminId: currentUserId,
    members: allMembers,
    lastMessageAt: new Date(),
    unreadCounts: Object.fromEntries(allMembers.map(id => [id, 0]))
  });

  const profiles = await pickProfiles(conversation.members);
  const formatted = formatConversation(conversation, profiles, currentUserId);

  res.status(201).json(formatted);
});