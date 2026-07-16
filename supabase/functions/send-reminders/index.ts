// supabase/functions/send-reminders/index.ts
//
// Called every minute by a pg_cron job (via pg_net). Finds reminders that
// are due, sends them through the Telegram bot, and marks them sent/failed.
// Protected by a shared secret header rather than Supabase JWT auth, since
// pg_net calls it directly (see the pg_cron SQL in the setup guide).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// SUPABASE_SERVICE_ROLE_KEY is auto-injected by Supabase into every Edge
// Function - no need to set it yourself. It bypasses RLS, which is required
// here since this function needs to read/update every user's reminders.
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, user_id, title, message, remind_at")
    .eq("status", "pending")
    .lte("remind_at", new Date().toISOString())
    .limit(50);

  if (error) {
    console.error("Failed to fetch due reminders:", error);
    return new Response("error fetching reminders", { status: 500 });
  }

  if (!due || due.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), { status: 200 });
  }

  const userIds = [...new Set(due.map((r) => r.user_id))];
  const { data: settings, error: settingsError } = await supabase
    .from("user_telegram_settings")
    .select("user_id, chat_id")
    .in("user_id", userIds);

  if (settingsError) {
    console.error("Failed to fetch telegram settings:", settingsError);
    return new Response("error fetching settings", { status: 500 });
  }

  const chatIdByUser = new Map(settings.map((s) => [s.user_id, s.chat_id]));

  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    const chatId = chatIdByUser.get(reminder.user_id);

    if (!chatId) {
      // No linked Telegram account (or unlinked since creating the reminder)
      await supabase.from("reminders").update({ status: "failed" }).eq("id", reminder.id);
      failed++;
      continue;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⏰ ${reminder.title}\n\n${reminder.message}`,
        }),
      });

      if (!res.ok) throw new Error(`Telegram API returned ${res.status}`);

      await supabase.from("reminders").update({ status: "sent" }).eq("id", reminder.id);
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder ${reminder.id}:`, err);
      await supabase.from("reminders").update({ status: "failed" }).eq("id", reminder.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, failed }), { status: 200 });
});