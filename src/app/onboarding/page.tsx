"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PaletteWrapper } from "@/components/ui/PaletteWrapper";
import { PortraitDisplay } from "@/components/ui/PortraitDisplay";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

type Step = "write" | "generating" | "portrait" | "auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("write");
  const [rawScript, setRawScript] = useState("");
  const [portrait, setPortrait] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleGenerate = async () => {
    if (rawScript.trim().length < 20) return;
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawScript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPortrait(data.portrait);
      setStep("portrait");
    } catch {
      setError("Something went wrong. Try again.");
      setStep("write");
    }
  };

  const handleConfirmPortrait = () => {
    setStep("auth");
  };

  const handleAuth = async (mode: "signin" | "signup") => {
    setAuthLoading(true);
    setAuthError("");
    const supabase = createClient();

    try {
      let userId: string;

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        userId = data.user!.id;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        userId = data.user!.id;
      }

      // Save portrait
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: userId,
        raw_script: rawScript,
        portrait: portrait,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      router.push("/home");
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <PaletteWrapper event={step === "generating" || step === "portrait" ? "portrait" : "base"}>
      <div className="flex flex-col min-h-dvh max-w-lg mx-auto px-6">
        {/* Header */}
        <header className="flex items-center justify-between pt-12 pb-4">
          <span className="font-serif text-lg tracking-tight text-ink dark:text-dark-text">
            Script
          </span>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex flex-col justify-center pb-16">
          {step === "write" && (
            <WriteStep
              value={rawScript}
              onChange={setRawScript}
              onSubmit={handleGenerate}
              error={error}
            />
          )}

          {step === "generating" && <GeneratingStep />}

          {step === "portrait" && (
            <PortraitStep
              portrait={portrait}
              onEdit={setPortrait}
              onConfirm={handleConfirmPortrait}
              onRewrite={() => setStep("write")}
            />
          )}

          {step === "auth" && (
            <AuthStep
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSignUp={() => handleAuth("signup")}
              onSignIn={() => handleAuth("signin")}
              error={authError}
              loading={authLoading}
            />
          )}
        </main>
      </div>
    </PaletteWrapper>
  );
}

// ─── Write Step ───────────────────────────────────────────────────────────────

function WriteStep({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
}) {
  const ready = value.trim().length >= 20;

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-4">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Your script
        </p>
        <h1 className="heading-editorial text-[1.6rem] leading-[1.35] text-ink dark:text-dark-text">
          Close your eyes for a moment.{" "}
          <span className="accent-script">It&apos;s three years from now</span> and
          everything worked.
        </h1>
        <p className="text-ink-secondary dark:text-dark-text-secondary text-[0.9375rem] leading-relaxed">
          Describe her — the person you became. Not what she achieved. Who she is.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="She wakes up and the first thing she feels is..."
        className="w-full min-h-[220px] bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-[0.9375rem] leading-relaxed resize-none outline-none border-b border-border dark:border-dark-border pb-3 transition-colors"
        autoFocus
      />

      {error && (
        <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={!ready}
        className={cn(
          "w-full py-4 text-sm tracking-widest uppercase transition-all duration-300",
          ready
            ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
            : "bg-border dark:bg-dark-border text-ink-faint dark:text-dark-text-secondary cursor-not-allowed"
        )}
      >
        Write her into existence
      </button>
    </div>
  );
}

// ─── Generating Step ──────────────────────────────────────────────────────────

function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
      <div className="space-y-2 text-center">
        <p className="accent-script text-2xl text-portrait-accent">
          Reading her...
        </p>
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          This takes a moment
        </p>
      </div>
      {/* Pulsing dot */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-portrait-accent animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Portrait Step ────────────────────────────────────────────────────────────

function PortraitStep({
  portrait,
  onEdit,
  onConfirm,
  onRewrite,
}: {
  portrait: string;
  onEdit: (p: string) => void;
  onConfirm: () => void;
  onRewrite: () => void;
}) {
  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-1">
        <p className="text-xs tracking-widest uppercase text-ink-faint dark:text-dark-text-secondary">
          Your portrait
        </p>
        <p className="accent-script text-lg text-portrait-accent">
          This is her.
        </p>
      </div>

      <PortraitDisplay portrait={portrait} editable onSave={onEdit} />

      <div className="space-y-3 pt-4">
        <button
          onClick={onConfirm}
          className="w-full py-4 bg-ink dark:bg-dark-text text-bone dark:text-dark-bg text-sm tracking-widest uppercase"
        >
          This is her
        </button>
        <button
          onClick={onRewrite}
          className="w-full py-3 text-sm text-ink-faint dark:text-dark-text-secondary"
        >
          write again
        </button>
      </div>
    </div>
  );
}

// ─── Auth Step ────────────────────────────────────────────────────────────────

function AuthStep({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSignUp,
  onSignIn,
  error,
  loading,
}: {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSignUp: () => void;
  onSignIn: () => void;
  error: string;
  loading: boolean;
}) {
  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2">
        <p className="accent-script text-xl text-ink dark:text-dark-text">
          Save her.
        </p>
        <p className="text-ink-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
          Create an account to keep your portrait and check in every day.
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your email"
          className="w-full bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-sm border-b border-border dark:border-dark-border pb-3 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="choose a password"
          className="w-full bg-transparent text-ink dark:text-dark-text placeholder:text-ink-faint dark:placeholder:text-dark-text-secondary text-sm border-b border-border dark:border-dark-border pb-3 outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">{error}</p>
      )}

      <div className="space-y-3">
        <button
          onClick={onSignUp}
          disabled={loading || !email || !password}
          className={cn(
            "w-full py-4 text-sm tracking-widest uppercase transition-all",
            !loading && email && password
              ? "bg-ink dark:bg-dark-text text-bone dark:text-dark-bg"
              : "bg-border dark:bg-dark-border text-ink-faint cursor-not-allowed"
          )}
        >
          {loading ? "Saving..." : "Create account"}
        </button>
        <button
          onClick={onSignIn}
          disabled={loading}
          className="w-full py-3 text-sm text-ink-faint dark:text-dark-text-secondary"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
