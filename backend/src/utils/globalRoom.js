const Conversation = require("../models/Conversation");

/**
 * Ensure global chat room exists
 */
async function ensureGlobalRoom() {
  try {
    let globalRoom = await Conversation.findOne({ isGlobal: true });
    
    if (!globalRoom) {
      globalRoom = await Conversation.create({
        name: "Global Chat",
        isGroup: true,
        isGlobal: true,
        members: [], // All users can join dynamically
        lastMessageAt: new Date()
      });
      
      console.log("Global chat room created");
    }
    
    return globalRoom;
  } catch (error) {
    console.error("Error ensuring global room:", error);
  }
}

module.exports = {
  ensureGlobalRoom
};