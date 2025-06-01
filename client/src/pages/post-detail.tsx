import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor, CommentWithAuthor } from "@shared/schema";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function PostDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["/api/posts", id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<PostWithAuthor>;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/posts", id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}/comments`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<CommentWithAuthor[]>;
    },
  });

  const resolvePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/posts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
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

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/posts/${id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id, "comments"] });
      setCommentContent("");
      toast({
        title: "Success",
        description: "Comment added successfully",
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
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const voteCommentMutation = useMutation({
    mutationFn: async ({ commentId, voteType }: { commentId: string; voteType: string }) => {
      await apiRequest("POST", `/api/comments/${commentId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id, "comments"] });
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
        description: "Failed to vote on comment",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent);
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Post Not Found</h1>
            <p className="text-slate-600 mb-4">The post you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
            <h1 className="text-lg font-semibold text-slate-800">Post Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Post Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author?.profileImageUrl || ""} />
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
                      "Unresolved"
                    )}
                  </Badge>
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-4">
                  {post.title}
                </h1>
                
                <div className="prose max-w-none mb-4">
                  <div className="whitespace-pre-wrap text-slate-700">
                    {post.description}
                  </div>
                </div>
                
                {post.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={post.imageUrl} 
                      alt="Post image"
                      className="max-w-full h-auto rounded-lg border border-slate-200"
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
                  
                  {user?.id === post.createdBy && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolvePostMutation.mutate()}
                      disabled={resolvePostMutation.isPending}
                      className={post.resolved ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {post.resolved ? "Mark as Unresolved" : "Mark as Resolved"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Comments ({comments.length})
            </h2>
            
            {/* Add Comment */}
            <div className="mb-6">
              <MarkdownEditor
                value={commentContent}
                onChange={setCommentContent}
                placeholder="Add your comment... (Markdown supported)"
                minHeight="100px"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleAddComment}
                  disabled={!commentContent.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
            
            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-300 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-slate-300 rounded w-full mb-1"></div>
                          <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-slate-600 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author?.profileImageUrl || ""} />
                        <AvatarFallback>
                          {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                        </div>
                        
                        <div className="prose max-w-none text-sm">
                          <div className="whitespace-pre-wrap text-slate-700">
                            {comment.content}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteCommentMutation.mutate({ 
                              commentId: comment.id, 
                              voteType: "up" 
                            })}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            {comment.voteCount}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteCommentMutation.mutate({ 
                              commentId: comment.id, 
                              voteType: "helpful" 
                            })}
                            className="text-slate-500 hover:text-green-600"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Helpful
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
