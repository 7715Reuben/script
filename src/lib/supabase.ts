import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Pronouns = "she" | "he";

export type Profile = {
  id: string;
  user_id: string;
  raw_script: string;
  portrait: string;
  pronouns: Pronouns;
  created_at: string;
  updated_at: string;
};

export type Checkin = {
  id: string;
  user_id: string;
  type: "morning" | "evening";
  content: string;
  ai_response: string;
  date: string; // YYYY-MM-DD
  created_at: string;
};

export type WeeklyReflection = {
  id: string;
  user_id: string;
  content: string;
  week_start: string; // YYYY-MM-DD Monday
  created_at: string;
};
