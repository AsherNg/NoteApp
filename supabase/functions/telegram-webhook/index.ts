// supabase/functions/telegram-webhook/index.ts
//
// Telegram calls this every time someone messages the bot.
// It replies with the sender's chat_id, which they paste into the app
// to link their account (see Reminder.jsx's ChatIdSetup screen).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

Deno.serve(async (req) => {
  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.chat?.id) {
      // Not a normal message (e.g. edited_message, channel_post) - ignore.
      return new Response("ok", { status: 200 });
    }

    const chatId = message.chat.id;
    const text =
      `Your Telegram Chat ID is:\n\n${chatId}\n\n` +
      `Paste this into the app's "Link your Telegram" screen to connect your reminders.`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("telegram-webhook error:", err);
    // Always return 200 so Telegram doesn't retry-storm this endpoint on error.
    return new Response("ok", { status: 200 });
  }
});