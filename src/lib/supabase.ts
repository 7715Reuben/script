import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Pronouns = "she" | "he" | "they";

export type Profile = {
  id: string;
  user_id: string;
  raw_script: string;
  portrait: string;
  pronouns: Pronouns;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type Checkin = {
  id: string;
  user_id: string;
  type: "morning" | "evening";
  content: string;
  ai_response: string;
  date: string;
  created_at: string;
};

export type WeeklyReflection = {
  id: string;
  user_id: string;
  content: string;
  week_start: string;
  created_at: string;
};

export type Commitment = {
  id: string;
  user_id: string;
  content: string;
  position: number;
  created_at: string;
};

export type CommitmentLog = {
  id: string;
  user_id: string;
  commitment_id: string;
  date: string;
  kept: boolean;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  content: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyRetrospective = {
  id: string;
  user_id: string;
  content: string;
  month: string; // YYYY-MM
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type PortraitVersion = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};
