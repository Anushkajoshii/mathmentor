"use client";

import { CheckCircle, AlertTriangle, XCircle, Lightbulb, BookOpen } from "lucide-react";
import type { SolveResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SolutionPanelProps {
  result: SolveResponse;
}

export function SolutionPanel({ result }: SolutionPanelProps) {
  if (!result.success) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Unable to Solve</h3>
            <p className="text-muted-foreground">
              {result.error || result.hitl_reason || "An error occurred while processing your request."}
            </p>
            {result.needs_hitl && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-warning font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Human Review Required
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.hitl_reason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const confidence = result.verification?.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="space-y-6">
      {/* Main Solution Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header with confidence */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              confidence >= 0.8 ? "bg-success/10" : confidence >= 0.6 ? "bg-warning/10" : "bg-destructive/10"
            )}>
              {confidence >= 0.8 ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : confidence >= 0.6 ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Solution</h3>
              <p className="text-xs text-muted-foreground">
                Topic: {result.parsed_problem?.topic || "General"}
              </p>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{confidencePercent}%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={confidence >= 0.8 ? "var(--color-success)" : confidence >= 0.6 ? "var(--color-warning)" : "var(--color-destructive)"}
                  strokeWidth="4"
                  strokeDasharray={`${confidence * 176} 176`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Solution Content */}
        <div className="p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-4 rounded-lg overflow-x-auto">
              {result.solution}
            </pre>
          </div>

          {/* Memory indicator */}
          {result.memory_used && (
            <div className="mt-4 flex items-center gap-2 text-sm text-primary">
              <Lightbulb className="w-4 h-4" />
              Solution enhanced with similar problems from memory
            </div>
          )}
        </div>

        {/* HITL Warning */}
        {result.needs_hitl && (
          <div className="px-6 pb-6">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 text-warning font-medium">
                <AlertTriangle className="w-4 h-4" />
                Human Review Recommended
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {result.hitl_reason || "Please verify this solution before accepting."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Explanation Card */}
      {result.explanation && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Step-by-Step Explanation</h3>
          </div>
          <div className="p-6">
            <div className="prose prose-invert prose-sm max-w-none math-content">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {result.explanation}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Problem Info */}
      {result.parsed_problem && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Problem Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Topic:</span>
              <p className="font-medium capitalize">{result.parsed_problem.topic}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Variables:</span>
              <p className="font-medium font-mono">
                {result.parsed_problem.variables.length > 0
                  ? result.parsed_problem.variables.join(", ")
                  : "None"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Constraints:</span>
              <p className="font-medium">
                {result.parsed_problem.constraints.length > 0
                  ? result.parsed_problem.constraints.join(", ")
                  : "None"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Verified:</span>
              <p className={cn(
                "font-medium",
                result.verification?.verified ? "text-success" : "text-warning"
              )}>
                {result.verification?.verified ? "Yes" : "Needs Review"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
