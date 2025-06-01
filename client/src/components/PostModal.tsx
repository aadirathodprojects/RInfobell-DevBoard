import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import FileUpload from "./FileUpload";

interface PostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostModal({ onClose, onSuccess }: PostModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    
    if (selectedFile) {
      data.append("image", selectedFile);
    }

    createPostMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Post a New Doubt
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Describe your issue briefly..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <MarkdownEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe your issue in detail. You can use markdown formatting..."
              minHeight="200px"
            />
            <p className="text-xs text-slate-500 mt-1">Supports Markdown formatting</p>
          </div>
          
          <div>
            <Label>Screenshot (Optional)</Label>
            <FileUpload
              onFileSelect={setSelectedFile}
              accept="image/*"
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPostMutation.isPending || !formData.title.trim() || !formData.description.trim() || !formData.category}
              className="bg-primary hover:bg-blue-700"
            >
              {createPostMutation.isPending ? "Posting..." : "Post Doubt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
