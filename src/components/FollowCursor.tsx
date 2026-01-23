"use client";

import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "link" | "view";

const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

export default function FollowCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const modeRef = useRef<CursorMode>("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const cursor = cursorRef.current;
    if (!cursor) return;

    document.body.dataset.cursor = "true";
    cursor.style.opacity = "0";

    const setMode = (mode: CursorMode) => {
      if (modeRef.current === mode) return;
      modeRef.current = mode;
      cursor.dataset.mode = mode;
    };

    const updateModeAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!el) {
        setMode("default");
        return;
      }
      if (el.closest('[data-cursor="view"]')) {
        setMode("view");
        return;
      }
      if (el.closest("a, button, [role='button'], [data-cursor='link']")) {
        setMode("link");
        return;
      }
      setMode("default");
    };

    const tick = () => {
      position.current.x = lerp(position.current.x, target.current.x, 0.18);
      position.current.y = lerp(position.current.y, target.current.y, 0.18);
      cursor.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) translate(-50%, -50%)`;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const handleMove = (event: MouseEvent) => {
      target.current = { x: event.clientX, y: event.clientY };
      updateModeAt(event.clientX, event.clientY);
      if (cursor.style.opacity !== "1") {
        cursor.style.opacity = "1";
      }
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const handleLeave = () => {
      cursor.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      delete document.body.dataset.cursor;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={cursorRef} className="nf-cursor" data-mode="default">
      <div className="nf-cursor-dot" />
      <div className="nf-cursor-ring">
        <span className="nf-cursor-label">VIEW</span>
      </div>
    </div>
  );
}
