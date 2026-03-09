"use client";

import { useState, useRef, useCallback } from "react";
import { Type, Image, Mic, Upload, X, Loader2, Send, Square } from "lucide-react";
import type { InputMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InputPanelProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onSolve: (data: { text?: string; imageFile?: File; audioBlob?: Blob }) => void;
  isLoading: boolean;
  ocrPreview?: string;
  transcriptPreview?: string;
}

const modes = [
  { id: "text" as const, label: "Text", icon: Type },
  { id: "image" as const, label: "Image", icon: Image },
  { id: "audio" as const, label: "Audio", icon: Mic },
];

export function InputPanel({
  mode,
  onModeChange,
  onSolve,
  isLoading,
  ocrPreview,
  transcriptPreview,
}: InputPanelProps) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [editedOcr, setEditedOcr] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageSelect(file);
    }
  }, [handleImageSelect]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "text") {
      onSolve({ text: editedOcr || editedTranscript || text });
    } else if (mode === "image" && imageFile) {
      onSolve({ imageFile, text: editedOcr || undefined });
    } else if (mode === "audio" && audioBlob) {
      onSolve({ audioBlob, text: editedTranscript || undefined });
    }
  };

  const clearInput = () => {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setAudioBlob(null);
    setEditedOcr("");
    setEditedTranscript("");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden glow-blue">
      {/* Mode Selector */}
      <div className="flex border-b border-border">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              onModeChange(m.id);
              clearInput();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all",
              mode === m.id
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Text Input */}
        {mode === "text" && (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your math problem here... e.g., 'Solve x² + 5x + 6 = 0' or 'Find the derivative of sin(x)cos(x)'"
              className="w-full h-40 p-4 bg-secondary/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Image Input */}
        {mode === "image" && (
          <div className="space-y-4">
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drop an image here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PNG, JPG, JPEG
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Uploaded problem"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* OCR Preview */}
            {ocrPreview && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Extracted Text (edit if needed):
                </label>
                <textarea
                  value={editedOcr || ocrPreview}
                  onChange={(e) => setEditedOcr(e.target.value)}
                  className="w-full h-24 p-3 bg-secondary/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Audio Input */}
        {mode === "audio" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-8">
              {!audioBlob ? (
                <>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                      isRecording
                        ? "bg-destructive animate-pulse"
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                  </p>
                </>
              ) : (
                <>
                  <audio
                    src={URL.createObjectURL(audioBlob)}
                    controls
                    className="w-full max-w-md"
                  />
                  <button
                    onClick={() => setAudioBlob(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Record again
                  </button>
                </>
              )}
            </div>

            {/* Transcript Preview */}
            {transcriptPreview && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Transcript (edit if needed):
                </label>
                <textarea
                  value={editedTranscript || transcriptPreview}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full h-24 p-3 bg-secondary/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (mode === "text" && !text.trim()) ||
              (mode === "image" && !imageFile) ||
              (mode === "audio" && !audioBlob)
            }
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Solving...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Solve Problem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
