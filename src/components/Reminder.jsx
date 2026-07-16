import { useState, useEffect, useCallback } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { PiTelegramLogo } from 'react-icons/pi';
import supabase from '../supabaseClient.jsx';

// Set VITE_TELEGRAM_BOT_USERNAME in your .env (the shared bot's @username, no @)
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBotName';

function formatDateTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function ChatIdSetup({ userId, onLinked }) {
    const [chatId, setChatId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const trimmed = chatId.trim();
        if (!trimmed || !/^-?\d+$/.test(trimmed)) {
            setError('Chat ID should be numeric, e.g. 123456789');
            return;
        }
        setSaving(true);
        setError('');
        const { error: upsertError } = await supabase
            .from('user_telegram_settings')
            .upsert({ user_id: userId, chat_id: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        setSaving(false);
        if (upsertError) {
            console.error('Failed to save telegram chat id:', upsertError);
            setError('Failed to save. Please try again.');
            return;
        }
        onLinked(trimmed);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 grow text-center px-6">
            <PiTelegramLogo size={48} className="text-(--color-icon)" />
            <div className="flex flex-col gap-1">
                <span className="font-semibold text-(--color-hover)">Link your Telegram</span>
                <span className="text-sm text-(--color-text) max-w-md">
                    Open Telegram, message <span className="font-semibold">@{TELEGRAM_BOT_USERNAME}</span>, then tap Start.
                    The bot will reply with your Chat ID — paste it below to link your account.
                </span>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
                <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="e.g. 123456789"
                    className="w-full px-3 py-2 rounded-md bg-(--color-secondary) border border-(--color-border) text-(--color-text) outline-none focus:border-(--color-accentHover)"
                />
                {error && <span className="text-sm text-(--color-danger)">{error}</span>}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-(--color-accentHover) text-(--color-bg) font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                    {saving ? 'Linking...' : 'Link Telegram'}
                </button>
            </div>
        </div>
    );
}

function NewReminderForm({ userId, onCreated }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [remindAt, setRemindAt] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const reset = () => { setTitle(''); setMessage(''); setRemindAt(''); };

    const handleSubmit = async () => {
        if (!title.trim() || !remindAt) {
            setError('Title and time are required');
            return;
        }
        const remindDate = new Date(remindAt);
        if (Number.isNaN(remindDate.getTime()) || remindDate.getTime() <= Date.now()) {
            setError('Pick a time in the future');
            return;
        }
        setSaving(true);
        setError('');
        const { data, error: insertError } = await supabase
            .from('reminders')
            .insert({
                user_id: userId,
                title: title.trim(),
                message: message.trim() || title.trim(),
                remind_at: remindDate.toISOString(),
            })
            .select()
            .single();
        setSaving(false);
        if (insertError) {
            console.error('Failed to create reminder:', insertError);
            setError('Failed to create reminder');
            return;
        }
        onCreated(data);
        reset();
    };

    return (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-(--color-secondary) border border-(--color-border)">
            <span className="font-semibold text-(--color-hover) text-sm">New Reminder</span>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-md bg-(--color-bg) border border-(--color-border) text-(--color-text) outline-none focus:border-(--color-accentHover)"
            />
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (optional, defaults to title)"
                rows={2}
                className="w-full px-3 py-2 rounded-md bg-(--color-bg) border border-(--color-border) text-(--color-text) outline-none resize-none focus:border-(--color-accentHover)"
            />
            <input
                type="datetime-local"
                value={remindAt}
                onChange={(e) => setRemindAt(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-(--color-bg) border border-(--color-border) text-(--color-text) outline-none focus:border-(--color-accentHover) [&::-webkit-calendar-picker-indicator]:text-(--color-text)"
            />
            {error && <span className="text-sm text-(--color-danger)">{error}</span>}
            <button
                onClick={handleSubmit}
                disabled={saving}
                className="self-end px-4 py-2 rounded-md bg-(--color-accentHover) text-(--color-bg) font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
                {saving ? 'Adding...' : 'Add Reminder'}
            </button>
        </div>
    );
}

function ReminderRow({ reminder, onDelete }) {
    const [deleting, setDeleting] = useState(false);
    const isPast = new Date(reminder.remind_at).getTime() <= Date.now();

    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('reminders').delete().eq('id', reminder.id);
        setDeleting(false);
        if (error) {
            console.error('Failed to delete reminder:', error);
            return;
        }
        onDelete(reminder.id);
    };

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-(--color-secondary) border border-(--color-border)">
            <div className="flex flex-col min-w-0">
                <span className="font-semibold text-(--color-hover) truncate">{reminder.title}</span>
                {reminder.message && reminder.message !== reminder.title && (
                    <span className="text-sm text-(--color-text) truncate">{reminder.message}</span>
                )}
                <span className={`text-xs mt-1 ${isPast && reminder.status === 'pending' ? 'text-(--color-danger)' : 'text-(--color-text)'}`}>
                    {formatDateTime(reminder.remind_at)}
                    {reminder.status === 'sent' ? ' · Sent' : isPast ? ' · Overdue' : ''}
                </span>
            </div>
            <IoTrashOutline
                size={20}
                onClick={() => !deleting && handleDelete()}
                className={`shrink-0 text-(--color-icon) hover:text-(--color-danger) cursor-pointer ${deleting ? 'opacity-50 pointer-events-none' : ''}`}
            />
        </div>
    );
}

function Reminder() {
    const [userId, setUserId] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadReminders = useCallback(async (uid) => {
        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', uid)
            .order('remind_at', { ascending: true });
        if (error) {
            console.error('Failed to load reminders:', error);
            return;
        }
        setReminders(data ?? []);
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Failed to get user:', userError);
                setLoading(false);
                return;
            }
            if (!active) return;
            setUserId(user.id);

            const { data: settings, error: settingsError } = await supabase
                .from('user_telegram_settings')
                .select('chat_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (settingsError) console.error('Failed to load telegram settings:', settingsError);
            if (!active) return;

            if (settings?.chat_id) {
                setChatId(settings.chat_id);
                await loadReminders(user.id);
            }
            setLoading(false);
        })();
        return () => { active = false; };
    }, [loadReminders]);

    if (loading) {
        return <div className="flex grow items-center justify-center text-(--color-text)">Loading...</div>;
    }

    if (!userId) {
        return <div className="flex grow items-center justify-center text-(--color-text)">Please sign in to manage reminders.</div>;
    }

    if (!chatId) {
        return <ChatIdSetup userId={userId} onLinked={(id) => { setChatId(id); loadReminders(userId); }} />;
    }

    return (
        <div className="flex flex-col gap-4 grow overflow-hidden">
            <NewReminderForm
                userId={userId}
                onCreated={(r) => setReminders((prev) => [...prev, r].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)))}
            />
            <div className="flex flex-col gap-2 overflow-y-auto grow">
                {reminders.length === 0 ? (
                    <span className="text-sm text-(--color-text) text-center mt-4">No reminders yet — add one above.</span>
                ) : (
                    reminders.map((r) => (
                        <ReminderRow
                            key={r.id}
                            reminder={r}
                            onDelete={(id) => setReminders((prev) => prev.filter((rem) => rem.id !== id))}
                        />
                    ))
                )}
            </div>
            <button
                onClick={async () => {
                    if (!confirm('Unlink Telegram? You can relink anytime.')) return;
                    await supabase.from('user_telegram_settings').delete().eq('user_id', userId);
                    setChatId(null);
                    setReminders([]);
                }}
                className="text-xs text-(--color-text) hover:text-(--color-danger) self-start cursor-pointer"
            >
                Unlink Telegram
            </button>
        </div>
    );
}

export default Reminder;