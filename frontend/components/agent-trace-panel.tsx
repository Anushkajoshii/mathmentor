"use client";

import { 
  Shield, 
  FileText, 
  GitBranch, 
  Database, 
  Calculator, 
  CheckSquare, 
  GraduationCap,
  Eye,
  Mic,
  User,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import type { AgentTrace } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentTracePanelProps {
  traces: AgentTrace[];
}

const agentIcons: Record<string, typeof Shield> = {
  OCR: Eye,
  ASR: Mic,
  Guardrail: Shield,
  Parser: FileText,
  Router: GitBranch,
  RAG: Database,
  Solver: Calculator,
  Verifier: CheckSquare,
  Explainer: GraduationCap,
  HITL: User,
};

const statusColors = {
  processing: "text-primary",
  complete: "text-success",
  rejected: "text-destructive",
  hitl_required: "text-warning",
  requested: "text-warning",
};

const statusIcons = {
  processing: null,
  complete: Check,
  rejected: X,
  hitl_required: AlertTriangle,
  requested: AlertTriangle,
};

export function AgentTracePanel({ traces }: AgentTracePanelProps) {
  if (!traces || traces.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="font-semibold text-sm">Agent Pipeline</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {traces.length} agents executed
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />

          {/* Agent traces */}
          <div className="space-y-4">
            {traces.map((trace, index) => {
              const Icon = agentIcons[trace.agent] || Shield;
              const StatusIcon = statusIcons[trace.status];
              const isLast = index === traces.length - 1;

              return (
                <div
                  key={index}
                  className={cn(
                    "relative flex items-start gap-3 pl-0",
                    trace.status === "processing" && "agent-processing"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    trace.status === "complete" ? "bg-success/10" :
                    trace.status === "rejected" ? "bg-destructive/10" :
                    trace.status === "hitl_required" || trace.status === "requested" ? "bg-warning/10" :
                    "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      statusColors[trace.status]
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{trace.agent}</span>
                      {StatusIcon && (
                        <StatusIcon className={cn(
                          "w-3 h-3",
                          statusColors[trace.status]
                        )} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {trace.message}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className={cn(
                    "text-xs px-2 py-0.5 rounded-full shrink-0",
                    trace.status === "complete" ? "bg-success/10 text-success" :
                    trace.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    trace.status === "hitl_required" || trace.status === "requested" ? "bg-warning/10 text-warning" :
                    "bg-primary/10 text-primary"
                  )}>
                    {trace.status === "complete" ? "Done" :
                     trace.status === "rejected" ? "Failed" :
                     trace.status === "hitl_required" || trace.status === "requested" ? "HITL" :
                     "Running"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t border-border bg-secondary/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {traces.filter(t => t.status === "complete").length} completed
          </span>
          {traces.some(t => t.status === "hitl_required" || t.status === "requested") && (
            <span className="text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Human review requested
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
