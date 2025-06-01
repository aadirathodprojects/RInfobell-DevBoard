import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Bookmark, CheckCircle, CircleAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthor;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleResolveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/posts/${post.id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (onUpdate) onUpdate();
      toast({
        title: "Success",
        description: "Post resolution status updated",
      });
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
        description: "Failed to update post resolution",
        variant: "destructive",
      });
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "backend": return "bg-blue-100 text-blue-800";
      case "frontend": return "bg-green-100 text-green-800";
      case "devops": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (resolved: boolean) => {
    return resolved 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.profileImageUrl || ""} className="object-cover" />
            <AvatarFallback>
              {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getCategoryColor(post.category)}>
                {post.category}
              </Badge>
              <Badge className={getStatusColor(post.resolved)}>
                {post.resolved ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Resolved
                  </>
                ) : (
                  <>
                    <CircleAlert className="mr-1 h-3 w-3" />
                    Unresolved
                  </>
                )}
              </Badge>
            </div>
            
            <Link href={`/post/${post.id}`}>
              <h3 className="text-lg font-semibold text-slate-800 mb-2 hover:text-primary cursor-pointer">
                {post.title}
              </h3>
            </Link>
            
            <p className="text-slate-600 mb-3 line-clamp-2">
              {post.description.substring(0, 200)}
              {post.description.length > 200 && "..."}
            </p>
            
            {post.imageUrl && (
              <div className="mb-3">
                <img 
                  src={post.imageUrl} 
                  alt="Post image"
                  className="max-w-full h-32 object-cover rounded-md border border-slate-200"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center space-x-4">
                <span>
                  {post.author?.firstName} {post.author?.lastName}
                </span>
                <span>
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </span>
                <span className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {post.commentCount}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {user?.id === post.createdBy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleResolveMutation.mutate()}
                    disabled={toggleResolveMutation.isPending}
                    className={post.resolved ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                  >
                    {post.resolved ? "Unresolve" : "Resolve"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
