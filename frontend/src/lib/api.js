import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const createAuthenticatedClient = (userId) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId
    }
  });

  return instance;
};

export function createApiClient(userId) {
  const client = createAuthenticatedClient(userId);

  return {
    users: {
      async list() {
        const res = await client.get("/api/users");
        return res.data;
      },
      async syncProfile(payload) {
        const res = await client.post("/api/users/sync", payload);
        return res.data;
      }
    },
    conversations: {
      async list() {
        const res = await client.get("/api/conversations");
        return res.data;
      },
      async ensureConversation(targetUserId) {
        const res = await client.post("/api/conversations", { targetUserId });
        return res.data;
      },
      async getDetail(conversationId) {
        const res = await client.get(`/api/conversations/${conversationId}`);
        return res.data;
      },
      // NEW: Group creation endpoint
      async createGroup(payload) {
        const res = await client.post("/api/conversations/group", payload);
        return res.data;
      }
    },
    messages: {
      async list(conversationId, page = 1) {
        const res = await client.get(`/api/messages/${conversationId}?page=${page}`);
        return res.data;
      },
      async send(conversationId, text, type = "text", fileData = null) {
        const payload = {
          conversationId,
          text,
          type,
          ...fileData
        };
        const res = await client.post("/api/messages", payload);
        return res.data;
      },
      async addReaction(messageId, reaction) {
        const res = await client.post(`/api/messages/${messageId}/reaction`, { reaction });
        return res.data;
      }
    },
    upload: {
      // NEW: File upload endpoint
      async file(file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await client.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        return res.data;
      }
    }
  };
}
