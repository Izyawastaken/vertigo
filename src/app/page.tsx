"use client";

import { useMemo, useState } from "react";
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
  const [showMembers, setShowMembers] = useState(true);

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
        <div className={`app-shell ${showMembers ? "with-members" : ""}`}>
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
            showMembers={showMembers}
            onToggleMembers={() => setShowMembers((v) => !v)}
          />
          {showMembers && <MemberList members={MEMBERS} />}
        </div>
      )}

      {!introDone && <AppIntro onComplete={() => setIntroDone(true)} />}
    </main>
  );
}
