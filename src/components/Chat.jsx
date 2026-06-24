import { useState, useEffect, useRef } from "react";
import { IoAdd, IoChevronDown, IoClose, IoTrash } from "react-icons/io5";
import supabase from "../supabaseClient";
import { GoogleGenAI } from "@google/genai";

const key = import.meta.env.VITE_CHATBOT_APIKEY;
const ai = new GoogleGenAI({ apiKey: key });

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
        <div className={`flex items-between my-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`p-3 rounded-lg leading-relaxed text-sm border-1 border-(--color-border) ${!isUser ? "bg-(--color-active) text-(--color-bg)" : "bg-(--color-secondary)"}`}>
                {content}
            </div>
            <div className="w-10 h-6"></div>
        </div>
    )
}

const ThinkingBubble = () => {
    return (
        <div className="flex flex-row">
            <div className="bg-(--color-secondary) border-1 border-(--color-border) rounded-lg p-3 flex items-center">
                {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1 h-1 m-1 rounded-full bg-(--color-text) opacity-50 animation-bounce" style={{ animationDelay: `${delay}ms` }}/>
                ))}
            </div>
        </div>
    )
}

const ConversationList = ({ conversations, activeId, onSelect, onCreate, onDelete }) => {
    return (
        <div className="flex flex-col overflow-y-auto py-1">
            <button onClick={onCreate} className="flex items-center text-xs p-2 hover:text-(--hover) cursor-pointer">
                New Chat <IoAdd size={12} className="mx-1"/>
            </button>
            {conversations.map(c => (
                <div key={c.id} onClick={() => onSelect(c.id)} className={`group flex items-center justify-between px-2 py-1.5 text-xs cursor-pointer transition-colors ${c.id === activeId ? "bg-(--color-border) text-(--color-hover)" : "text-(--color-text) hover:bg-(--color-border)"}`}>
                    <span className="truncate flex-1">{c.title}</span>
                    <button onClick={e => {e.stopPropagation(); onDelete(c.id);}}>
                        <IoTrash size={12} className="hover:text-(--hover)"/>
                    </button>
                </div>
            ))}
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

    const [showSidebar, setShowSidebar] = useState(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const chatbot = ai.chats.create({ model: "gemini-3.5-flash" });

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    const handleNewConversation = () => {
        setActiveConvId(null);
        setMessages([]);
        setShowSidebar(false);
    }
    
    const handleSelectConversation = async (id) => {
        setActiveConvId(id);
        setShowSidebar(false);
    }

    const handleDeleteConversation = async (id) => {
        await deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConvId === id) {
            setActiveConvId(null);
            setMessages([]);
        }
    }

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
            <div className="flex flex-col justify-start">
                <div className="flex flex-row justify-between border-b-1 border-(--color-border) pb-2">
                    <span className="text-(--color-active)">Chat</span>
                    <IoClose size={24} onClick={() => closeChat()} className="cursor-pointer hover:text-(--color-hover)"/>
                </div>
                <div className="flex items-center my-1">
                    <button onClick={() => setShowSidebar(s => !s)} className="flex items-center gap-1 hover:text-(--color-hover)">
                        <span>Conversations</span>
                        <IoChevronDown size={12} className={`transition-transform ${showSidebar ? "rotate-180" : ""}`} />
                    </button>
                </div>  
                {showSidebar && (
                    <div>
                        <ConversationList conversations={conversations} activeId={activeConvId} onSelect={handleSelectConversation} onCreate={handleNewConversation} onDelete={handleDeleteConversation}/>
                    </div>
                )}
            </div>            

            

            <div className="overflow-y-auto px-3 my-3 scrollbar-gutter-stable scrollbar-thumb-(--color-tertiary) scrollbar-track-transparent flex flex-col">
                {msgLoading && (
                    <div className="text-xs opacity-50 text-center">
                        Loading...
                    </div>
                )}
                {messages.map(m => (
                    <MessageBubble key={m.id} role={m.role} content={m.content}/>
                ))}
                {sending && <ThinkingBubble/>}
                {error && <p className="text-xs text-center text-black border-1 border-(--color-border) p-3 rounded-lg bg-(--color-danger)">{error}</p>}
            </div>

            <div className="border-t-1 border-(--color-border) h-32 pt-3">
                <textarea className="h-full w-full resize-none border-1 border-(--color-border) outline-none rounded-sm focus:border-(--color-active) p-2" ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question... (Enter to send)" rows={1}/>
            </div>
        </div>
    );
}

export default Chat;