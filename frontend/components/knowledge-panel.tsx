"use client";

import { Database, FileText, Brain } from "lucide-react";
import type { ContextItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KnowledgePanelProps {
  context: ContextItem[];
}

const sourceIcons: Record<string, typeof Database> = {
  memory: Brain,
  default: FileText,
};

const sourceColors: Record<string, string> = {
  memory: "text-purple-400 bg-purple-400/10",
  algebra_formulas: "text-blue-400 bg-blue-400/10",
  calculus_formulas: "text-green-400 bg-green-400/10",
  probability_formulas: "text-orange-400 bg-orange-400/10",
  linear_algebra_formulas: "text-pink-400 bg-pink-400/10",
  default: "text-muted-foreground bg-secondary",
};

export function KnowledgePanel({ context }: KnowledgePanelProps) {
  if (!context || context.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Database className="w-4 h-4" />
          <span className="text-sm">No knowledge retrieved</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Retrieved Knowledge</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {context.length} source{context.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="p-4 space-y-3">
        {context.map((item, index) => {
          const Icon = sourceIcons[item.source] || sourceIcons.default;
          const colorClass = sourceColors[item.source] || sourceColors.default;

          return (
            <div
              key={index}
              className="p-3 bg-secondary/30 rounded-lg border border-border/50"
            >
              {/* Source badge */}
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "p-1 rounded",
                  colorClass.split(" ")[1]
                )}>
                  <Icon className={cn(
                    "w-3 h-3",
                    colorClass.split(" ")[0]
                  )} />
                </div>
                <span className="text-xs font-medium capitalize">
                  {item.source.replace(/_/g, " ")}
                </span>
              </div>

              {/* Content preview */}
              <p className="text-xs text-muted-foreground line-clamp-4 font-mono whitespace-pre-wrap">
                {item.content.substring(0, 300)}
                {item.content.length > 300 && "..."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
