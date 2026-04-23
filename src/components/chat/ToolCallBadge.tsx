"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function basename(p: unknown): string {
  if (typeof p !== "string" || !p) return "";
  return p.split("/").filter(Boolean).pop() ?? "";
}

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args;
    const file = basename(path);
    switch (command) {
      case "create":
        return file ? `Creating ${file}` : "Creating file";
      case "str_replace":
      case "insert":
        return file ? `Editing ${file}` : "Editing file";
      case "view":
        return file ? `Reading ${file}` : "Reading file";
      case "undo_edit":
        return file ? `Undoing edit on ${file}` : "Undoing edit";
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args;
    const file = basename(path);
    switch (command) {
      case "rename": {
        const newFile = basename(new_path);
        return file && newFile ? `Renaming ${file} → ${newFile}` : "Renaming file";
      }
      case "delete":
        return file ? `Deleting ${file}` : "Deleting file";
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
