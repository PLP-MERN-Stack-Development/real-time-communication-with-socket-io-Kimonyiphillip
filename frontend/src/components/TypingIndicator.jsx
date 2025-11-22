import { Avatar } from "./ui/avatar";
import { cn } from "../lib/utils";

export default function TypingIndicator({ 
  typingUsers, 
  conversation, 
  currentUserId 
}) {
  if (!typingUsers || typingUsers.size === 0) return null;

  // Get typing user details
  const typingUserIds = Array.from(typingUsers).filter(id => id !== currentUserId);
  if (typingUserIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 opacity-75">
      <div className="flex -space-x-2">
        {typingUserIds.slice(0, 3).map((userId) => {
          const user = conversation.members?.find(m => m.clerkUserId === userId);
          return (
            <Avatar
              key={userId}
              size="sm"
              src={user?.avatarUrl}
              alt={user?.displayName}
              fallback={user?.displayName}
              className="border-2 border-slate-800"
            />
          );
        })}
      </div>
      
      <div className="flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-2">
        <div className="flex space-x-1">
          <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-slate-300 ml-2">
          {typingUserIds.length === 1 
            ? `${conversation.members?.find(m => m.clerkUserId === typingUserIds[0])?.displayName || 'Someone'} is typing...`
            : `${typingUserIds.length} people are typing...`
          }
        </span>
      </div>
    </div>
  );
}