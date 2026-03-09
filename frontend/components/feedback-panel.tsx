"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { submitFeedback } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FeedbackPanelProps {
  problemId: string;
  problemText: string;
  solution: string;
  needsHitl: boolean;
  hitlReason?: string;
}

export function FeedbackPanel({
  problemId,
  problemText,
  solution,
  needsHitl,
  hitlReason,
}: FeedbackPanelProps) {
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [correctedSolution, setCorrectedSolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        problem_id: problemId,
        is_correct: feedback === "correct",
        corrected_solution: feedback === "incorrect" ? correctedSolution : undefined,
        problem_text: problemText,
        original_solution: solution,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Thank you for your feedback!</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Your feedback has been stored and will help improve future solutions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* HITL Alert */}
      {needsHitl && (
        <div className="px-6 py-4 bg-warning/10 border-b border-warning/20">
          <div className="flex items-center gap-2 text-warning font-medium">
            <AlertTriangle className="w-4 h-4" />
            Human Review Required
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {hitlReason || "Please verify this solution before accepting."}
          </p>
        </div>
      )}

      <div className="p-6">
        <h3 className="font-semibold mb-4">Was this solution helpful?</h3>

        {/* Feedback buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setFeedback("correct")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all",
              feedback === "correct"
                ? "bg-success/10 border-success text-success"
                : "border-border hover:border-success/50 hover:bg-success/5"
            )}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">Correct</span>
          </button>

          <button
            onClick={() => setFeedback("incorrect")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all",
              feedback === "incorrect"
                ? "bg-destructive/10 border-destructive text-destructive"
                : "border-border hover:border-destructive/50 hover:bg-destructive/5"
            )}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-medium">Incorrect</span>
          </button>
        </div>

        {/* Correction input */}
        {feedback === "incorrect" && (
          <div className="space-y-3 mb-4">
            <label className="text-sm font-medium">
              Please provide the correct solution:
            </label>
            <textarea
              value={correctedSolution}
              onChange={(e) => setCorrectedSolution(e.target.value)}
              placeholder="Enter the correct solution here..."
              className="w-full h-32 p-3 bg-secondary/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
          </div>
        )}

        {/* Submit button */}
        {feedback && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (feedback === "incorrect" && !correctedSolution.trim())}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your feedback helps the AI learn and improve over time.
        </p>
      </div>
    </div>
  );
}
