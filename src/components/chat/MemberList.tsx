"use client";

import { type Member, STATUS_COLOR } from "@/data/mockData";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type MemberListProps = {
    members: Member[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** When true, no overlay is rendered and mouse events keep the panel alive */
    isHoverMode?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

export function MemberList({
    members,
    open,
    onOpenChange,
    isHoverMode = false,
    onMouseEnter,
    onMouseLeave,
}: MemberListProps) {
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
        <Sheet open={open} onOpenChange={onOpenChange} modal={!isHoverMode}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="member-sheet-content"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <SheetHeader className="px-4 pt-4 pb-2">
                    <SheetTitle className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        Members — {members.length}
                    </SheetTitle>
                </SheetHeader>

                <div className="member-sheet-inner">
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
            </SheetContent>
        </Sheet>
    );
}
