import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code, Search, Plus } from "lucide-react";

interface AppHeaderProps {
  activeTab: "feed" | "tips" | "profile";
  onTabChange: (tab: "feed" | "tips" | "profile") => void;
  onPostDoubt: () => void;
  onSearch: (search: string) => void;
}

export default function AppHeader({ activeTab, onTabChange, onPostDoubt, onSearch }: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Code className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-slate-800">Infobell DevBoard</h1>
            </div>
            
            <nav className="hidden md:flex space-x-6 ml-8">
              <button
                onClick={() => onTabChange("feed")}
                className={`pb-4 pt-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === "feed"
                    ? "text-primary border-primary"
                    : "text-slate-500 hover:text-slate-700 border-transparent"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => onTabChange("tips")}
                className={`pb-4 pt-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === "tips"
                    ? "text-primary border-primary"
                    : "text-slate-500 hover:text-slate-700 border-transparent"
                }`}
              >
                Tips
              </button>
              <button
                onClick={() => onTabChange("profile")}
                className={`pb-4 pt-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === "profile"
                    ? "text-primary border-primary"
                    : "text-slate-500 hover:text-slate-700 border-transparent"
                }`}
              >
                My Profile
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Search doubts, tips..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>
            
            {/* Post Doubt Button */}
            <Button onClick={onPostDoubt} className="bg-primary hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Post Doubt</span>
            </Button>
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profileImageUrl || ""} className="object-cover" />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTabChange("profile")}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
