export type ChannelType = "text" | "voice";
export type MemberStatus = "online" | "idle" | "dnd" | "offline";

export type Server = {
  id: string;
  label: string;
  badge: string;
  color: string;
  position: number;
};

export type Channel = {
  id: string;
  serverId: string;
  name: string;
  topic: string;
  category: string;
  type: ChannelType;
  position: number;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  author: string;
  avatar: string;
  body: string;
  createdAt: number;
};

export type Member = {
  id: string;
  name: string;
  status: MemberStatus;
  role: string;
  roleColor: string;
};

export type ChatBootstrap = {
  servers: Server[];
  members: Member[];
  activeServerId: string | null;
  channels: Channel[];
  activeChannelId: string | null;
  messages: ChatMessage[];
};

export type CreateServerResult = {
  server: Server;
  initialChannel: Channel;
};

export type CreateChannelDraft = {
  name: string;
  topic?: string;
  category?: string;
  type?: ChannelType;
};

export const STATUS_COLOR: Record<MemberStatus, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

export const EMPTY_CHANNEL: Channel = {
  id: "",
  serverId: "",
  name: "channel",
  topic: "No topic set for this channel yet.",
  category: "",
  type: "text",
  position: 0,
};
