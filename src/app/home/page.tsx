import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { HomeClient } from "./HomeClient";
import { getTodayString, getMondayOfWeek } from "@/lib/utils";

export default async function HomePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const today = getTodayString();
  const weekStart = getMondayOfWeek();

  const [profileRes, checkinsRes, weeklyRes, commitmentsRes, logsRes, weekCheckinsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("checkins").select("*").eq("user_id", user.id).eq("date", today),
    supabase.from("weekly_reflections").select("*").eq("user_id", user.id).eq("week_start", weekStart).single(),
    supabase.from("commitments").select("*").eq("user_id", user.id).order("position"),
    supabase.from("commitment_logs").select("*").eq("user_id", user.id).eq("date", today),
    supabase.from("checkins").select("*").eq("user_id", user.id).gte("date", weekStart).order("date"),
  ]);

  if (!profileRes.data) redirect("/onboarding");

  return (
    <HomeClient
      profile={profileRes.data}
      todaysCheckins={checkinsRes.data || []}
      weeklyReflection={weeklyRes.data || null}
      commitments={commitmentsRes.data || []}
      todaysLogs={logsRes.data || []}
      weekCheckins={weekCheckinsRes.data || []}
    />
  );
}
