import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar } from "./ui/avatar";
import { cn } from "../lib/utils";

export default function CreateGroupDialog({ 
  directory, 
  currentUserId, 
  onCreateGroup,
  children 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) return;
    
    try {
      await onCreateGroup({
        name: groupName.trim(),
        memberIds: Array.from(selectedMembers)
      });
      
      // Reset form
      setGroupName("");
      setSelectedMembers(new Set());
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const availableMembers = directory.filter(user => user.clerkUserId !== currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>
            Create a group conversation with multiple team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <div>
            <p className="text-sm font-medium text-white mb-2">
              Select Members ({selectedMembers.size} selected)
            </p>
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-2">
                {availableMembers.map((person) => (
                  <button
                    key={person.clerkUserId}
                    onClick={() => handleMemberToggle(person.clerkUserId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                      selectedMembers.has(person.clerkUserId)
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/5 bg-white/[0.04] hover:border-white/20"
                    )}
                  >
                    <Avatar
                      src={person.avatarUrl}
                      alt={person.displayName}
                      fallback={person.displayName}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{person.displayName}</p>
                      {person.email && (
                        <p className="text-[11px] text-slate-400">{person.email}</p>
                      )}
                    </div>
                    {selectedMembers.has(person.clerkUserId) && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300">
                        Selected
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.size === 0}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}