"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EXPENCIR_BRAND } from "@/lib/theme";

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Tuning knobs (seconds unless noted)                                */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "expencir_splash_shown";
const EMBLEM_SIZE = 176; // px
const BLADE_COUNT = 6;

const SPIN_DURATION = 2.6; // total spin, fast start -> slow settle
const SPIN_TURNS = 2; // full turns before settling upright
const BLADE_STAGGER = 0.09; // delay between each blade opening
const BLADE_OPEN_DURATION = 1.1;
const WORDMARK_DELAY = 2.4;
const TAGLINE_DELAY = 2.9;
const EXIT_AT_MS = 4200; // when the fade-out starts
const REDUCED_MOTION_MS = 1800;

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ONE blade of the new emblem (512x512 box). The other 5 are this same
// path rotated by 60deg steps around (256,256).
const BLADE_PATH =
  "M44.7 239.7 L45.3 243.2 L49.0 250.2 L54.0 258.8 L61.1 269.4 L66.9 276.9 L73.0 284.0 L79.4 290.7 L86.1 296.8 L92.9 302.5 L100.0 307.7 L107.2 312.3 L114.5 316.5 L122.0 320.1 L129.5 323.2 L137.1 325.7 L144.9 327.8 L152.5 329.3 L160.0 330.2 L167.4 330.7 L176.9 330.4 L184.0 329.7 L191.1 328.4 L199.8 325.9 L206.3 323.4 L214.1 319.6 L219.6 316.1 L225.1 312.0 L229.9 307.6 L235.4 301.3 L239.2 295.9 L242.6 289.8 L244.6 284.8 L244.6 281.3 L243.3 278.1 L241.3 275.9 L238.2 274.3 L234.7 274.0 L226.8 275.6 L220.8 276.3 L212.8 276.4 L207.2 276.0 L199.5 274.9 L194.1 273.6 L186.6 271.2 L179.3 268.1 L168.1 261.7 L157.5 253.6 L148.0 244.1 L139.7 233.3 L132.5 221.3 L126.7 208.3 L123.0 197.0 L119.8 182.6 L118.6 173.6 L117.9 164.4 L117.8 155.1 L118.3 145.7 L120.3 129.6 L122.3 120.1 L124.7 111.0 L124.9 108.7 L124.3 105.8 L122.8 103.3 L120.6 101.4 L117.8 100.3 L114.3 100.2 L110.6 101.8 L102.5 109.8 L95.4 117.6 L87.2 127.7 L79.8 138.2 L74.1 147.1 L67.8 158.3 L63.2 167.8 L59.1 177.3 L55.5 187.1 L52.4 197.0 L49.7 207.1 L47.6 217.2 L45.9 227.5 L44.7 239.7 Z";

/* ------------------------------------------------------------------ */
/*  The wheel: 6 separate blades that open one after another           */
/* ------------------------------------------------------------------ */
function WheelBlades({ animated }: { animated: boolean }) {
  return (
    <>
      {Array.from({ length: BLADE_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          // each blade starts tiny, twisted and invisible at the hub,
          // then unfurls outward into its final slot
          initial={animated ? { opacity: 0, scale: 0.12, rotate: -100 } : false}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            delay: 0.1 + i * BLADE_STAGGER,
            duration: BLADE_OPEN_DURATION,
            ease: EASE_OUT,
          }}
        >
          <svg viewBox="0 0 512 512" className="h-full w-full" aria-hidden="true">
            <path
              d={BLADE_PATH}
              fill="#ffffff"
              transform={`rotate(${(i * 360) / BLADE_COUNT} 256 256)`}
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Splash                                                             */
/* ------------------------------------------------------------------ */
export function ExpencirSplashScreen({
  onComplete,
  forceShow = false,
}: SplashScreenProps) {
  const [skipped, setSkipped] = useState(false);
  const [visible, setVisible] = useState(true);
  // "pending" until we know about reduced-motion, so the wrong
  // animation never flashes for a frame
  const [mode, setMode] = useState<"pending" | "full" | "reduced">("pending");

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!forceShow && sessionStorage.getItem(STORAGE_KEY) === "true") {
      setSkipped(true);
      onCompleteRef.current?.();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reduced ? "reduced" : "full");

    const timer = setTimeout(
      () => {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setVisible(false); // triggers the exit fade
      },
      reduced ? REDUCED_MOTION_MS : EXIT_AT_MS
    );
    return () => clearTimeout(timer);
  }, [forceShow]);

  if (skipped) return null;

  const full = mode === "full";

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current?.()}>
      {visible && (
        <motion.div
          key="expencir-splash"
          className="fixed inset-0 z-[9999] flex select-none flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, #2a2ab8 0%, #14146e 45%, #090930 100%)",
          }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
        >
          {mode !== "pending" && (
            <>
              {/* corner accents, appear with the final composition */}
              <motion.div
                className="absolute right-0 top-0 h-96 w-96 -translate-y-20 translate-x-20 bg-gradient-to-bl from-indigo-400/10 to-transparent blur-2xl"
                initial={full ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ delay: full ? WORDMARK_DELAY : 0, duration: 1 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-80 w-80 -translate-x-16 translate-y-16 rounded-full bg-gradient-to-tr from-indigo-500/15 via-indigo-600/5 to-transparent blur-3xl"
                initial={full ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ delay: full ? WORDMARK_DELAY : 0, duration: 1 }}
              />

              <div className="relative z-10 -mt-10 flex flex-col items-center">
                {/* ---------------- emblem ---------------- */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: EMBLEM_SIZE, height: EMBLEM_SIZE }}
                >
                  {full && (
                    <>
                      {/* light bloom behind the wheel */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          inset: -90,
                          background:
                            "radial-gradient(circle, rgba(129,140,248,.55) 0%, rgba(99,102,241,.18) 45%, transparent 70%)",
                        }}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: [0, 1, 0.7], scale: [0.4, 1.15, 1] }}
                        transition={{ duration: 2.4, ease: "easeOut", times: [0, 0.5, 1] }}
                      />

                      {/* spinning light streak = motion-blur trail */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          inset: -40,
                          background:
                            "conic-gradient(from 0deg, transparent 0deg, rgba(165,180,252,.65) 70deg, transparent 150deg)",
                          filter: "blur(16px)",
                        }}
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ opacity: [0, 0.9, 0], rotate: 900 }}
                        transition={{ duration: 2.0, ease: "easeOut", times: [0, 0.25, 1] }}
                      />

                      {/* pulse rings once the wheel has settled */}
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border border-indigo-200/40"
                          initial={{ opacity: 0, scale: 1 }}
                          animate={{ opacity: [0, 0.55, 0], scale: [1, 1.6, 2.2] }}
                          transition={{
                            delay: 2.0 + i * 0.3,
                            duration: 1.4,
                            ease: "easeOut",
                            times: [0, 0.2, 1],
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* THE WHEEL: spins several turns, decelerates, ends upright */}
                  <motion.div
                    className="relative h-full w-full"
                    style={{ willChange: "transform, filter" }}
                    initial={
                      full
                        ? { rotate: -360 * SPIN_TURNS, scale: 0.6, filter: "blur(12px)" }
                        : false
                    }
                    animate={{ rotate: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{
                      rotate: { duration: SPIN_DURATION, ease: EASE_OUT },
                      scale: { duration: 1.8, ease: EASE_OUT },
                      filter: { duration: 1.6, ease: "easeOut" },
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ filter: "drop-shadow(0 0 22px rgba(165,180,252,.65))" }}
                    >
                      <WheelBlades animated={full} />
                    </div>
                  </motion.div>
                </div>

                {/* ---------------- wordmark + tagline ---------------- */}
                <div className="mt-10 flex flex-col items-center text-center">
                  <motion.h1
                    className="text-4xl font-black uppercase text-white sm:text-5xl"
                    style={{
                      fontFamily: 'var(--font-orbitron), "Arial Black", sans-serif',
                      letterSpacing: "0.3em",
                      paddingLeft: "0.3em", // balances trailing letter-spacing
                      textShadow:
                        "0 0 25px rgba(255,255,255,.4), 0 0 50px rgba(99,102,241,.5)",
                    }}
                    initial={full ? { opacity: 0, y: 16 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: full ? WORDMARK_DELAY : 0, duration: 0.7, ease: EASE_OUT }}
                  >
                    <span className="inline-block" style={{ transform: "skewX(-10deg)" }}>
                      {EXPENCIR_BRAND.wordmark}
                    </span>
                  </motion.h1>

                  <motion.p
                    className="mt-3 text-xs font-medium uppercase text-indigo-200/80 sm:text-sm"
                    style={{ letterSpacing: "0.35em", paddingLeft: "0.35em" }}
                    initial={full ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 0.85, y: 0 }}
                    transition={{ delay: full ? TAGLINE_DELAY : 0, duration: 0.6, ease: EASE_OUT }}
                  >
                    {EXPENCIR_BRAND.tagline}
                  </motion.p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}