"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type MouseEvent as ReactMouseEvent,
} from "react";
import { Virtuoso } from "react-virtuoso";
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

const PinFilledIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l2 6 5 2-5 2-2 8-2-8-5-2 5-2z" />
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

type UploadedAttachment = {
    id: string;
    name: string;
    size: number;
    mime: string;
    url: string;
};

type LocalMessage = ChatMessage & {
    isLocal: true;
    attachments?: UploadedAttachment[];
};

type RenderMessage = (ChatMessage | LocalMessage) & {
    attachments?: UploadedAttachment[];
};

const EMOJI_SET = ["😀", "😂", "🔥", "🎉", "✅", "🤝", "🚀", "👏", "💡", "❤️", "😎", "🙌"];
const QUICK_REACTIONS = ["👍", "🔥", "✅", "❤️"];

const isLocalMessage = (message: RenderMessage): message is LocalMessage =>
    "isLocal" in message && message.isLocal === true;

const toFileSizeLabel = (size: number) => {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const extractGifUrl = (body: string) => {
    const match = body.match(/https?:\/\/\S+\.gif(?:\?\S*)?$/i);
    return match?.[0] ?? null;
};

const getTextWithoutGif = (body: string, gifUrl: string | null) => {
    if (!gifUrl) {
        return body;
    }

    return body.replace(gifUrl, "").trim();
};

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
};

export function ChatArea({
    channel,
    messages,
    showMembers,
    onToggleMembers,
    onSendMessage,
}: ChatAreaProps) {
    const [inputValue, setInputValue] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [gifPickerOpen, setGifPickerOpen] = useState(false);
    const [gifDraft, setGifDraft] = useState("");
    const [gifError, setGifError] = useState<string | null>(null);
    const [pinsByChannel, setPinsByChannel] = useState<Record<string, string[]>>({});
    const [reactionsByMessage, setReactionsByMessage] = useState<Record<string, string[]>>({});
    const [localMessagesByChannel, setLocalMessagesByChannel] = useState<Record<string, LocalMessage[]>>({});
    const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const chatMessagesRef = useRef<HTMLDivElement | null>(null);
    const localMessagesRef = useRef<Record<string, LocalMessage[]>>({});

    const isVoiceChannel = channel?.type === "voice";
    const canSend = Boolean(channel) && !isVoiceChannel;

    const channelId = channel?.id ?? "";
    const localMessages = useMemo(
        () => (channelId ? localMessagesByChannel[channelId] ?? [] : []),
        [channelId, localMessagesByChannel]
    );

    const composedMessages = useMemo<RenderMessage[]>(() => {
        const merged = [...messages, ...localMessages];
        return merged.sort((left, right) => left.createdAt - right.createdAt);
    }, [messages, localMessages]);

    const pinnedIds = useMemo(
        () => (channelId ? pinsByChannel[channelId] ?? [] : []),
        [channelId, pinsByChannel]
    );

    const visibleMessages = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        let next = composedMessages;
        if (showPinnedOnly && pinnedIds.length > 0) {
            const pinSet = new Set(pinnedIds);
            next = next.filter((message) => pinSet.has(message.id));
        } else if (showPinnedOnly) {
            next = [];
        }

        if (!normalizedQuery) {
            return next;
        }

        return next.filter((message) => {
            const attachmentText =
                "attachments" in message && message.attachments
                    ? message.attachments.map((item) => item.name).join(" ")
                    : "";
            const haystack = `${message.author} ${message.body} ${attachmentText}`.toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [composedMessages, pinnedIds, searchQuery, showPinnedOnly]);

    const pinnedCount = pinnedIds.length;

    const resolveMessageById = useCallback(
        (id: string) => composedMessages.find((message) => message.id === id) ?? null,
        [composedMessages]
    );

    const togglePinnedMessage = useCallback(
        (messageId: string) => {
            if (!channelId) {
                return;
            }

            setPinsByChannel((state) => {
                const current = state[channelId] ?? [];
                const exists = current.includes(messageId);
                return {
                    ...state,
                    [channelId]: exists
                        ? current.filter((item) => item !== messageId)
                        : [...current, messageId],
                };
            });
        },
        [channelId]
    );

    const addReaction = useCallback((messageId: string, emoji: string) => {
        setReactionsByMessage((state) => {
            const nextSet = new Set(state[messageId] ?? []);
            nextSet.add(emoji);
            return {
                ...state,
                [messageId]: Array.from(nextSet),
            };
        });
    }, []);

    const handleLocalDelete = useCallback(
        (messageId: string) => {
            if (!channelId) {
                return;
            }

            setLocalMessagesByChannel((state) => {
                const current = state[channelId] ?? [];
                const target = current.find((message) => message.id === messageId);

                if (target?.attachments?.length) {
                    for (const file of target.attachments) {
                        URL.revokeObjectURL(file.url);
                    }
                }

                return {
                    ...state,
                    [channelId]: current.filter((message) => message.id !== messageId),
                };
            });

            setPinsByChannel((state) => ({
                ...state,
                [channelId]: (state[channelId] ?? []).filter((id) => id !== messageId),
            }));

            setReactionsByMessage((state) => {
                const next = { ...state };
                delete next[messageId];
                return next;
            });
        },
        [channelId]
    );

    useEffect(() => {
        const closeContext = () => setContextMenu(null);
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setContextMenu(null);
                setEmojiPickerOpen(false);
                setGifPickerOpen(false);
                setGifError(null);
                setSearchOpen(false);
                setSearchQuery("");
            }
        };

        window.addEventListener("click", closeContext);
        window.addEventListener("contextmenu", closeContext);
        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("click", closeContext);
            window.removeEventListener("contextmenu", closeContext);
            window.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        localMessagesRef.current = localMessagesByChannel;
    }, [localMessagesByChannel]);

    useEffect(() => {
        return () => {
            for (const channelMessages of Object.values(localMessagesRef.current)) {
                for (const message of channelMessages) {
                    for (const file of message.attachments ?? []) {
                        URL.revokeObjectURL(file.url);
                    }
                }
            }
        };
    }, []);

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

    const handleUploadClick = () => {
        if (!canSend) {
            return;
        }

        fileInputRef.current?.click();
    };

    const handleUploadSelection = (event: ChangeEvent<HTMLInputElement>) => {
        if (!channelId) {
            return;
        }

        const files = Array.from(event.target.files ?? []);
        if (!files.length) {
            return;
        }

        const attachments = files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            mime: file.type || "application/octet-stream",
            url: URL.createObjectURL(file),
        }));

        const summary =
            attachments.length === 1
                ? `Uploaded ${attachments[0].name}`
                : `Uploaded ${attachments.length} files`;

        const uploadMessage: LocalMessage = {
            id: `local-${crypto.randomUUID()}`,
            channelId,
            author: "You",
            avatar: "YO",
            body: summary,
            createdAt: Date.now(),
            isLocal: true,
            attachments,
        };

        setLocalMessagesByChannel((state) => ({
            ...state,
            [channelId]: [...(state[channelId] ?? []), uploadMessage],
        }));

        event.target.value = "";
    };

    const handleGifSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSend) {
            return;
        }

        const normalized = gifDraft.trim();
        if (!normalized) {
            setGifError("Enter a direct GIF URL.");
            return;
        }

        if (!/https?:\/\/\S+\.gif(?:\?\S*)?$/i.test(normalized)) {
            setGifError("Please provide a direct .gif URL.");
            return;
        }

        try {
            await onSendMessage(normalized);
            setGifDraft("");
            setGifError(null);
            setGifPickerOpen(false);
        } catch {
            // Store handles errors.
        }
    };

    const openContextMenu = (event: ReactMouseEvent, messageId: string) => {
        event.preventDefault();
        const bounds = chatMessagesRef.current?.getBoundingClientRect();
        const maxX = (bounds?.right ?? window.innerWidth) - 180;
        const maxY = (bounds?.bottom ?? window.innerHeight) - 220;

        setContextMenu({
            messageId,
            x: Math.max(8, Math.min(event.clientX, maxX)),
            y: Math.max(8, Math.min(event.clientY, maxY)),
        });
    };

    const contextTarget = contextMenu ? resolveMessageById(contextMenu.messageId) : null;
    const targetPinned = contextTarget ? pinnedIds.includes(contextTarget.id) : false;
    const targetIsLocal = contextTarget ? isLocalMessage(contextTarget) : false;

    const renderMessage = (msg: RenderMessage) => {
        const pinned = pinnedIds.includes(msg.id);
        const gifUrl = extractGifUrl(msg.body);
        const textBody = getTextWithoutGif(msg.body, gifUrl);
        const reactions = reactionsByMessage[msg.id] ?? [];
        const attachments = "attachments" in msg ? msg.attachments ?? [] : [];

        return (
            <article
                key={msg.id}
                className={`chat-message ${pinned ? "pinned" : ""}`}
                onContextMenu={(event) => openContextMenu(event, msg.id)}
            >
                <div className="message-avatar">
                    <span>{msg.avatar || msg.author.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="message-content">
                    <div className="message-header">
                        <span className="message-author">{msg.author}</span>
                        <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                        {pinned && (
                            <span className="message-pin-tag">
                                <PinFilledIcon />
                                Pinned
                            </span>
                        )}
                    </div>
                    {textBody && <p className="message-body">{textBody}</p>}

                    {gifUrl && (
                        <div className="message-gif-wrap">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={gifUrl} alt="GIF attachment" className="message-gif" loading="lazy" />
                        </div>
                    )}

                    {attachments.length > 0 && (
                        <div className="message-attachments">
                            {attachments.map((attachment) => {
                                const isImage = attachment.mime.startsWith("image/");

                                if (isImage) {
                                    return (
                                        <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            download={attachment.name}
                                            className="attachment-image-card"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={attachment.url} alt={attachment.name} className="attachment-image" />
                                            <span className="attachment-image-meta">{attachment.name}</span>
                                        </a>
                                    );
                                }

                                return (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        download={attachment.name}
                                        className="attachment-file"
                                    >
                                        <span className="attachment-file-name">{attachment.name}</span>
                                        <span className="attachment-file-size">{toFileSizeLabel(attachment.size)}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {reactions.length > 0 && (
                        <div className="message-reactions">
                            {reactions.map((emoji) => (
                                <span key={`${msg.id}-${emoji}`} className="reaction-pill">
                                    {emoji}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <MessageActions />
            </article>
        );
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
                    <button
                        type="button"
                        className={`header-action-btn ${showPinnedOnly ? "active" : ""}`}
                        title="Show pinned messages"
                        onClick={() => setShowPinnedOnly((value) => !value)}
                    >
                        <PinIcon />
                    </button>
                    <button
                        type="button"
                        className={`header-action-btn ${searchOpen ? "active" : ""}`}
                        title="Search messages"
                        onClick={() =>
                            setSearchOpen((value) => {
                                const next = !value;
                                if (!next) {
                                    setSearchQuery("");
                                }
                                return next;
                            })
                        }
                    >
                        <SearchIcon />
                    </button>
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
            {searchOpen && (
                <div className="chat-search-row">
                    <input
                        type="text"
                        className="chat-search-input"
                        placeholder="Search in this channel..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </div>
            )}
            {showPinnedOnly && (
                <div className="chat-info-pill">
                    Showing pinned messages {pinnedCount > 0 ? `(${pinnedCount})` : ""}
                </div>
            )}

            {/* Messages */}
            <div className="chat-messages" ref={chatMessagesRef}>
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

                {visibleMessages.length === 0 && (
                    <div className="chat-empty-state">
                        {showPinnedOnly
                            ? "No pinned messages yet. Right-click a message to pin it."
                            : "No messages match your search."}
                    </div>
                )}

                {visibleMessages.length > 0 && (
                    <Virtuoso
                        className="chat-virtual-list"
                        data={visibleMessages}
                        increaseViewportBy={320}
                        atBottomStateChange={setIsAtBottom}
                        followOutput={isAtBottom ? "smooth" : false}
                        itemContent={(_, msg) => renderMessage(msg)}
                    />
                )}
            </div>

            {/* Input bar */}
            <div className="chat-input-container">
                <form className="chat-input-bar" onSubmit={handleSubmit}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="chat-upload-input"
                        onChange={handleUploadSelection}
                        multiple
                    />
                    <button type="button" className="input-action-btn" title="Upload files" disabled={!canSend} onClick={handleUploadClick}>
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
                        disabled={!canSend}
                    />
                    <div className="input-right-actions">
                        <button
                            type="button"
                            className={`input-action-btn ${gifPickerOpen ? "active" : ""}`}
                            title="Send GIF"
                            disabled={!canSend}
                            onClick={() => {
                                setEmojiPickerOpen(false);
                                setGifError(null);
                                setGifPickerOpen((value) => !value);
                            }}
                        >
                            <GifIcon />
                        </button>
                        <button
                            type="button"
                            className={`input-action-btn ${emojiPickerOpen ? "active" : ""}`}
                            title="Emoji"
                            disabled={!canSend}
                            onClick={() => {
                                setGifPickerOpen(false);
                                setEmojiPickerOpen((value) => !value);
                            }}
                        >
                            <EmojiIcon />
                        </button>
                        {gifPickerOpen && (
                            <form className="gif-picker" onSubmit={handleGifSubmit}>
                                <input
                                    type="url"
                                    className="gif-picker-input"
                                    value={gifDraft}
                                    onChange={(event) => {
                                        setGifDraft(event.target.value);
                                        if (gifError) {
                                            setGifError(null);
                                        }
                                    }}
                                    placeholder="https://.../clip.gif"
                                />
                                <div className="gif-picker-actions">
                                    <button
                                        type="button"
                                        className="gif-picker-cancel"
                                        onClick={() => {
                                            setGifPickerOpen(false);
                                            setGifDraft("");
                                            setGifError(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="gif-picker-submit">
                                        Send GIF
                                    </button>
                                </div>
                                {gifError && <p className="gif-picker-error">{gifError}</p>}
                            </form>
                        )}
                        {emojiPickerOpen && (
                            <div className="emoji-picker">
                                {EMOJI_SET.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className="emoji-option"
                                        onClick={() => {
                                            setInputValue((value) => `${value}${emoji}`);
                                            setEmojiPickerOpen(false);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {contextMenu && contextTarget && (
                <div
                    className="chat-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    role="menu"
                    aria-label="Message actions"
                >
                    <button
                        type="button"
                        className="context-menu-item"
                        role="menuitem"
                        onClick={() => {
                            togglePinnedMessage(contextTarget.id);
                            setContextMenu(null);
                        }}
                    >
                        {targetPinned ? "Unpin message" : "Pin message"}
                    </button>
                    <button
                        type="button"
                        className="context-menu-item"
                        role="menuitem"
                        onClick={async () => {
                            await navigator.clipboard.writeText(contextTarget.body);
                            setContextMenu(null);
                        }}
                    >
                        Copy text
                    </button>
                    <div className="context-menu-divider" />
                    <div className="context-menu-reactions">
                        {QUICK_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className="context-reaction-btn"
                                role="menuitem"
                                onClick={() => {
                                    addReaction(contextTarget.id, emoji);
                                    setContextMenu(null);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {targetIsLocal && (
                        <>
                            <div className="context-menu-divider" />
                            <button
                                type="button"
                                className="context-menu-item danger"
                                role="menuitem"
                                onClick={() => {
                                    handleLocalDelete(contextTarget.id);
                                    setContextMenu(null);
                                }}
                            >
                                Delete local upload
                            </button>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
