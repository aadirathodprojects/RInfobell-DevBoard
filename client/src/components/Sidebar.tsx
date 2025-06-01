import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SidebarProps {
  filters: {
    category: string;
    resolved: boolean | undefined;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function Sidebar({ filters, onFiltersChange }: SidebarProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<{
        openDoubts: number;
        resolvedToday: number;
        tipsShared: number;
      }>;
    },
  });

  return (
    <aside className="lg:col-span-1">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Filters</h3>
          
          {/* Category Filter */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </Label>
            <Select
              value={filters.category}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, category: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Filter */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </Label>
            <RadioGroup
              value={
                filters.resolved === undefined
                  ? "all"
                  : filters.resolved
                  ? "resolved"
                  : "unresolved"
              }
              onValueChange={(value) => {
                let resolved: boolean | undefined;
                if (value === "resolved") resolved = true;
                else if (value === "unresolved") resolved = false;
                else resolved = undefined;
                onFiltersChange({ ...filters, resolved });
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-sm text-slate-600">
                  All
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unresolved" id="unresolved" />
                <Label htmlFor="unresolved" className="text-sm text-slate-600">
                  Unresolved
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="resolved" />
                <Label htmlFor="resolved" className="text-sm text-slate-600">
                  Resolved
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Quick Stats */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-700 mb-3">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Open Doubts</span>
                <span className="font-medium text-slate-800">
                  {stats?.openDoubts ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Resolved Today</span>
                <span className="font-medium text-accent">
                  {stats?.resolvedToday ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tips Shared</span>
                <span className="font-medium text-slate-800">
                  {stats?.tipsShared ?? 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
