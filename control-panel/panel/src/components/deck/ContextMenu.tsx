/* eslint-disable react-refresh/only-export-components -- the menu component and its
 * opener hook are one unit; splitting them for HMR pedantry would hurt discoverability. */
import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";

/** One entry in a right-click menu, or "separator" for a hairline divider. */
export type MenuItem =
  | {
      label: string;
      onSelect: () => void;
      /** Render in the live-red danger tone (destructive actions). */
      danger?: boolean;
      disabled?: boolean;
    }
  | "separator";

/** Right-click menu state for one component: call `open(e, items)` from an
 *  onContextMenu handler (it preventDefault()s the browser menu), render `menu`
 *  somewhere in the tree. Closes on select, click-away, Escape, or window blur. */
export function useContextMenu() {
  const [state, setState] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  // Position-based open — the shared core, used by both right-click (open) and long-press
  // (useLongPress). Touch devices have no right-click, so this is how mobile reaches every
  // context-menu action (rename, hide, duplicate, clear slot, media tags/collections,
  // delete) that was otherwise mouse-only.
  const openAt = useCallback((x: number, y: number, items: MenuItem[]) => {
    if (!items.length) return;
    setState({ x, y, items });
  }, []);
  const open = useCallback((e: MouseEvent, items: MenuItem[]) => {
    if (!items.length) return;
    e.preventDefault();
    e.stopPropagation();
    openAt(e.clientX, e.clientY, items);
  }, [openAt]);
  const close = useCallback(() => setState(null), []);

  const menu = state ? <ContextMenu x={state.x} y={state.y} items={state.items} onClose={close} /> : null;
  return { open, openAt, close, menu };
}

// Long-press state is MODULE-LEVEL (not per-closure): longPressHandlers is called inline
// inside .map() so a re-render mid-hold used to bind a NEW closure whose clear() couldn't
// cancel the previous closure's still-pending timer — the timer fired a phantom menu after
// finger-up/scroll. One finger = one long-press at a time, so a single shared timer is
// correct and survives re-renders.
let _lpTimer: number | null = null;
let _lpStart: { x: number; y: number } | null = null;
let _lpEater: ((e: Event) => void) | null = null;
const _lpClearTimer = () => { if (_lpTimer != null) { clearTimeout(_lpTimer); _lpTimer = null; } _lpStart = null; };
const _lpArmEater = () => {
  if (_lpEater) return;
  _lpEater = (e: Event) => { e.stopPropagation(); e.preventDefault(); _lpDisarmEater(); };
  window.addEventListener("click", _lpEater, true);
};
const _lpDisarmEater = () => { if (_lpEater) { window.removeEventListener("click", _lpEater, true); _lpEater = null; } };
// End of the gesture (finger lift/cancel): cancel any pending timer, then disarm the click
// eater a beat LATER so the synthesized click (which fires right after pointerup, no matter
// how long the finger was held) is still suppressed — fixing the old fixed-700ms-from-arm
// window that leaked the click on holds longer than ~1.2s.
const _lpEndGesture = () => { _lpClearTimer(); if (_lpEater) window.setTimeout(_lpDisarmEater, 400); };

/** Touch long-press → fires `onLongPress(x, y)` after a hold, so a phone can open the same
 *  context menus a mouse gets from right-click. Mouse pointers are ignored (they keep
 *  right-click). Cancels on move (>tolerance) or lift; eats the trailing synthesized click
 *  so the hold doesn't ALSO select the row / open the slot editor. Spread onto the same
 *  element that carries `onContextMenu`. */
export function longPressHandlers(onLongPress: (x: number, y: number) => void, ms = 500, moveTolerance = 12) {
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") return; // desktop keeps right-click
      _lpClearTimer();
      _lpStart = { x: e.clientX, y: e.clientY };
      const x = e.clientX, y = e.clientY;
      _lpTimer = window.setTimeout(() => { _lpTimer = null; _lpStart = null; _lpArmEater(); onLongPress(x, y); }, ms);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (!_lpStart) return;
      if (Math.abs(e.clientX - _lpStart.x) > moveTolerance || Math.abs(e.clientY - _lpStart.y) > moveTolerance) _lpClearTimer();
    },
    onPointerUp: _lpEndGesture,
    onPointerCancel: _lpEndGesture,
    onPointerLeave: _lpClearTimer,
  };
}

/** The menu itself: fixed-positioned at the pointer, clamped to the viewport.
 *  Deliberately renders nothing browser-native — the deck suppresses the default
 *  context menu only where it offers its own. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: Event) => {
      // pointerdown anywhere outside the menu closes it; the menu's own buttons
      // stopPropagation so a selection runs before this fires.
      if ((e.target as HTMLElement | null)?.closest?.(".ctx-menu")) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      // Roving focus so the menu is operable by keyboard once open (Enter/Space activate
      // via the native <button>). Up/Down cycle the enabled items; Home/End jump the ends.
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      const el = menuRef.current;
      if (!el) return;
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("button.ctx-menu__item:not([disabled])"));
      if (!buttons.length) return;
      e.preventDefault();
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      let next: number;
      if (e.key === "Home") next = 0;
      else if (e.key === "End") next = buttons.length - 1;
      else if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % buttons.length;
      else next = current <= 0 ? buttons.length - 1 : current - 1;
      buttons[next].focus();
    };
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  // Move focus into the menu when it opens (keyboard users land on the first item; mouse
  // users are unaffected since they click directly). Only autofocuses if opened while the
  // page has keyboard focus context — harmless for pointer opens.
  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>("button.ctx-menu__item:not([disabled])")?.focus();
  }, []);

  // Clamp so the menu never opens off-screen (rough item metrics are fine here).
  const estHeight = items.length * 28 + 12;
  const left = Math.min(x, window.innerWidth - 190);
  const top = Math.min(y, window.innerHeight - estHeight);

  return (
    <div ref={menuRef} className="ctx-menu" role="menu" style={{ left, top }} onContextMenu={(e) => e.preventDefault()}>
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={`sep-${i}`} className="ctx-menu__sep" aria-hidden="true" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className="ctx-menu__item"
            data-danger={item.danger || undefined}
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
