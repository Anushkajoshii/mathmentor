"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { InputPanel } from "@/components/input-panel";
import { SolutionPanel } from "@/components/solution-panel";
import { AgentTracePanel } from "@/components/agent-trace-panel";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { FeedbackPanel } from "@/components/feedback-panel";
import { Sidebar } from "@/components/sidebar";
import type { InputMode, SolveResponse } from "@/lib/types";
import { solveProblem, fileToBase64 } from "@/lib/api";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSolve = async (data: {
    text?: string;
    imageFile?: File;
    audioBlob?: Blob;
  }) => {
    console.log("[v0] handleSolve called with:", { inputMode, hasText: !!data.text, hasImage: !!data.imageFile, hasAudio: !!data.audioBlob });
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let payload: {
        text?: string;
        image_base64?: string;
        audio_base64?: string;
        input_type: InputMode;
      } = { input_type: inputMode };

      if (inputMode === "text" && data.text) {
        payload.text = data.text;
        setCurrentProblem(data.text);
      } else if (inputMode === "image" && data.imageFile) {
        payload.image_base64 = await fileToBase64(data.imageFile);
        setCurrentProblem("[Image Input]");
      } else if (inputMode === "audio" && data.audioBlob) {
        const audioFile = new File([data.audioBlob], "audio.wav", { type: "audio/wav" });
        payload.audio_base64 = await fileToBase64(audioFile);
        setCurrentProblem("[Audio Input]");
      }

      console.log("[v0] Calling API with payload:", { ...payload, image_base64: payload.image_base64 ? "[base64 data]" : undefined, audio_base64: payload.audio_base64 ? "[base64 data]" : undefined });
      const response = await solveProblem(payload);
      console.log("[v0] API response:", response);
      setResult(response);
      
      if (response.parsed_problem?.problem_text) {
        setCurrentProblem(response.parsed_problem.problem_text);
      }
    } catch (err) {
      console.error("[v0] API error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setCurrentProblem("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              <span className="gradient-text">AI Math Mentor</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              Solve JEE-style math problems with AI agents, RAG knowledge base, 
              and step-by-step explanations. Upload images, record audio, or type your question.
            </p>
          </div>

          {/* Input Section */}
          <div className="mb-8">
            <InputPanel
              mode={inputMode}
              onModeChange={setInputMode}
              onSolve={handleSolve}
              isLoading={isLoading}
              ocrPreview={result?.ocr_preview}
              transcriptPreview={result?.transcript_preview}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Solution Column */}
              <div className="lg:col-span-2 space-y-6">
                <SolutionPanel result={result} />
                
                {result.success && result.solution && (
                  <FeedbackPanel
                    problemId={result.problem_id || ""}
                    problemText={currentProblem}
                    solution={result.solution}
                    needsHitl={result.needs_hitl}
                    hitlReason={result.hitl_reason}
                  />
                )}
              </div>

              {/* Side Panels */}
              <div className="space-y-6">
                <AgentTracePanel traces={result.agent_trace} />
                <KnowledgePanel context={result.context || []} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && !isLoading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-card flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to solve math problems</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a math problem above using text, upload an image, or record your question to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
