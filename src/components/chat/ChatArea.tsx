"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Channel, ChatMessage } from "@/types/chat";

/* ── SVG Icons ── */
const PinIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" />
    </svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const MembersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const PlusCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
);

const EmojiIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
);

const GifIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" opacity="0.6">GIF</text>
    </svg>
);

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
);

/* Hover action for messages */
const MessageActions = () => (
    <div className="message-actions">
        <button type="button" className="msg-action-btn" title="Add Reaction">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
            </svg>
        </button>
        <button type="button" className="msg-action-btn" title="Reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 00-4-4H4" />
            </svg>
        </button>
        <button type="button" className="msg-action-btn" title="More">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
            </svg>
        </button>
    </div>
);

const formatMessageTime = (createdAt: number) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();
    const today = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);

    const time = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

    if (date.toDateString() === today) {
        return `Today at ${time}`;
    }

    if (date.toDateString() === yesterdayDate.toDateString()) {
        return `Yesterday at ${time}`;
    }

    return `${date.toLocaleDateString()} at ${time}`;
};

type ChatAreaProps = {
    channel: Channel | null;
    messages: ChatMessage[];
    showMembers: boolean;
    onToggleMembers: () => void;
    onSendMessage: (body: string) => Promise<void>;
    sendingMessage: boolean;
};

export function ChatArea({
    channel,
    messages,
    showMembers,
    onToggleMembers,
    onSendMessage,
    sendingMessage,
}: ChatAreaProps) {
    const [inputValue, setInputValue] = useState("");
    const endRef = useRef<HTMLDivElement | null>(null);
    const isVoiceChannel = channel?.type === "voice";
    const canSend = Boolean(channel) && !isVoiceChannel;

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length, channel?.id]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSend) {
            return;
        }

        const nextValue = inputValue.trim();
        if (!nextValue) {
            return;
        }

        try {
            await onSendMessage(nextValue);
            setInputValue("");
        } catch {
            // Store handles error reporting; keep input so users can retry.
        }
    };

    return (
        <section className="chat-area">
            {/* Header */}
            <header className="chat-header">
                <div className="chat-header-left">
                    <span className="chat-header-hash">#</span>
                    <span className="chat-header-name">{channel?.name ?? "No channel selected"}</span>
                    {channel?.topic && (
                        <>
                            <span className="chat-header-divider" />
                            <span className="chat-header-topic">{channel.topic}</span>
                        </>
                    )}
                </div>
                <div className="chat-header-actions">
                    <button type="button" className="header-action-btn" title="Pinned Messages"><PinIcon /></button>
                    <button type="button" className="header-action-btn" title="Search"><SearchIcon /></button>
                    <button
                        type="button"
                        className={`header-action-btn ${showMembers ? "active" : ""}`}
                        title="Members"
                        onClick={onToggleMembers}
                    >
                        <MembersIcon />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="chat-messages">
                {/* Welcome header */}
                <div className="channel-welcome">
                    <div className="welcome-icon">
                        <span>#</span>
                    </div>
                    <h2>
                        {channel
                            ? `Welcome to #${channel.name}`
                            : "Create a server or channel to get started"}
                    </h2>
                    <p>
                        {channel
                            ? `This is the start of #${channel.name}. ${channel.topic || "No topic yet."}`
                            : "Your chat history will load from the local SQLite database."}
                    </p>
                </div>

                {messages.map((msg) => (
                    <article key={msg.id} className="chat-message">
                        <div className="message-avatar">
                            <span>{msg.avatar || msg.author.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-author">{msg.author}</span>
                                <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                            <p className="message-body">{msg.body}</p>
                        </div>
                        <MessageActions />
                    </article>
                ))}
                <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div className="chat-input-container">
                <form className="chat-input-bar" onSubmit={handleSubmit}>
                    <button type="button" className="input-action-btn" title="Attach" disabled={!channel}>
                        <PlusCircleIcon />
                    </button>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={
                            isVoiceChannel
                                ? "Text chat is disabled for voice channels"
                                : channel
                                    ? `Message #${channel.name}`
                                    : "Select a channel to start chatting"
                        }
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={!canSend || sendingMessage}
                    />
                    <div className="input-right-actions">
                        <button type="button" className="input-action-btn" title="GIF" disabled={!canSend}><GifIcon /></button>
                        <button type="button" className="input-action-btn" title="Emoji" disabled={!canSend}><EmojiIcon /></button>
                        <button
                            type="submit"
                            className="chat-send-btn"
                            title="Send message"
                            disabled={!canSend || sendingMessage || !inputValue.trim()}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
