"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Channel, CreateChannelDraft, Server } from "@/types/chat";

/* ── SVG Icons ── */
const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        className="category-chevron"
        style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
    >
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const HashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.5">
        <path d="M5.88 3.22l-.88 3.56h3l.88-3.56h1.24l-.88 3.56H11.5v1.22H8.86l-.62 2.56H10.5v1.22H7.86l-.88 3.56H5.74l.88-3.56h-3l-.88 3.56H1.5l.88-3.56H.12V9h2.64l.62-2.56H1.12V5.22h2.64l.88-3.56h1.24zM4.38 7.78l-.62 2.56h3l.62-2.56h-3z" transform="translate(2,0)" />
    </svg>
);

const VoiceIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.5">
        <path d="M11 5V3a3 3 0 00-6 0v2a1 1 0 00-1 1v4a1 1 0 001 1h6a1 1 0 001-1V6a1 1 0 00-1-1zM8 11a2.5 2.5 0 002.5-2.5V5h-5v3.5A2.5 2.5 0 008 11z" transform="translate(0,1) scale(0.95)" />
    </svg>
);

const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const HeadphoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

type ChannelSidebarProps = {
    server: Server;
    channels: Channel[];
    activeChannelId: string;
    onChannelSelect: (id: string) => void;
    onCreateChannel: (draft: CreateChannelDraft) => void;
};

export function ChannelSidebar({
    server,
    channels,
    activeChannelId,
    onChannelSelect,
    onCreateChannel,
}: ChannelSidebarProps) {
    const groupedChannels = useMemo(() => {
        const groups = new Map<string, Channel[]>();

        for (const channel of channels) {
            const key = channel.category || "Channels";
            const existing = groups.get(key);

            if (existing) {
                existing.push(channel);
            } else {
                groups.set(key, [channel]);
            }
        }

        return Array.from(groups, ([category, items]) => ({
            category,
            channels: items,
        }));
    }, [channels]);

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [draftName, setDraftName] = useState("");
    const [draftType, setDraftType] = useState<"text" | "voice">("text");

    const toggleCategory = (cat: string) => {
        setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    const handleCreateChannel = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = draftName.trim();

        if (!name) {
            return;
        }

        onCreateChannel({
            name,
            type: draftType,
            category: draftType === "voice" ? "Voice Channels" : "Text Channels",
        });

        setCreateOpen(false);
        setDraftName("");
        setDraftType("text");
    };

    return (
        <aside className="channel-sidebar">
            {/* Server header */}
            <div className="sidebar-header">
                <span className="sidebar-server-name">{server.label}</span>
                <button
                    type="button"
                    className={`sidebar-create-btn ${createOpen ? "active" : ""}`}
                    onClick={() => setCreateOpen((value) => !value)}
                    title="Create channel"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
            {createOpen && (
                <form className="channel-create-panel" onSubmit={handleCreateChannel}>
                    <input
                        type="text"
                        className="channel-create-input"
                        placeholder="Channel name"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                    />
                    <div className="channel-create-row">
                        <button
                            type="button"
                            className={`channel-type-btn ${draftType === "text" ? "active" : ""}`}
                            onClick={() => setDraftType("text")}
                        >
                            Text
                        </button>
                        <button
                            type="button"
                            className={`channel-type-btn ${draftType === "voice" ? "active" : ""}`}
                            onClick={() => setDraftType("voice")}
                        >
                            Voice
                        </button>
                        <button type="submit" className="channel-create-submit">
                            Create
                        </button>
                    </div>
                </form>
            )}

            {/* Channel list */}
            <div className="channel-list">
                {groupedChannels.map(({ category, channels: categoryChannels }) => {
                    const isCollapsed = collapsed[category] ?? false;

                    return (
                        <div key={category} className="channel-category">
                            <button
                                className="category-header"
                                onClick={() => toggleCategory(category)}
                            >
                                <ChevronIcon open={!isCollapsed} />
                                <span>{category}</span>
                            </button>

                            {!isCollapsed && (
                                <div className="category-channels">
                                    {categoryChannels.map((channel) => {
                                        const active = channel.id === activeChannelId;
                                        return (
                                            <button
                                                type="button"
                                                key={channel.id}
                                                onClick={() => onChannelSelect(channel.id)}
                                                className={`channel-item ${active ? "active" : ""}`}
                                            >
                                                {channel.type === "voice" ? <VoiceIcon /> : <HashIcon />}
                                                <span className="channel-name">{channel.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* User panel */}
            <div className="user-panel">
                <div className="user-panel-info">
                    <div className="user-avatar-small">
                        <span>U</span>
                        <span className="user-status-dot online" />
                    </div>
                    <div className="user-text">
                        <p className="user-display-name">You</p>
                        <p className="user-status-label">Online</p>
                    </div>
                </div>
                <div className="user-panel-actions">
                    <button className="panel-action-btn" title="Microphone">
                        <MicIcon />
                    </button>
                    <button className="panel-action-btn" title="Headphones">
                        <HeadphoneIcon />
                    </button>
                    <button className="panel-action-btn" title="Settings">
                        <SettingsIcon />
                    </button>
                </div>
            </div>
        </aside>
    );
}
