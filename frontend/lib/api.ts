import type { SolveResponse, FeedbackPayload, MemoryItem } from "./types";

const API_BASE = "/api";

export async function solveProblem(data: {
  text?: string;
  image_base64?: string;
  audio_base64?: string;
  input_type: "text" | "image" | "audio";
}): Promise<SolveResponse> {
  console.log("[v0] API: Calling /api/solve");
  const response = await fetch(`${API_BASE}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  console.log("[v0] API: Response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[v0] API: Error response:", errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function submitFeedback(feedback: FeedbackPayload): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getMemory(): Promise<{ memory: MemoryItem[]; total_size: number }> {
  const response = await fetch(`${API_BASE}/memory`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getSimilarProblems(problemText: string): Promise<{ similar_problems: MemoryItem[] }> {
  const response = await fetch(`${API_BASE}/similar/${encodeURIComponent(problemText)}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; llm_available: boolean; memory_size: number }> {
  console.log("[v0] API: Checking health at /api/health");
  const response = await fetch(`${API_BASE}/health`);
  
  console.log("[v0] API: Health response status:", response.status);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[v0] API: Health data:", data);
  return data;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}
