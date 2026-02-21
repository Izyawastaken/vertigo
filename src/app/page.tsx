"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AppIntro } from "@/components/intro/AppIntro";
import { ServerRail } from "@/components/chat/ServerRail";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { MemberList } from "@/components/chat/MemberList";
import {
  SERVERS,
  CHANNELS_BY_SERVER,
  CHAT_BY_CHANNEL,
  MEMBERS,
  FALLBACK_CHANNEL,
  type ServerId,
} from "@/data/mockData";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [activeServerId, setActiveServerId] = useState<ServerId>(SERVERS[0].id);
  const [activeChannelId, setActiveChannelId] = useState(
    CHANNELS_BY_SERVER[SERVERS[0].id][0]?.id ?? ""
  );

  /* ── Member panel: pinned (button toggle) vs hover (glance) ── */
  const [membersPinned, setMembersPinned] = useState(false);
  const [membersHover, setMembersHover] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const membersOpen = membersPinned || membersHover;
  const isHoverMode = membersHover && !membersPinned;

  /** Clear any pending dismiss timer */
  const clearDismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  /** Schedule a dismiss after `ms` (only for hover mode) */
  const scheduleDismiss = useCallback(
    (ms: number) => {
      clearDismiss();
      dismissTimer.current = setTimeout(() => {
        setMembersHover(false);
        dismissTimer.current = null;
      }, ms);
    },
    [clearDismiss]
  );

  /* Toggle button in header */
  const handleToggleMembers = useCallback(() => {
    clearDismiss();
    setMembersPinned((v) => !v);
    setMembersHover(false);
  }, [clearDismiss]);

  /* Right-edge hover trigger */
  const handleTriggerEnter = useCallback(() => {
    if (membersPinned) return;
    clearDismiss();
    /* Small delay so a quick accidental brush doesn't open the panel */
    dismissTimer.current = setTimeout(() => {
      setMembersHover(true);
      dismissTimer.current = null;
    }, 200);
  }, [membersPinned, clearDismiss]);

  const handleTriggerLeave = useCallback(() => {
    if (membersPinned) return;
    /* If panel isn't open yet (still in the 200ms open delay), just cancel */
    clearDismiss();
    /* Give time to move mouse into the sheet */
    scheduleDismiss(500);
  }, [membersPinned, clearDismiss, scheduleDismiss]);

  /* Mouse enters/leaves the sheet content itself */
  const handleSheetEnter = useCallback(() => {
    clearDismiss();
  }, [clearDismiss]);

  const handleSheetLeave = useCallback(() => {
    if (membersPinned) return;
    scheduleDismiss(400);
  }, [membersPinned, scheduleDismiss]);

  /* Sheet's own onOpenChange (e.g. pressing Escape) */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        clearDismiss();
        setMembersPinned(false);
        setMembersHover(false);
      }
    },
    [clearDismiss]
  );

  /* ── Standard routing state ── */
  const activeServer = useMemo(
    () => SERVERS.find((s) => s.id === activeServerId) ?? SERVERS[0],
    [activeServerId]
  );

  const channels = CHANNELS_BY_SERVER[activeServerId];

  const activeChannel = useMemo(
    () =>
      channels.find((c) => c.id === activeChannelId) ??
      channels[0] ??
      FALLBACK_CHANNEL,
    [activeChannelId, channels]
  );

  const messages = CHAT_BY_CHANNEL[activeChannel.id] ?? [];

  const handleServerSelect = (serverId: ServerId) => {
    setActiveServerId(serverId);
    const first = CHANNELS_BY_SERVER[serverId][0];
    if (first) setActiveChannelId(first.id);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {introDone && (
        <>
          <div className="app-shell">
            <ServerRail
              servers={SERVERS}
              activeServerId={activeServerId}
              onServerSelect={handleServerSelect}
            />
            <ChannelSidebar
              server={activeServer}
              channels={channels}
              activeChannelId={activeChannel.id}
              onChannelSelect={setActiveChannelId}
            />
            <ChatArea
              channel={activeChannel}
              messages={messages}
              showMembers={membersPinned}
              onToggleMembers={handleToggleMembers}
            />
          </div>

          {/* Right-edge hover trigger for glancing at member list */}
          {!membersPinned && !membersHover && (
            <div
              className="member-hover-trigger"
              onMouseEnter={handleTriggerEnter}
              onMouseLeave={handleTriggerLeave}
            />
          )}

          <MemberList
            members={MEMBERS}
            open={membersOpen}
            onOpenChange={handleOpenChange}
            isHoverMode={isHoverMode}
            onMouseEnter={handleSheetEnter}
            onMouseLeave={handleSheetLeave}
          />
        </>
      )}

      {!introDone && <AppIntro onComplete={() => setIntroDone(true)} />}
    </main>
  );
}
