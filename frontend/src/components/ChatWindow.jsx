import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import { Badge } from "./ui/badge";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { useSocket } from "../hooks/useSocket";
import FileUpload from "./FileUpload";
import TypingIndicator from "./TypingIndicator";

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function ChatWindow({
  messagesApi,
  conversation,
  conversationId,
  currentUser,
  onConversationSeen,
  onMessageSent,
  isBootstrapping,
  currentUserId
}) {
  const service = useMemo(() => {
    if (messagesApi) return messagesApi;
    return {
      async list() {
        return { messages: [], pagination: {} };
      },
      async send() {
        throw new Error("messagesApi not provided");
      }
    };
  }, [messagesApi]);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const viewportRef = useRef(null);
  const conversationIdRef = useRef(conversationId);
  const typingTimeoutRef = useRef(null);

  const {
    socket,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping,
    sendReaction
  } = useSocket(currentUserId);

  // Determine the other participant
  const otherMember = useMemo(() => {
    if (!conversation || !currentUser?.id) return null;
    if (conversation.isGroup) return null;
    return (
      conversation.members?.find(
        (member) => member.clerkUserId !== currentUser.id
      ) || null
    );
  }, [conversation, currentUser]);

  // Check if other user is online
  const isOtherUserOnline = useMemo(() => {
    if (!otherMember) return false;
    return onlineUsers.has(otherMember.clerkUserId);
  }, [otherMember, onlineUsers]);

  // Get typing users for current conversation
  const currentTypingUsers = useMemo(() => {
    if (!conversationId) return new Set();
    return typingUsers.get(conversationId) || new Set();
  }, [typingUsers, conversationId]);

  // Reset state when changing conversations
  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError(null);
    setPage(1);
    setHasMore(true);
  }, [conversationId]);

  // Load conversation history
  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    setIsLoading(true);
    (async () => {
      try {
        const data = await service.list(conversationId, 1);
        if (!active) return;
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setHasMore(data.pagination?.hasMore || false);
        onConversationSeen?.(conversationId);
      } catch (err) {
        if (active) {
          setError("We couldn't fetch the conversation history. Please retry.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [service, conversationId, onConversationSeen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, currentTypingUsers]);

  // Join conversation room via socket.io
  useEffect(() => {
    conversationIdRef.current = conversationId;
    if (!socket || !conversationId) return;

    socket.emit("conversation:join", conversationId);

    // Handle incoming messages in real-time
    const handleNewMessage = ({ conversationId: id, message }) => {
      if (id === conversationIdRef.current) {
        setMessages((prev) => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        // Play notification sound
        playNotificationSound();
      }
    };

    // Handle conversation updates
    const handleConversationUpdate = ({ conversationId: id, unreadCount }) => {
      if (id === conversationIdRef.current) {
        onConversationSeen?.(id);
      }
    };

    // Handle message reactions
    const handleMessageReaction = ({ messageId, userId, reaction }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []).filter(r => r.userId !== userId),
                { userId, reaction, createdAt: new Date() }
              ]
            }
          : msg
      ));
    };

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:update", handleConversationUpdate);
    socket.on("message:react", handleMessageReaction);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:update", handleConversationUpdate);
      socket.off("message:react", handleMessageReaction);
      socket.emit("conversation:leave", conversationIdRef.current);
    };
  }, [socket, conversationId, onConversationSeen]);

  // Typing indicator handlers
  const handleTypingStart = useCallback(() => {
    if (!conversationId) return;
    startTyping(conversationId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [conversationId, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (!conversationId) return;
    stopTyping(conversationId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [conversationId, stopTyping]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;
    
    try {
      const nextPage = page + 1;
      const data = await service.list(conversationId, nextPage);
      
      setMessages(prev => [...data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      setError("Failed to load more messages");
    }
  };

  // Send message handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !conversationId) return;

    setIsSending(true);
    setError(null);
    handleTypingStop();

    try {
      const nextMessage = await service.send(conversationId, draft.trim());
      
      setMessages((prev) => {
        const exists = prev.some(m => m._id === nextMessage._id);
        if (exists) return prev;
        return [...prev, nextMessage];
      });
      
      onMessageSent?.(conversationId, nextMessage);

      // Emit real-time event
      socket?.emit("message:new", {
        conversationId,
        message: nextMessage,
      });

      setDraft("");
    } catch (err) {
      setError("Your message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (file) => {
    if (!conversationId) return;
    
    try {
      // Upload file first
      const uploadResult = await messagesApi.upload.file(file);
      
      // Send message with file
      const message = await service.send(
        conversationId, 
        "", 
        file.type.startsWith("image/") ? "image" : "file",
        {
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize
        }
      );
      
      setMessages(prev => [...prev, message]);
      onMessageSent?.(conversationId, message);
      
      // Emit real-time event
      socket?.emit("message:new", {
        conversationId,
        message,
      });
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    }
  };

  // Handle message reaction
  const handleMessageReaction = async (messageId, reaction) => {
    try {
      await messagesApi.addReaction(messageId, reaction);
      sendReaction(messageId, conversationId, reaction);
    } catch (err) {
      setError("Failed to add reaction");
    }
  };

  // Notification sound
  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {
      // Silent fail if audio can't play
    });
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (isBootstrapping) {
    return (
      <section className="flex flex-1 flex-col justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
        Preparing your conversations…
      </section>
    );
  }

  if (!conversationId || !conversation) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-slate-400">
        <p className="max-w-xs">
          Choose a conversation from the sidebar or start a new one to begin
          chatting.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={
              conversation.isGroup
                ? conversation.avatar
                : otherMember?.avatarUrl
            }
            alt={conversation.name}
            fallback={conversation.name}
          />
          <div>
            <p className="text-sm font-semibold text-white">
              {conversation.name}
            </p>
            <p className="text-xs text-slate-400">
              {conversation.isGlobal ? "Public Global Chat" : 
               conversation.isGroup ? 
                 `${conversation.members?.length || 0} participants` :
                 isOtherUserOnline ? "Online" : "Offline"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.isGlobal && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-200">
              Global
            </Badge>
          )}
          <Badge
            variant="outline"
            className="rounded-full border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
          >
            Live Socket Chat
          </Badge>
        </div>
      </header>

      <div
        ref={viewportRef}
        className="custom-scroll flex-1 space-y-4 overflow-y-auto bg-chat-gradient px-6 py-6"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMoreMessages}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}

        {isLoading && messages.length === 0 && (
          <div className="text-sm text-slate-300">Loading messages…</div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-slate-400">
            No messages yet — start the conversation.
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message._id ? `${message._id}-${index}` : `msg-${message.senderId}-${message.createdAt}-${index}`}
            message={message}
            isMine={message.senderId === currentUser.id}
            currentUser={currentUser}
            otherMember={otherMember}
            onReaction={handleMessageReaction}
          />
        ))}

        {/* Typing indicator */}
        <TypingIndicator 
          typingUsers={currentTypingUsers}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      </div>

      <footer className="border-t border-white/10 bg-white/[0.04] px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <FileUpload onFileUpload={handleFileUpload} />
            <Input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (event.target.value.trim()) {
                  handleTypingStart();
                } else {
                  handleTypingStop();
                }
              }}
              onBlur={handleTypingStop}
              placeholder="Write a message..."
              disabled={isSending}
            />
          </div>
          <Button
            type="submit"
            disabled={!draft.trim() || isSending}
            className={cn(isSending && "opacity-75")}
          >
            {isSending ? "Sending…" : "Send"}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-red-300">{error}</p>
        )}
      </footer>
    </section>
  );
}
