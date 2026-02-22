"use client";

import type { Server } from "@/types/chat";

/* ── SVG Icons ── */
const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.3 7.7a1 1 0 0 1 0-1.4l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1-1.4 1.4L7 4.4 3.7 7.7a1 1 0 0 1-1.4 0z" transform="translate(5,6) scale(1.1)" opacity="0.9" />
        <path d="M12 4.2l-9 7V20a1 1 0 001 1h5v-6h6v6h5a1 1 0 001-1v-8.8l-9-7z" opacity="0" />
        <path d="M21.5 10.9L12 3.5l-9.5 7.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="8" y="14" width="8" height="7" rx="1" fill="currentColor" opacity="0.2" />
        <rect x="5" y="11" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
);

type ServerRailProps = {
    servers: Server[];
    activeServerId: string | null;
    onServerSelect: (id: string) => void;
};

export function ServerRail({ servers, activeServerId, onServerSelect }: ServerRailProps) {
    return (
        <aside className="server-rail">
            {/* Home / DM button */}
            <button className="server-icon home-icon" title="Direct Messages">
                <HomeIcon />
            </button>

            <div className="rail-separator" />

            {/* Server icons */}
            {servers.map((server) => {
                const active = server.id === activeServerId;
                return (
                    <div key={server.id} className="server-icon-wrapper">
                        {/* Active pill */}
                        <span
                            className="server-pill"
                            style={{
                                height: active ? "40px" : "0px",
                                opacity: active ? 1 : 0,
                            }}
                        />
                        <button
                            onClick={() => onServerSelect(server.id)}
                            className={`server-icon ${active ? "active" : ""}`}
                            title={server.label}
                            style={{
                                "--server-accent": server.color,
                            } as React.CSSProperties}
                        >
                            <span className="server-badge">{server.badge}</span>
                            {active && (
                                <span
                                    className="server-glow"
                                    style={{ backgroundColor: server.color }}
                                />
                            )}
                        </button>

                        {/* Tooltip */}
                        <span className="server-tooltip">{server.label}</span>
                    </div>
                );
            })}
        </aside>
    );
}
