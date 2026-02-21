"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const DROP_MS = 720;
const EXPAND_MS = 620;
const STRIP_IN_MS = 560;
const MARQUEE_HOLD_MS = 950;
const STRIP_OUT_MS = 560;
const STRIP_COUNT = 12;
const MAX_ROW_DELAY_MS = 96;
const BASE_FADE_OUT_MS = 120;
const COMPLETE_BUFFER_MS = 120;

type IntroPhase = "pre-drop" | "drop" | "expand" | "marquee" | "out";
const INTRO_BLUE = "#0f1622";
const INTRO_LIGHT = "#d8c9b0";

function getRowDelayMs(stripIndex: number): number {
    return ((stripIndex * 37) % 9) * 12;
}

export function AppIntro({ onComplete, onOutStart }: { onComplete: () => void; onOutStart?: () => void }) {
    const [phase, setPhase] = useState<IntroPhase>("pre-drop");
    const strips = Array.from({ length: STRIP_COUNT }, (_, index) => index);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mediaQuery.matches) {
            onComplete();
            return;
        }

        const startDropFrame = window.requestAnimationFrame(() => setPhase("drop"));
        const expandTimer = window.setTimeout(() => setPhase("expand"), DROP_MS);
        const marqueeTimer = window.setTimeout(() => setPhase("marquee"), DROP_MS + EXPAND_MS);
        const outTimer = window.setTimeout(() => {
            onOutStart?.();
            setPhase("out");
        }, DROP_MS + EXPAND_MS + STRIP_IN_MS + MARQUEE_HOLD_MS);
        const completeTimer = window.setTimeout(
            onComplete,
            DROP_MS + EXPAND_MS + STRIP_IN_MS + MARQUEE_HOLD_MS + STRIP_OUT_MS + MAX_ROW_DELAY_MS + COMPLETE_BUFFER_MS
        );

        return () => {
            window.cancelAnimationFrame(startDropFrame);
            window.clearTimeout(expandTimer);
            window.clearTimeout(marqueeTimer);
            window.clearTimeout(outTimer);
            window.clearTimeout(completeTimer);
        };
    }, [onComplete, onOutStart]);

    const isExpanded = phase === "expand" || phase === "marquee" || phase === "out";
    const showInitialText = phase === "pre-drop" || phase === "drop" || phase === "expand";
    const showStripLayer = phase === "expand" || phase === "marquee" || phase === "out";
    const overlayBackgroundColor = phase === "pre-drop" || phase === "drop" || phase === "expand"
        ? INTRO_BLUE
        : phase === "marquee"
            ? INTRO_LIGHT
            : "transparent";
    const shellTransform = phase === "pre-drop" ? "translate3d(0, -145vh, 0)" : "translate3d(0, 0, 0)";

    return (
        <div
            className="fixed inset-0 z-[120] overflow-hidden"
            style={{
                backgroundColor: overlayBackgroundColor,
                transitionProperty: "background-color",
                transitionDuration: phase === "out" ? "0ms" : "220ms",
                transitionTimingFunction: "ease"
            }}
        >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div
                    className={cn(
                        "relative overflow-hidden border border-[#222831]/25"
                    )}
                    style={{
                        width: isExpanded ? "100dvw" : "clamp(260px, 30vw, 430px)",
                        height: isExpanded ? "100dvh" : "86px",
                        borderRadius: isExpanded ? "0px" : "16px",
                        borderColor: isExpanded ? "transparent" : "rgba(34,40,49,0.25)",
                        boxShadow: isExpanded ? "none" : "0 20px 55px rgba(0,0,0,0.28)",
                        transform: shellTransform,
                        transitionProperty: "transform,width,height,border-radius,border-color,box-shadow",
                        transitionDuration: `${DROP_MS}ms,${EXPAND_MS}ms,${EXPAND_MS}ms,${EXPAND_MS}ms,${EXPAND_MS}ms,${EXPAND_MS}ms`,
                        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.2,0.75,0.2,1),cubic-bezier(0.2,0.75,0.2,1),cubic-bezier(0.2,0.75,0.2,1),linear,cubic-bezier(0.2,0.75,0.2,1)",
                        transitionDelay: "0ms,0ms,0ms,0ms,0ms,0ms"
                    }}
                >
                    <div
                        className="absolute inset-0 bg-[linear-gradient(120deg,#DFD0B8_0%,#d8c9b0_52%,#c5b69c_100%)]"
                        style={{
                            opacity: phase === "out" ? 0 : 1,
                            transitionProperty: "opacity",
                            transitionDuration: `${BASE_FADE_OUT_MS}ms`,
                            transitionTimingFunction: "ease-out",
                            transitionDelay: "0ms"
                        }}
                    />

                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                            showInitialText ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <span className="select-none text-[clamp(1.1rem,3vw,2rem)] font-semibold uppercase tracking-[0.28em] text-[#222831]/70">
                            ARCHIVED
                        </span>
                    </div>

                    <div
                        className={cn(
                            "absolute inset-0 grid transition-opacity duration-250",
                            showStripLayer ? "opacity-100" : "opacity-0"
                        )}
                        style={{ gridTemplateRows: `repeat(${STRIP_COUNT}, minmax(0, 1fr))` }}
                    >
                        {strips.map((stripIndex) => {
                            const stripTransform = phase === "expand"
                                ? (stripIndex % 2 === 0 ? "translateX(-100%)" : "translateX(100%)")
                                : phase === "marquee"
                                    ? "translateX(0%)"
                                    : phase === "out"
                                        ? (stripIndex % 2 === 0 ? "translateX(100%)" : "translateX(-100%)")
                                        : (stripIndex % 2 === 0 ? "translateX(-100%)" : "translateX(100%)");

                            const hasStripInTransition = phase === "marquee";
                            const hasStripOutTransition = phase === "out";
                            const stripDelay = hasStripInTransition || hasStripOutTransition
                                ? `${getRowDelayMs(stripIndex)}ms`
                                : "0ms";

                            return (
                                <div key={stripIndex} className="relative overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-[linear-gradient(120deg,#DFD0B8_0%,#d8c9b0_52%,#c5b69c_100%)]"
                                        style={{
                                            transform: stripTransform,
                                            transitionProperty: hasStripInTransition || hasStripOutTransition ? "transform" : "none",
                                            transitionDuration: hasStripInTransition ? `${STRIP_IN_MS}ms` : hasStripOutTransition ? `${STRIP_OUT_MS}ms` : "0ms",
                                            transitionTimingFunction: hasStripInTransition || hasStripOutTransition ? "cubic-bezier(0.65,0,0.35,1)" : "linear",
                                            transitionDelay: stripDelay
                                        }}
                                    >
                                        <div className="absolute inset-0 flex items-center overflow-hidden">
                                            <div
                                                className="flex min-w-max whitespace-nowrap select-none"
                                                style={{
                                                    animation: `${stripIndex % 2 === 0 ? "introMarqueeRight" : "introMarqueeLeft"} ${10 + (stripIndex * 0.7)}s linear infinite`
                                                }}
                                            >
                                                <span className="px-4 text-[clamp(1.1rem,2.9vw,2.2rem)] font-sans font-semibold uppercase tracking-[0.16em] text-[#222831]/24">
                                                    Archived Archived Archived Archived Archived Archived
                                                </span>
                                                <span className="px-4 text-[clamp(1.1rem,2.9vw,2.2rem)] font-sans font-semibold uppercase tracking-[0.16em] text-[#222831]/24">
                                                    Archived Archived Archived Archived Archived Archived
                                                </span>
                                            </div>
                                        </div>
                                        {stripIndex < STRIP_COUNT - 1 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#222831]/18" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes introMarqueeRight {
                    from { transform: translateX(-38%); }
                    to { transform: translateX(0%); }
                }
                @keyframes introMarqueeLeft {
                    from { transform: translateX(0%); }
                    to { transform: translateX(-38%); }
                }
            `}</style>
        </div>
    );
}
