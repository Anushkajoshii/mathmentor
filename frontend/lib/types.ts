export type InputMode = "text" | "image" | "audio";

export interface AgentTrace {
  agent: string;
  status: "processing" | "complete" | "rejected" | "hitl_required" | "requested";
  message: string;
}

export interface ParsedProblem {
  problem_text: string;
  topic: string;
  variables: string[];
  constraints: string[];
  needs_clarification: boolean;
  clarification_reason?: string;
}

export interface Verification {
  verified: boolean;
  confidence: number;
  issues: string[];
  details: Record<string, number>;
}

export interface ContextItem {
  source: string;
  content: string;
}

export interface SolveResponse {
  success: boolean;
  problem_id?: string;
  parsed_problem?: ParsedProblem;
  solution?: string;
  explanation?: string;
  verification?: Verification;
  context?: ContextItem[];
  agent_trace: AgentTrace[];
  needs_hitl: boolean;
  hitl_reason?: string;
  ocr_preview?: string;
  transcript_preview?: string;
  confidence?: number;
  memory_used?: boolean;
  error?: string;
}

export interface FeedbackPayload {
  problem_id: string;
  is_correct: boolean;
  corrected_solution?: string;
  problem_text: string;
  original_solution: string;
}

export interface MemoryItem {
  problem_id: string;
  problem: string;
  solution: string;
  feedback: "correct" | "incorrect";
  was_corrected: boolean;
}
