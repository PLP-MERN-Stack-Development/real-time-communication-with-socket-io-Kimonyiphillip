import { useState } from "react";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "numeric"
});

const statusLabelMap = {
  sent: "Sent",
  delivered: "Delivered", 
  seen: "Seen"
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function MessageBubble({
  message,
  isMine,
  currentUser,
  otherMember,
  onReaction
}) {
  const [showReactions, setShowReactions] = useState(false);
  const timestamp = message?.createdAt ? new Date(message.createdAt) : null;
  const statusLabel = statusLabelMap[message.status] || "Sent";

  // Handle reaction click
  const handleReactionClick = (reaction) => {
    onReaction?.(message._id, reaction);
    setShowReactions(false);
  };

  // Get unique reactions with counts
  const reactionSummary = message.reactions?.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div
      className={cn(
        "group relative flex items-end gap-3",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      {!isMine && (
        <Avatar
          size="sm"
          src={message.senderAvatar || otherMember?.avatarUrl}
          alt={message.senderName}
          fallback={message.senderName}
        />
      )}

      <div
        className={cn(
          "flex max-w-xl flex-col gap-1",
          isMine ? "items-end text-right" : "items-start text-left"
        )}
      >
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {isMine ? currentUser?.name : message.senderName}
        </p>
        
        {/* File message */}
        {(message.type === "image" || message.type === "file") && (
          <div className="mb-2">
            {message.type === "image" ? (
              <img 
                src={message.fileUrl} 
                alt={message.fileName}
                className="max-w-xs rounded-lg border border-white/10"
              />
            ) : (
              <a 
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                <span className="text-lg">📎</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{message.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={cn(
              "rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-lg",
              isMine
                ? "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-indigo-900/40"
                : "border border-white/10 bg-white text-slate-900"
            )}
          >
            {message.text && (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionSummary).length > 0 && (
            <div className={cn(
              "mt-2 flex flex-wrap gap-1",
              isMine ? "justify-end" : "justify-start"
            )}>
              {Object.entries(reactionSummary).map(([reaction, count]) => (
                <button
                  key={reaction}
                  className="rounded-full bg-black/20 px-2 py-1 text-xs backdrop-blur-sm"
                  onClick={() => handleReactionClick(reaction)}
                >
                  {reaction} {count > 1 ? count : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400/90">
          {timestamp && <span>{timeFormatter.format(timestamp)}</span>}
          {isMine && (
            <span
              className={cn(
                "font-semibold",
                message.status === "seen" ? "text-emerald-300" : "text-indigo-200"
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {isMine && (
        <Avatar
          size="sm"
          src={currentUser?.avatar}
          alt={currentUser?.name}
          fallback={currentUser?.name}
        />
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div className={cn(
          "absolute bottom-full mb-2 flex gap-1 rounded-full bg-slate-800/90 p-1 backdrop-blur-sm",
          isMine ? "right-0" : "left-0"
        )}>
          {REACTIONS.map((reaction) => (
            <Button
              key={reaction}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-110 hover:bg-white/20"
              onClick={() => handleReactionClick(reaction)}
            >
              {reaction}
            </Button>
          ))}
        </div>
      )}

      {/* Reaction button (hover) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute opacity-0 transition-opacity group-hover:opacity-100",
          isMine 
            ? "-left-10 top-1/2 -translate-y-1/2" 
            : "-right-10 top-1/2 -translate-y-1/2"
        )}
        onClick={() => setShowReactions(!showReactions)}
      >
        🙂
      </Button>
    </div>
  );
}
