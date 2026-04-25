"use client";

/**
 * Soft, brand-colored confetti for success moments.
 * Lazy-loads canvas-confetti only when needed.
 */
export async function celebrate() {
  if (typeof window === "undefined") return;
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#4A7BA8", "#7FA7CE", "#F4D6D6", "#FFE0B2", "#C8E6C9"];
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors,
    scalar: 0.9,
  });
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
  }, 200);
}
