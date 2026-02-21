"use client";

import { type Member, STATUS_COLOR } from "@/data/mockData";

type MemberListProps = {
    members: Member[];
};

export function MemberList({ members }: MemberListProps) {
    /* Group members by status order: online, idle, dnd, offline */
    const statusOrder: Member["status"][] = ["online", "idle", "dnd", "offline"];
    const statusLabels: Record<Member["status"], string> = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline",
    };

    const groups = statusOrder
        .map((status) => ({
            status,
            label: statusLabels[status],
            members: members.filter((m) => m.status === status),
        }))
        .filter((g) => g.members.length > 0);

    return (
        <aside className="member-list">
            <div className="member-list-inner">
                {groups.map((group) => (
                    <div key={group.status} className="member-group">
                        <h3 className="member-group-title">
                            {group.label} — {group.members.length}
                        </h3>
                        {group.members.map((member) => (
                            <div key={member.id} className="member-item">
                                <div className="member-avatar">
                                    <span>{member.name.charAt(0)}</span>
                                    <span
                                        className="member-status-dot"
                                        style={{ backgroundColor: STATUS_COLOR[member.status] }}
                                    />
                                </div>
                                <div className="member-info">
                                    <p className="member-name" style={{ color: member.roleColor }}>
                                        {member.name}
                                    </p>
                                    <p className="member-role">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </aside>
    );
}
