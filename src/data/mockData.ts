export type ServerId = "vertigo" | "engineering" | "community" | "builds";

export type Server = {
    id: ServerId;
    label: string;
    badge: string;
    color: string;
};

export type Channel = {
    id: string;
    name: string;
    topic: string;
    category: string;
    type: "text" | "voice";
};

export type ChatMessage = {
    id: string;
    author: string;
    avatar: string;
    time: string;
    body: string;
};

export type Member = {
    id: string;
    name: string;
    status: "online" | "idle" | "dnd" | "offline";
    role: string;
    roleColor: string;
};

export const SERVERS: Server[] = [
    { id: "vertigo", label: "Vertigo", badge: "VG", color: "#ffffff" },
    { id: "engineering", label: "Engineering", badge: "EN", color: "#d0d0d0" },
    { id: "community", label: "Community", badge: "CM", color: "#b0b0b0" },
    { id: "builds", label: "Build Lab", badge: "BL", color: "#909090" },
];

export const CHANNELS_BY_SERVER: Record<ServerId, Channel[]> = {
    vertigo: [
        { id: "announcements", name: "announcements", topic: "Roadmap drops and release notes.", category: "Information", type: "text" },
        { id: "general-chat", name: "general-chat", topic: "Day-to-day team chat.", category: "Text Channels", type: "text" },
        { id: "off-topic", name: "off-topic", topic: "Anything goes.", category: "Text Channels", type: "text" },
        { id: "voice-lobby", name: "voice-lobby", topic: "Quick standups.", category: "Voice Channels", type: "voice" },
        { id: "music", name: "music", topic: "Share what you're listening to.", category: "Voice Channels", type: "voice" },
    ],
    engineering: [
        { id: "frontend", name: "frontend", topic: "Client-side architecture and UX work.", category: "Development", type: "text" },
        { id: "backend", name: "backend", topic: "P2P relay, sync, and API design.", category: "Development", type: "text" },
        { id: "devops", name: "devops", topic: "Build pipelines and release automation.", category: "Infrastructure", type: "text" },
        { id: "code-review", name: "code-review", topic: "PR reviews and feedback.", category: "Development", type: "text" },
    ],
    community: [
        { id: "introductions", name: "introductions", topic: "Meet new contributors.", category: "Welcome", type: "text" },
        { id: "showcase", name: "showcase", topic: "Share experiments and demos.", category: "Creative", type: "text" },
        { id: "feedback", name: "feedback", topic: "Collect product feedback.", category: "Creative", type: "text" },
    ],
    builds: [
        { id: "nightly", name: "nightly", topic: "Nightly artifacts and regressions.", category: "CI/CD", type: "text" },
        { id: "qa-triage", name: "qa-triage", topic: "Triage bugs from validation runs.", category: "CI/CD", type: "text" },
        { id: "release-room", name: "release-room", topic: "Cut and track releases.", category: "Releases", type: "text" },
    ],
};

export const CHAT_BY_CHANNEL: Record<string, ChatMessage[]> = {
    announcements: [
        { id: "a1", author: "Aria", avatar: "AR", time: "Today at 9:02 AM", body: "Welcome to the new workspace shell. Keep feedback short and direct." },
        { id: "a2", author: "Jules", avatar: "JU", time: "Today at 9:04 AM", body: "Intro transition feels great. The post-intro layout now reads much cleaner." },
        { id: "a3", author: "Noor", avatar: "NO", time: "Today at 9:08 AM", body: "Next step is wiring these placeholders to live channels from the peer mesh." },
    ],
    "general-chat": [
        { id: "g1", author: "Mira", avatar: "MI", time: "Today at 10:12 AM", body: "Anyone up for a quick sync on chat persistence later today?" },
        { id: "g2", author: "Sam", avatar: "SA", time: "Today at 10:14 AM", body: "Yep, I can review the local-first strategy after lunch." },
        { id: "g3", author: "Aria", avatar: "AR", time: "Today at 10:18 AM", body: "I added a rough channel schema doc in #announcements. Take a look when you get a chance." },
        { id: "g4", author: "Noor", avatar: "NO", time: "Today at 10:22 AM", body: "On it. Also pushed the new WebRTC relay config — should cut reconnection time by half." },
        { id: "g5", author: "Mira", avatar: "MI", time: "Today at 10:30 AM", body: "Nice! Let me know if you need help load-testing the relay." },
    ],
    "off-topic": [
        { id: "ot1", author: "Sam", avatar: "SA", time: "Today at 11:30 AM", body: "Anyone else tried that new mechanical keyboard with the hall-effect switches?" },
        { id: "ot2", author: "Jules", avatar: "JU", time: "Today at 11:32 AM", body: "I've been using one for a week. The actuation is insanely smooth." },
    ],
    "voice-lobby": [
        { id: "v1", author: "Noor", avatar: "NO", time: "Today at 11:01 AM", body: "Voice test room is open. Latency sits around 35ms." },
        { id: "v2", author: "Jules", avatar: "JU", time: "Today at 11:04 AM", body: "Joining now. Let's test screen-share fallback after this call." },
    ],
    music: [
        { id: "mu1", author: "Mira", avatar: "MI", time: "Today at 2:00 PM", body: "🎵 Currently vibing to Tycho — Dive" },
    ],
    frontend: [
        { id: "f1", author: "Mira", avatar: "MI", time: "Today at 8:31 AM", body: "I swapped the heavy dashboard for this lighter Discord-style base." },
        { id: "f2", author: "Sam", avatar: "SA", time: "Today at 8:42 AM", body: "Looks good. The hierarchy is clearer and way easier to extend." },
        { id: "f3", author: "Mira", avatar: "MI", time: "Today at 8:55 AM", body: "Next up: micro-animations on hover states. Should feel alive." },
    ],
    backend: [
        { id: "b1", author: "Noor", avatar: "NO", time: "Today at 7:50 AM", body: "Peer routing logs are stable after the reconnection patch." },
        { id: "b2", author: "Aria", avatar: "AR", time: "Today at 8:03 AM", body: "Perfect, I'll hook this UI to the route stream once schema is final." },
    ],
    devops: [
        { id: "d1", author: "Jules", avatar: "JU", time: "Today at 6:23 AM", body: "Nightly pipeline finished in 6m 12s, no failed checks." },
        { id: "d2", author: "Sam", avatar: "SA", time: "Today at 6:30 AM", body: "I trimmed one Docker stage, that cut around 40 seconds." },
    ],
    "code-review": [
        { id: "cr1", author: "Aria", avatar: "AR", time: "Today at 9:45 AM", body: "PR #142 is ready for review — refactors the message serialization layer." },
    ],
    introductions: [
        { id: "i1", author: "Lena", avatar: "LE", time: "Yesterday at 3:15 PM", body: "Hi everyone! Joining from product design. Super excited to contribute." },
    ],
    showcase: [
        { id: "s1", author: "Rook", avatar: "RO", time: "Today at 1:00 PM", body: "Posted a hover prototype for the new voice controls. Check it out!" },
    ],
    feedback: [
        { id: "fb1", author: "Quinn", avatar: "QU", time: "Today at 4:20 PM", body: "Could we add unread badges on collapsed channel groups?" },
    ],
    nightly: [
        { id: "n1", author: "CI Bot", avatar: "CI", time: "Today at 1:22 AM", body: "✅ Nightly build succeeded on Windows, macOS, and Linux." },
    ],
    "qa-triage": [
        { id: "q1", author: "Mira", avatar: "MI", time: "Today at 2:10 AM", body: "Two regressions opened for audio reconnect edge cases." },
    ],
    "release-room": [
        { id: "r1", author: "Aria", avatar: "AR", time: "Today at 3:33 AM", body: "Release 0.3.0 target remains Friday pending QA closeout." },
    ],
};

export const MEMBERS: Member[] = [
    { id: "m1", name: "Aria", status: "online", role: "Lead", roleColor: "#ffffff" },
    { id: "m2", name: "Noor", status: "online", role: "Engineer", roleColor: "#d0d0d0" },
    { id: "m3", name: "Sam", status: "idle", role: "Moderator", roleColor: "#b0b0b0" },
    { id: "m4", name: "Mira", status: "online", role: "Design", roleColor: "#c8c8c8" },
    { id: "m5", name: "Jules", status: "dnd", role: "QA", roleColor: "#a0a0a0" },
    { id: "m6", name: "Lena", status: "offline", role: "Designer", roleColor: "#c8c8c8" },
    { id: "m7", name: "Rook", status: "online", role: "Engineer", roleColor: "#d0d0d0" },
    { id: "m8", name: "Quinn", status: "offline", role: "Community", roleColor: "#909090" },
];

export const STATUS_COLOR: Record<Member["status"], string> = {
    online: "#23a55a",
    idle: "#f0b232",
    dnd: "#f23f43",
    offline: "#80848e",
};

export const FALLBACK_CHANNEL: Channel = {
    id: "",
    name: "channel",
    topic: "No topic",
    category: "",
    type: "text",
};
