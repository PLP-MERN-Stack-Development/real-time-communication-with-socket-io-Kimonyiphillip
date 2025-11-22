import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export default function FileUpload({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/", "application/", "text/"];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      alert("Please select an image, document, or text file");
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border-2 border-dashed p-3 transition-colors",
          isDragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isUploading}
            className="text-xs"
          >
            {isUploading ? "Uploading..." : "📎 Attach File"}
          </Button>
          <span className="text-xs text-slate-400">
            or drag and drop
          </span>
        </div>
        
        <div className="flex gap-1 text-xs text-slate-400">
          <span>Images,</span>
          <span>PDF,</span>
          <span>Text</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    </div>
  );
}