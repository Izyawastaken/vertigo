"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { AppIntro } from "@/components/intro/AppIntro";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { MemberList } from "@/components/chat/MemberList";
import { ServerBrowser } from "@/components/chat/ServerBrowser";
import type { CreateChannelDraft } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";

export default function Home() {
  const {
    initialized,
    loading,
    error,
    introDone,
    servers,
    members,
    channelsByServer,
    messagesByChannel,
    activeServerId,
    activeChannelId,
    membersPinned,
    membersHover,
    setIntroDone,
    setMembersPinned,
    setMembersHover,
    initialize,
    selectServer,
    selectChannel,
    createServer,
    createChannel,
    sendMessage,
  } = useChatStore(
    useShallow((state) => ({
      initialized: state.initialized,
      loading: state.loading,
      error: state.error,
      introDone: state.introDone,
      servers: state.servers,
      members: state.members,
      channelsByServer: state.channelsByServer,
      messagesByChannel: state.messagesByChannel,
      activeServerId: state.activeServerId,
      activeChannelId: state.activeChannelId,
      membersPinned: state.membersPinned,
      membersHover: state.membersHover,
      setIntroDone: state.setIntroDone,
      setMembersPinned: state.setMembersPinned,
      setMembersHover: state.setMembersHover,
      initialize: state.initialize,
      selectServer: state.selectServer,
      selectChannel: state.selectChannel,
      createServer: state.createServer,
      createChannel: state.createChannel,
      sendMessage: state.sendMessage,
    }))
  );

  useEffect(() => {
    void initialize();
  }, [initialize]);

  /* ── Member panel: pinned (button toggle) vs hover (glance) ── */
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

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? null,
    [servers, activeServerId]
  );

  const channels = useMemo(
    () => (activeServerId ? channelsByServer[activeServerId] ?? [] : []),
    [channelsByServer, activeServerId]
  );

  const activeChannel = useMemo(() => {
    if (!channels.length) {
      return null;
    }

    return channels.find((channel) => channel.id === activeChannelId) ?? channels[0];
  }, [channels, activeChannelId]);

  const messages = useMemo(
    () => (activeChannel ? messagesByChannel[activeChannel.id] ?? [] : []),
    [messagesByChannel, activeChannel]
  );

  useEffect(() => {
    if (!initialized || activeServerId || !servers[0]) {
      return;
    }

    void selectServer(servers[0].id);
  }, [initialized, activeServerId, servers, selectServer]);

  useEffect(() => {
    if (!activeChannel || activeChannel.id === activeChannelId) {
      return;
    }

    void selectChannel(activeChannel.id);
  }, [activeChannel, activeChannelId, selectChannel]);

  /** Schedule a dismiss after `ms` (only for hover mode) */
  const scheduleDismiss = useCallback(
    (ms: number) => {
      clearDismiss();
      dismissTimer.current = setTimeout(() => {
        setMembersHover(false);
        dismissTimer.current = null;
      }, ms);
    },
    [clearDismiss, setMembersHover]
  );

  /* Toggle button in header */
  const handleToggleMembers = useCallback(() => {
    clearDismiss();
    setMembersPinned(!membersPinned);
    setMembersHover(false);
  }, [clearDismiss, membersPinned, setMembersPinned, setMembersHover]);

  /* Right-edge hover trigger */
  const handleTriggerEnter = useCallback(() => {
    if (membersPinned) return;
    clearDismiss();
    /* Small delay so a quick accidental brush doesn't open the panel */
    dismissTimer.current = setTimeout(() => {
      setMembersHover(true);
      dismissTimer.current = null;
    }, 200);
  }, [membersPinned, clearDismiss, setMembersHover]);

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
    [clearDismiss, setMembersPinned, setMembersHover]
  );

  const handleServerSelect = useCallback(
    (serverId: string) => {
      void selectServer(serverId);
    },
    [selectServer]
  );

  const handleChannelSelect = useCallback(
    (channelId: string) => {
      void selectChannel(channelId);
    },
    [selectChannel]
  );

  const handleCreateServer = useCallback(
    (label: string) => {
      void createServer(label);
    },
    [createServer]
  );

  const handleCreateChannel = useCallback(
    (draft: CreateChannelDraft) => {
      void createChannel(draft);
    },
    [createChannel]
  );

  const handleSendMessage = useCallback(
    async (body: string) => {
      await sendMessage(body);
    },
    [sendMessage]
  );

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {introDone && (
        <>
          {activeServer && (
            <div className="app-shell">
              <ChannelSidebar
                key={activeServer.id}
                server={activeServer}
                channels={channels}
                activeChannelId={activeChannel?.id ?? ""}
                onChannelSelect={handleChannelSelect}
                onCreateChannel={handleCreateChannel}
              />
              <ChatArea
                channel={activeChannel}
                messages={messages}
                showMembers={membersPinned}
                onToggleMembers={handleToggleMembers}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {/* Top-center notch for server browser */}
          <ServerBrowser
            servers={servers}
            activeServerId={activeServerId}
            onServerSelect={handleServerSelect}
            onCreateServer={handleCreateServer}
          />

          {/* Right-edge hover trigger for glancing at member list */}
          {!membersPinned && !membersHover && (
            <div
              className="member-hover-trigger"
              onMouseEnter={handleTriggerEnter}
              onMouseLeave={handleTriggerLeave}
            />
          )}

          <MemberList
            members={members}
            open={membersOpen}
            onOpenChange={handleOpenChange}
            isHoverMode={isHoverMode}
            onMouseEnter={handleSheetEnter}
            onMouseLeave={handleSheetLeave}
          />

          {(loading || error) && (
            <div className="app-status-banner">
              {loading && <span>Syncing workspace...</span>}
              {!loading && error && <span>{error}</span>}
            </div>
          )}
        </>
      )}

      {!introDone && <AppIntro onComplete={() => setIntroDone(true)} />}
    </main>
  );
}
