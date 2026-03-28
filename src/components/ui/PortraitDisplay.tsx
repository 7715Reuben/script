"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PortraitDisplayProps {
  portrait: string;
  editable?: boolean;
  onSave?: (updated: string) => void;
  className?: string;
}

export function PortraitDisplay({
  portrait,
  editable = false,
  onSave,
  className,
}: PortraitDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(portrait);

  const handleSave = () => {
    onSave?.(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("space-y-4", className)}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full portrait-text bg-transparent resize-none outline-none border-b border-border dark:border-dark-border pb-2 min-h-[200px]"
          autoFocus
        />
        <div className="flex gap-6 text-sm">
          <button
            onClick={handleSave}
            className="text-ink dark:text-dark-text font-medium"
          >
            Save
          </button>
          <button
            onClick={() => { setDraft(portrait); setEditing(false); }}
            className="text-ink-faint dark:text-dark-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render portrait with paragraph breaks
  const paragraphs = portrait.split(/\n\n+/).filter(Boolean);

  return (
    <div className={cn("space-y-5", className)}>
      {paragraphs.map((para, i) => (
        <p key={i} className="portrait-text text-ink dark:text-dark-text">
          {para}
        </p>
      ))}
      {editable && (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-ink-faint dark:text-dark-text-secondary mt-2 hover:text-ink dark:hover:text-dark-text transition-colors"
        >
          edit portrait
        </button>
      )}
    </div>
  );
}
