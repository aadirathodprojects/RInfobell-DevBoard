import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Pin, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "./MarkdownEditor";
import type { TipWithAuthor } from "@shared/schema";

export default function TipsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipContent, setTipContent] = useState("");

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["/api/tips"],
    queryFn: async () => {
      const response = await fetch("/api/tips", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<TipWithAuthor[]>;
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
        description: "Failed to fetch tips",
        variant: "destructive",
      });
    },
  });

  const createTipMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/tips", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
      setShowTipModal(false);
      setTipContent("");
      toast({
        title: "Success",
        description: "Tip shared successfully",
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
        description: "Failed to share tip",
        variant: "destructive",
      });
    },
  });

  const likeTipMutation = useMutation({
    mutationFn: async (tipId: string) => {
      await apiRequest("POST", `/api/tips/${tipId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
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
        description: "Failed to like tip",
        variant: "destructive",
      });
    },
  });

  const handleCreateTip = () => {
    if (!tipContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter tip content",
        variant: "destructive",
      });
      return;
    }
    createTipMutation.mutate(tipContent);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Community Tips</h2>
            <Button
              onClick={() => setShowTipModal(true)}
              className="bg-accent hover:bg-emerald-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Share Tip
            </Button>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-300 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No tips shared yet. Be the first to share a tip!</p>
                <Button onClick={() => setShowTipModal(true)}>
                  Share Your First Tip
                </Button>
              </div>
            ) : (
              tips.map((tip) => (
                <div key={tip.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={tip.author?.profileImageUrl || ""} className="object-cover" />
                        <AvatarFallback>
                          {tip.author?.firstName?.[0]}{tip.author?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="prose max-w-none text-slate-800 mb-2">
                          <div className="whitespace-pre-wrap">
                            {tip.content}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>
                            Shared by {tip.author?.firstName} {tip.author?.lastName}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(tip.createdAt))} ago
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => likeTipMutation.mutate(tip.id)}
                            className="text-accent hover:text-emerald-600 p-0 h-auto"
                          >
                            <ThumbsUp className="mr-1 h-3 w-3" />
                            {tip.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {tip.pinned && (
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Pin className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Tip Modal */}
      {showTipModal && (
        <Dialog open={true} onOpenChange={() => setShowTipModal(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Share a Tip</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tip-content">Tip Content *</Label>
                <MarkdownEditor
                  value={tipContent}
                  onChange={setTipContent}
                  placeholder="Share a useful development tip, tool, or trick... (Markdown supported)"
                  minHeight="150px"
                />
                <p className="text-xs text-slate-500 mt-1">Supports Markdown formatting</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTipModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTip}
                  disabled={createTipMutation.isPending || !tipContent.trim()}
                  className="bg-accent hover:bg-emerald-600"
                >
                  {createTipMutation.isPending ? "Sharing..." : "Share Tip"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
