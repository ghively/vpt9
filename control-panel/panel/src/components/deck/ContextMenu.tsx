/* eslint-disable react-refresh/only-export-components -- the menu component and its
 * opener hook are one unit; splitting them for HMR pedantry would hurt discoverability. */
import { useCallback, useEffect, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";

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

/** Touch long-press → fires `onLongPress(x, y)` after a hold, so a phone can open the same
 *  context menus a mouse gets from right-click. Mouse pointers are ignored (they keep
 *  right-click). Cancels on move (>tolerance) or lift, and eats the trailing click so the
 *  hold doesn't ALSO select the row / open the slot editor. A plain factory (not a hook)
 *  so it can be called per-item inside a .map(); each call closes over its own timer.
 *  Spread the returned handlers onto the same element that carries `onContextMenu`. */
export function longPressHandlers(onLongPress: (x: number, y: number) => void, ms = 500, moveTolerance = 12) {
  let timer: number | null = null;
  let start: { x: number; y: number } | null = null;
  const clear = () => { if (timer != null) { clearTimeout(timer); timer = null; } start = null; };
  const eatNextClick = () => {
    const s = (e: Event) => { e.stopPropagation(); e.preventDefault(); cleanup(); };
    const cleanup = () => window.removeEventListener("click", s, true);
    window.addEventListener("click", s, true);
    window.setTimeout(cleanup, 700); // safety: never leave a dangling suppressor
  };
  return {
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") return; // desktop keeps right-click
      start = { x: e.clientX, y: e.clientY };
      const x = e.clientX, y = e.clientY;
      timer = window.setTimeout(() => { timer = null; start = null; eatNextClick(); onLongPress(x, y); }, ms);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (!start) return;
      if (Math.abs(e.clientX - start.x) > moveTolerance || Math.abs(e.clientY - start.y) > moveTolerance) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
  };
}

/** The menu itself: fixed-positioned at the pointer, clamped to the viewport.
 *  Deliberately renders nothing browser-native — the deck suppresses the default
 *  context menu only where it offers its own. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  useEffect(() => {
    const away = (e: Event) => {
      // pointerdown anywhere outside the menu closes it; the menu's own buttons
      // stopPropagation so a selection runs before this fires.
      if ((e.target as HTMLElement | null)?.closest?.(".ctx-menu")) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  // Clamp so the menu never opens off-screen (rough item metrics are fine here).
  const estHeight = items.length * 28 + 12;
  const left = Math.min(x, window.innerWidth - 190);
  const top = Math.min(y, window.innerHeight - estHeight);

  return (
    <div className="ctx-menu" role="menu" style={{ left, top }} onContextMenu={(e) => e.preventDefault()}>
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
