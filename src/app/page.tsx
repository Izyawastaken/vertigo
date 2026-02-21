"use client";

import { useState } from "react";
import { AppIntro } from "@/components/intro/AppIntro";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f1622] text-[#d8c9b0]">
      {!introDone && <AppIntro onComplete={() => setIntroDone(true)} />}
      <section
        className={`flex min-h-screen items-center justify-center transition-opacity duration-500 ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="px-6 text-center">
          <h1 className="text-4xl font-semibold uppercase tracking-[0.24em] sm:text-6xl">
            Vertigo
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm tracking-[0.04em] text-[#d8c9b0]/75 sm:text-base">
            A peer-to-peer Discord alternative, packaged with Tauri and powered by Next.js.
          </p>
        </div>
      </section>
    </main>
  );
}
