"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface PropertyLightboxProps {
  images: string[];
  title: string;
  initialIndex: number;
  onClose: () => void;
  labels: {
    close: string;
    previous: string;
    next: string;
  };
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SWIPE_THRESHOLD = 60;

export default function PropertyLightbox({
  images,
  title,
  initialIndex,
  onClose,
  labels,
}: PropertyLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isGesturing, setIsGesturing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const total = images.length;
      setIndex(((next % total) + total) % total);
      resetZoom();
      setSwipeOffset(0);
    },
    [images.length, resetZoom]
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, onClose]);

  const clampTranslate = useCallback((x: number, y: number, currentScale: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (currentScale - 1)) / 2;
    const maxY = (el.clientHeight * (currentScale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  const applyZoomAt = useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const originX = clientX - rect.left - rect.width / 2;
      const originY = clientY - rect.top - rect.height / 2;
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));

      setTranslate((prev) => {
        const ratio = clamped / scale - 1;
        return clampTranslate(prev.x - originX * ratio, prev.y - originY * ratio, clamped);
      });
      setScale(clamped);
    },
    [scale, clampTranslate]
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    applyZoomAt(scale + delta * scale, e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setIsGesturing(true);

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { distance, scale };
      dragStart.current = null;
    } else if (pointers.current.size === 1) {
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        translateX: translate.x,
        translateY: translate.y,
      };

      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale > 1) resetZoom();
        else applyZoomAt(2.5, e.clientX, e.clientY);
      }
      lastTap.current = now;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStart.current.scale * (distance / pinchStart.current.distance))
      );
      setScale(nextScale);
      return;
    }

    if (pointers.current.size === 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (scale > 1) {
        setTranslate(
          clampTranslate(dragStart.current.translateX + dx, dragStart.current.translateY + dy, scale)
        );
      } else if (Math.abs(dx) > Math.abs(dy)) {
        setSwipeOffset(dx);
      }
    }
  };

  const endGesture = (e: React.PointerEvent) => {
    if (pointers.current.size === 1 && dragStart.current && scale === 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goPrev();
        else goNext();
      } else {
        setSwipeOffset(0);
      }
    }

    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      dragStart.current = null;
      setIsGesturing(false);
      if (scale < 1.05) resetZoom();
    }
  };

  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black flex flex-col select-none"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <span className="text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 overflow-hidden touch-none"
        style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${translate.x + swipeOffset}px, ${translate.y}px) scale(${scale})`,
            transition: isGesturing ? "none" : "transform 200ms ease-out",
          }}
        >
          <Image
            src={image}
            alt={`${title} - ${index + 1}`}
            fill
            sizes="100vw"
            priority
            className="object-contain"
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label={labels.previous}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label={labels.next}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scroll px-4 py-3 shrink-0">
          {images.map((img, idx) => (
            <button
              type="button"
              key={img + idx}
              onClick={() => goTo(idx)}
              className={`relative flex-none w-16 h-12 rounded-md overflow-hidden transition-opacity ${
                idx === index ? "ring-2 ring-white opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
