import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, X, Image } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export default function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  maxSize = 10 * 1024 * 1024 // 10MB 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-slate-300 hover:border-primary"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-slate-600 mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-slate-500">
            {accept.includes("image") ? "PNG, JPG" : "Files"} up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-slate-300 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {selectedFile.type.startsWith("image/") ? (
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Image className="h-6 w-6 text-slate-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">FILE</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
