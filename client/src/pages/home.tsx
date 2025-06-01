import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import PostModal from "@/components/PostModal";
import TipsSection from "@/components/TipsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { PostWithAuthor } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"feed" | "tips" | "profile">("feed");
  const [showPostModal, setShowPostModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    resolved: undefined as boolean | undefined,
    search: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["/api/posts", filters],
    enabled: !!isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.resolved !== undefined) params.append("resolved", String(filters.resolved));
      if (filters.search) params.append("search", filters.search);
      
      const response = await fetch(`/api/posts?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json() as Promise<PostWithAuthor[]>;
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
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPostDoubt={() => setShowPostModal(true)}
        onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Sidebar 
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            <main className="lg:col-span-3">
              {/* Mobile Search */}
              <div className="md:hidden mb-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search doubts, tips..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="animate-pulse">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-300 rounded w-1/4 mb-2"></div>
                              <div className="h-6 bg-slate-300 rounded w-3/4 mb-3"></div>
                              <div className="h-4 bg-slate-300 rounded w-full mb-2"></div>
                              <div className="h-4 bg-slate-300 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 mb-4">No posts found. Be the first to post a doubt!</p>
                    <Button onClick={() => setShowPostModal(true)}>
                      Post Your First Doubt
                    </Button>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post}
                      onUpdate={refetchPosts}
                    />
                  ))
                )}
              </div>
            </main>
          </div>
        )}

        {activeTab === "tips" && (
          <TipsSection />
        )}

        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">My Profile</h2>
              <p className="text-slate-600">Profile section coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {showPostModal && (
        <PostModal 
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false);
            refetchPosts();
          }}
        />
      )}
    </div>
  );
}
