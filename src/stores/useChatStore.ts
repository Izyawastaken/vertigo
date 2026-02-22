"use client";

import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type {
  Channel,
  ChatBootstrap,
  ChatMessage,
  CreateChannelDraft,
  CreateServerResult,
  Member,
  Server,
} from "@/types/chat";

type ChatState = {
  initialized: boolean;
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
  introDone: boolean;
  servers: Server[];
  members: Member[];
  channelsByServer: Record<string, Channel[]>;
  messagesByChannel: Record<string, ChatMessage[]>;
  activeServerId: string | null;
  activeChannelId: string | null;
  membersPinned: boolean;
  membersHover: boolean;
  setIntroDone: (value: boolean) => void;
  setMembersPinned: (value: boolean) => void;
  setMembersHover: (value: boolean) => void;
  initialize: () => Promise<void>;
  selectServer: (serverId: string) => Promise<void>;
  selectChannel: (channelId: string) => Promise<void>;
  createServer: (label: string) => Promise<void>;
  createChannel: (draft: CreateChannelDraft) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
};

type BackendError = {
  message?: string;
};

const tauriWindow = (): Window & { __TAURI_INTERNALS__?: unknown } =>
  window as Window & { __TAURI_INTERNALS__?: unknown };

const hasTauriRuntime = () =>
  typeof window !== "undefined" && Boolean(tauriWindow().__TAURI_INTERNALS__);

const toErrorMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const backendError = error as BackendError;
    if (backendError.message) {
      return backendError.message;
    }
  }

  return "Unknown error";
};

const callBackend = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> => {
  if (!hasTauriRuntime()) {
    throw new Error(
      "Tauri runtime not detected. Start with `npm run tauri:dev` to use the SQLite chat backend."
    );
  }

  return invoke<T>(command, args);
};

export const useChatStore = create<ChatState>((set, get) => ({
  initialized: false,
  loading: false,
  sendingMessage: false,
  error: null,
  introDone: false,
  servers: [],
  members: [],
  channelsByServer: {},
  messagesByChannel: {},
  activeServerId: null,
  activeChannelId: null,
  membersPinned: false,
  membersHover: false,

  setIntroDone: (value) => set({ introDone: value }),
  setMembersPinned: (value) =>
    set((state) => ({
      membersPinned: value,
      membersHover: value ? false : state.membersHover,
    })),
  setMembersHover: (value) =>
    set((state) => (state.membersPinned ? state : { membersHover: value })),

  initialize: async () => {
    if (get().initialized || get().loading) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const payload = await callBackend<ChatBootstrap>("chat_bootstrap");

      set({
        initialized: true,
        loading: false,
        error: null,
        servers: payload.servers,
        members: payload.members,
        activeServerId: payload.activeServerId,
        activeChannelId: payload.activeChannelId,
        channelsByServer: payload.activeServerId
          ? { [payload.activeServerId]: payload.channels }
          : {},
        messagesByChannel: payload.activeChannelId
          ? { [payload.activeChannelId]: payload.messages }
          : {},
      });
    } catch (error) {
      set({
        loading: false,
        initialized: false,
        error: toErrorMessage(error),
      });
    }
  },

  selectServer: async (serverId) => {
    const state = get();

    if (state.activeServerId === serverId && state.activeChannelId) {
      return;
    }

    set({ activeServerId: serverId, error: null });

    try {
      let channels = get().channelsByServer[serverId];

      if (!channels) {
        channels = await callBackend<Channel[]>("list_channels", {
          input: { serverId },
        });
      }

      const nextChannelId = channels[0]?.id ?? null;
      set((current) => ({
        channelsByServer: {
          ...current.channelsByServer,
          [serverId]: channels,
        },
        activeServerId: serverId,
        activeChannelId: nextChannelId,
      }));

      if (nextChannelId) {
        await get().selectChannel(nextChannelId);
      }
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  selectChannel: async (channelId) => {
    set({ activeChannelId: channelId, error: null });

    if (get().messagesByChannel[channelId]) {
      return;
    }

    try {
      const messages = await callBackend<ChatMessage[]>("list_messages", {
        input: { channelId },
      });

      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages,
        },
      }));
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  createServer: async (label) => {
    const serverLabel = label.trim();
    if (!serverLabel) {
      return;
    }

    try {
      const payload = await callBackend<CreateServerResult>("create_server", {
        input: { label: serverLabel },
      });

      set((state) => ({
        servers: [...state.servers, payload.server].sort(
          (left, right) => left.position - right.position
        ),
        channelsByServer: {
          ...state.channelsByServer,
          [payload.server.id]: [payload.initialChannel],
        },
        messagesByChannel: {
          ...state.messagesByChannel,
          [payload.initialChannel.id]: [],
        },
        activeServerId: payload.server.id,
        activeChannelId: payload.initialChannel.id,
        error: null,
      }));
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  createChannel: async (draft) => {
    const state = get();
    const serverId = state.activeServerId;

    if (!serverId) {
      return;
    }

    const name = draft.name.trim();
    if (!name) {
      return;
    }

    try {
      const channel = await callBackend<Channel>("create_channel", {
        input: {
          serverId,
          name,
          topic: draft.topic,
          category: draft.category,
          type: draft.type ?? "text",
        },
      });

      set((current) => ({
        channelsByServer: {
          ...current.channelsByServer,
          [serverId]: [
            ...(current.channelsByServer[serverId] ?? []),
            channel,
          ].sort((left, right) => left.position - right.position),
        },
        messagesByChannel: {
          ...current.messagesByChannel,
          [channel.id]: current.messagesByChannel[channel.id] ?? [],
        },
        activeChannelId: channel.id,
        error: null,
      }));
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  sendMessage: async (body) => {
    const channelId = get().activeChannelId;
    const messageBody = body.trim();

    if (!channelId || !messageBody) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `temp-${crypto.randomUUID()}`,
      channelId,
      author: "You",
      avatar: "YO",
      body: messageBody,
      createdAt: Date.now(),
    };

    set((state) => ({
      sendingMessage: true,
      error: null,
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [
          ...(state.messagesByChannel[channelId] ?? []),
          optimisticMessage,
        ],
      },
    }));

    try {
      const message = await callBackend<ChatMessage>("send_message", {
        input: {
          channelId,
          body: messageBody,
          author: "You",
        },
      });

      set((state) => ({
        sendingMessage: false,
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: (state.messagesByChannel[channelId] ?? []).map(
            (candidate) =>
              candidate.id === optimisticMessage.id ? message : candidate
          ),
        },
      }));
    } catch (error) {
      set((state) => ({
        sendingMessage: false,
        error: toErrorMessage(error),
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: (state.messagesByChannel[channelId] ?? []).filter(
            (candidate) => candidate.id !== optimisticMessage.id
          ),
        },
      }));
      throw error;
    }
  },
}));
