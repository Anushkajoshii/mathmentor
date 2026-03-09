"use client";

import { 
  ChevronLeft, 
  BookOpen, 
  Calculator, 
  LineChart, 
  Sigma, 
  Binary,
  Brain,
  History
} from "lucide-react";
import useSWR from "swr";
import { getMemory } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const topics = [
  { name: "Algebra", icon: Sigma, color: "text-blue-400" },
  { name: "Calculus", icon: LineChart, color: "text-green-400" },
  { name: "Probability", icon: Binary, color: "text-purple-400" },
  { name: "Linear Algebra", icon: Calculator, color: "text-orange-400" },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { data: memoryData } = useSWR("memory", getMemory, {
    refreshInterval: 10000,
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Math Mentor</span>
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Topics */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Supported Topics
            </h3>
            <div className="space-y-1">
              {topics.map((topic) => (
                <div
                  key={topic.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <topic.icon className={cn("w-4 h-4", topic.color)} />
                  <span className="text-sm">{topic.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mx-4" />

          {/* Recent Problems from Memory */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-3 h-3" />
              Recent Solutions
            </h3>
            
            {memoryData?.memory && memoryData.memory.length > 0 ? (
              <div className="space-y-2">
                {memoryData.memory.slice(-5).reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-secondary/50 rounded-lg"
                  >
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {item.problem}
                    </p>
                    <div className={cn(
                      "text-xs font-medium",
                      item.feedback === "correct" ? "text-success" : "text-destructive"
                    )}>
                      {item.feedback === "correct" ? "Verified" : "Corrected"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No solutions in memory yet. Solve some problems to build your learning history.
              </p>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Memory items</span>
              <span className="font-medium">{memoryData?.total_size || 0}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
