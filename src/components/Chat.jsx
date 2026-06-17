import { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import supabase from "../supabaseClient";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6JPOQgAAgdJHJF0NCuHMsjimhngzFXJ9Uw_znm8jj6qwQ" });

async function getUserId() {
    const { data: {user} } = await supabase.auth.getUser();
    return user?.id ?? null;
}

async function loadApiKey() {
    const uid = await getUserId();
    if (!uid) return null;
    const { data } = await supabase
        .from("user_settings")
        .select("api_key")
        .eq("user_id", uid)
        .single();
    return data?.api_key ?? null;
}

async function loadConversations() {
    const uid = await getUserId();
    if (!uid) return [];
    const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(30);
    return data ?? [];
}
 
async function createConversation(title) {
    const uid = await getUserId();
    if (!uid) return null;
    const { data } = await supabase
        .from("conversations")
        .insert({ user_id: uid, title })
        .select("id, title, created_at")
        .single();
    return data;
}
 
async function deleteConversation(id) {
    await supabase.from("conversations").delete().eq("id", id);
}
 
async function loadMessages(conversationId) {
    const { data } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
    return data ?? [];
}
 
async function saveMessage(conversationId, role, content) {
    const { data } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, role, content })
        .select("id, role, content, created_at")
        .single();
    return data;
}
 
async function touchConversation(id) {
    await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);
}

async function callChat(chat, messages) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages
    });
    return response.text;

    /*
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? "API Error");
    return data.content[0].text;
    */
}


const MessageBubble = ({ role, content }) => {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <div>
                {isUser ? "U" : "A"}
            </div>
            <div>
                {content}
            </div>
        </div>
    )
}

const Chat = ({ open, closeChat }) => {
    const [apiKey, setApiKey] = useState(null);
    const [keyLoading, setKeyLoading] = useState(true);

    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgLoading, setMsgLoading] = useState(false);

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const textareaRef = useRef(null);

    const chatbot = ai.chats.create({ model: "gemini-2.5-flash" });

    useEffect(() => {
        /*loadApiKey().then(k => {
            setApiKey(k);
            setKeyLoading(false);
        })*/
       setApiKey();
    }, []);

    useEffect(() => {
        if (open && apiKey) {
            loadConversations().then(setConversations);
        }
    }, [open, apiKey]);

    useEffect(() => {
        if (!activeConvId) return;
        setMsgLoading(true);
        loadMessages(activeConvId).then(msgs => {
            setMessages(msgs);
            setMsgLoading(false);
        });
    }, [activeConvId]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput("");
        setError("");
        setSending(true);

        try {
            let convId = activeConvId;
            if (!convId) {
                const title = text.length > 40 ? text.slice(0, 40) + "..." : text;
                const conv = await createConversation(title);
                convId = conv.id;
                setActiveConvId(convId);
                setConversations(prev => [conv, ...prev]);
            }

            const savedUser = await saveMessage(convId, "user", text);
            setMessages(prev => [...prev, savedUser]);

            // Use last 10 messages for context
            const allMsgs = await loadMessages(convId);
            const context = allMsgs.slice(-10).map(m => ({ role:m.role === "assistant" ? "assistant" : "user", parts: [{ text: m.content }]}));

            const reply = await callChat(chatbot, context);
            const savedBot = await saveMessage(convId, "assistant", reply);
            setMessages(prev => [...prev, savedBot]);

            await touchConversation(convId);
        } catch (e) {
            setError(e.message ?? "Somthing went wrong");
        }

        setSending(false);
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!open) return null;

    return (
        <div className="h-screen bg-(--color-primary) w-70 border-(--color-border) border-l-1 flex flex-col justify-between p-4 text-(--color-text)">
            <div className="flex flex-row justify-between">
                <span className="text-(--color-active)">Chat</span>
                <IoClose size={24} onClick={() => closeChat()} className="cursor-pointer hover:text-(--color-hover)"/>
            </div>

            <div className="overflow-y-auto">
                {messages.map(m => (
                    <MessageBubble key={m.id} role={m.role} content={m.content}/>
                ))}
            </div>

            <div className="border-t-1 border-(--color-border) h-32 pt-3">
                <textarea className="h-full w-full resize-none border-1 border-(--color-border) outline-none rounded-sm focus:border-(--color-active) p-2" ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question... (Enter to send)" rows={1}/>
            </div>
        </div>
    );
}

export default Chat;