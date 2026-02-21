"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { type Server, type ServerId } from "@/data/mockData";

type ServerBrowserProps = {
    servers: Server[];
    activeServerId: ServerId;
    onServerSelect: (id: ServerId) => void;
};

export function ServerBrowser({ servers, activeServerId, onServerSelect }: ServerBrowserProps) {
    const [open, setOpen] = useState(false);
    const [showItems, setShowItems] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
    }, []);

    /* 750ms hover delay */
    const handleNotchEnter = useCallback(() => {
        clearTimer();
        hoverTimer.current = setTimeout(() => {
            setOpen(true);
        }, 750);
    }, [clearTimer]);

    const handleNotchLeave = useCallback(() => {
        clearTimer();
    }, [clearTimer]);

    /* Click = instant toggle */
    const handleNotchClick = useCallback(() => {
        clearTimer();
        setOpen((v) => !v);
    }, [clearTimer]);

    /* After the white expand animation finishes, pop in the items */
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setShowItems(true), 350);
            return () => clearTimeout(t);
        } else {
            setShowItems(false);
        }
    }, [open]);

    const handleSelect = useCallback(
        (id: ServerId) => {
            onServerSelect(id);
            setShowItems(false);
            setTimeout(() => setOpen(false), 150);
        },
        [onServerSelect]
    );

    const handleClose = useCallback(() => {
        setShowItems(false);
        setTimeout(() => setOpen(false), 100);
    }, []);

    return (
        <>
            {/* Notch pill */}
            <button
                className={`server-notch ${open ? "expanded" : ""}`}
                onClick={handleNotchClick}
                onMouseEnter={handleNotchEnter}
                onMouseLeave={handleNotchLeave}
                aria-label="Browse servers"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="notch-arrow"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <path
                        d="M3 5.5L7 9.5L11 5.5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Expanding white overlay */}
            <div className={`server-expand-overlay ${open ? "open" : ""}`}>
                {/* Close zone — clicking outside content closes */}
                <div className="server-expand-backdrop" onClick={handleClose} />

                <div className={`server-expand-content ${showItems ? "visible" : ""}`}>
                    <h2 className="server-expand-title">Servers</h2>
                    <p className="server-expand-subtitle">Select a server to jump in</p>

                    <div className="server-expand-grid">
                        {servers.map((server, i) => {
                            const active = server.id === activeServerId;
                            return (
                                <button
                                    key={server.id}
                                    className={`server-expand-item ${active ? "active" : ""} ${showItems ? "pop-in" : ""}`}
                                    onClick={() => handleSelect(server.id)}
                                    style={{ animationDelay: showItems ? `${i * 80}ms` : "0ms" }}
                                >
                                    <div className="server-expand-circle">
                                        <span>{server.badge}</span>
                                    </div>
                                    <span className="server-expand-label">{server.label}</span>
                                </button>
                            );
                        })}

                        {/* Add server */}
                        <button
                            className={`server-expand-item add-server ${showItems ? "pop-in" : ""}`}
                            style={{ animationDelay: showItems ? `${servers.length * 80}ms` : "0ms" }}
                        >
                            <div className="server-expand-circle add">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <span className="server-expand-label">Add Server</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
