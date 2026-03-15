"use client";

import { useState, useCallback } from "react";
import { ACCEPT, MAX_SIZE_MB, validateFile } from "./constants";

interface FileDropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValidationError?: (message: string) => void;
  disabled?: boolean;
}

export function FileDropZone({
  file,
  onFileChange,
  onValidationError,
  disabled = false,
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        onFileChange(null);
        return;
      }
      const err = validateFile(f);
      if (err) {
        onValidationError?.(err);
        onFileChange(null);
        return;
      }
      onValidationError?.("");
      onFileChange(f);
    },
    [onFileChange, onValidationError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500 focus-within:ring-offset-2 ${
        dragActive
          ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
          : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        className="hidden"
        id="file-input"
        disabled={disabled}
      />
      <label
        htmlFor="file-input"
        className="cursor-pointer block text-zinc-600 dark:text-zinc-400"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {file ? file.name : "Choose a file"}
        </span>
        <span className="block mt-1 text-sm">
          or drag and drop here (PDF, PNG, JPEG, max {MAX_SIZE_MB}MB)
        </span>
      </label>
    </div>
  );
}
