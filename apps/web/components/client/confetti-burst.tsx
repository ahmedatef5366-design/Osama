"use client";

import { useEffect, useRef } from "react";

type ConfettiBurstProps = {
  trigger: boolean;
};

export function ConfettiBurst({ trigger }: ConfettiBurstProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!trigger || firedRef.current) return;
    firedRef.current = true;

    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#C8F135", "#00D68F", "#4BA3FF", "#FFB020"],
      });
    });
  }, [trigger]);

  return null;
}
