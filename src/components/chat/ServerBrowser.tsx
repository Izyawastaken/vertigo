"use client";

import { useState, useCallback, useRef, useEffect, type FormEvent } from "react";
import type { Server } from "@/types/chat";

type ServerBrowserProps = {
    servers: Server[];
    activeServerId: string | null;
    onServerSelect: (id: string) => void;
    onCreateServer: (label: string) => void;
};

export function ServerBrowser({
    servers,
    activeServerId,
    onServerSelect,
    onCreateServer,
}: ServerBrowserProps) {
    const [expanded, setExpanded] = useState(false);
    const [showItems, setShowItems] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [draftName, setDraftName] = useState("");
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
    }, []);

    /* 750ms hover to open */
    const handleNotchEnter = useCallback(() => {
        if (expanded) return;
        clearTimer();
        hoverTimer.current = setTimeout(() => setExpanded(true), 750);
    }, [clearTimer, expanded]);

    const handleNotchLeave = useCallback(() => {
        clearTimer();
    }, [clearTimer]);

    /* Click toggle */
    const handleNotchClick = useCallback(() => {
        clearTimer();
        if (!expanded) setExpanded(true);
    }, [clearTimer, expanded]);

    /* After container finishes expanding, pop in items */
    useEffect(() => {
        if (!expanded) return;
        const t = setTimeout(() => setShowItems(true), 450);
        return () => clearTimeout(t);
    }, [expanded]);

    /* Escape key */
    useEffect(() => {
        if (!expanded) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowItems(false);
                setCreateOpen(false);
                setTimeout(() => setExpanded(false), 100);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [expanded]);

    const handleClose = useCallback(() => {
        setShowItems(false);
        setCreateOpen(false);
        setDraftName("");
        setTimeout(() => setExpanded(false), 100);
    }, []);

    const handleSelect = useCallback(
        (id: string) => {
            onServerSelect(id);
            setShowItems(false);
            setCreateOpen(false);
            setDraftName("");
            setTimeout(() => setExpanded(false), 150);
        },
        [onServerSelect]
    );

    const handleCreateServer = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const label = draftName.trim();
        if (!label) {
            return;
        }

        onCreateServer(label);
        setCreateOpen(false);
        setDraftName("");
        setShowItems(false);
        setTimeout(() => setExpanded(false), 150);
    }, [draftName, onCreateServer]);

    return (
        <div
            className={`server-container ${expanded ? "expanded" : ""}`}
            style={{
                width: expanded ? "100vw" : "64px",
                height: expanded ? "100vh" : "22px",
                borderRadius: expanded ? "0px" : "0 0 10px 10px",
            }}
        >
            {/* Notch click zone (only when collapsed) */}
            {!expanded && (
                <button
                    className="server-notch-trigger"
                    onClick={handleNotchClick}
                    onMouseEnter={handleNotchEnter}
                    onMouseLeave={handleNotchLeave}
                    aria-label="Browse servers"
                >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="notch-arrow-icon">
                        <path d="M3 5.5L7 9.5L11 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}

            {/* Expanded content */}
            {expanded && (
                <div className={`server-container-content ${showItems ? "visible" : ""}`}>
                    <h2 className="server-container-title">Servers</h2>
                    <p className="server-container-subtitle">Select a server to jump in</p>

                    <div className="server-container-grid">
                        {servers.map((server, i) => {
                            const active = server.id === activeServerId;
                            return (
                                <button
                                    key={server.id}
                                    className={`server-grid-item ${active ? "active" : ""} ${showItems ? "pop-in" : ""}`}
                                    onClick={() => handleSelect(server.id)}
                                    style={{ animationDelay: showItems ? `${i * 80}ms` : "0ms" }}
                                >
                                    <div className="server-grid-circle">
                                        <span>{server.badge}</span>
                                    </div>
                                    <span className="server-grid-label">{server.label}</span>
                                </button>
                            );
                        })}

                        {/* Add server placeholder */}
                        <button
                            className={`server-grid-item add-server ${showItems ? "pop-in" : ""}`}
                            style={{ animationDelay: showItems ? `${servers.length * 80}ms` : "0ms" }}
                            onClick={() => setCreateOpen(true)}
                        >
                            <div className="server-grid-circle add">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <span className="server-grid-label">Add Server</span>
                        </button>
                    </div>
                    {createOpen && (
                        <form className="server-create-panel" onSubmit={handleCreateServer}>
                            <input
                                type="text"
                                className="server-create-input"
                                placeholder="Server name"
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
                            />
                            <div className="server-create-actions">
                                <button
                                    type="button"
                                    className="server-create-cancel"
                                    onClick={() => {
                                        setCreateOpen(false);
                                        setDraftName("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="server-create-submit">
                                    Create Server
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Bottom close arrow */}
                    <button className="server-close-btn" onClick={handleClose} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                            <path d="M3 8.5L7 4.5L11 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
