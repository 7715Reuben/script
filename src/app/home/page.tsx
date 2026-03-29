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

  const [profileRes, checkinsRes, weeklyRes, commitmentsRes, logsRes, challengeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("checkins").select("*").eq("user_id", user.id).eq("date", today),
    supabase.from("weekly_reflections").select("*").eq("user_id", user.id).eq("week_start", weekStart).single(),
    supabase.from("commitments").select("*").eq("user_id", user.id).order("position"),
    supabase.from("commitment_logs").select("*").eq("user_id", user.id).eq("date", today),
    supabase
      .from("identity_challenges")
      .select("id, title, duration, days, started_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!profileRes.data) redirect("/onboarding");

  // Determine today's challenge action if there's an active challenge
  let todaysChallenge: { challengeId: string; title: string; day: number; action: string; done: boolean } | null = null;
  if (challengeRes.data) {
    const c = challengeRes.data;
    const start = new Date(c.started_at);
    const now = new Date(today);
    const dayNumber = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dayNumber >= 1 && dayNumber <= c.duration) {
      const todayAction = (c.days as { day: number; action: string }[]).find((d) => d.day === dayNumber);
      if (todayAction) {
        const logRes = await supabase
          .from("challenge_logs")
          .select("id")
          .eq("challenge_id", c.id)
          .eq("day", dayNumber)
          .single();
        todaysChallenge = {
          challengeId: c.id,
          title: c.title,
          day: dayNumber,
          action: todayAction.action,
          done: !!logRes.data,
        };
      }
    }
  }

  return (
    <HomeClient
      profile={profileRes.data}
      todaysCheckins={checkinsRes.data || []}
      weeklyReflection={weeklyRes.data || null}
      commitments={commitmentsRes.data || []}
      todaysLogs={logsRes.data || []}
      todaysChallenge={todaysChallenge}
    />
  );
}
