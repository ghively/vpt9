import { jsx as i, jsxs as b } from "react/jsx-runtime";
import { useState as T, useEffect as V, forwardRef as L, useRef as W, useImperativeHandle as A } from "react";
function I({ label: t, active: l = !1, onClick: e }) {
  return /* @__PURE__ */ i("button", { className: "chip", "data-active": l, onClick: e, children: t });
}
function x({
  label: t,
  active: l = !1,
  tone: e = "default",
  disabled: r = !1,
  title: c,
  onClick: a,
  className: d
}) {
  return /* @__PURE__ */ i(
    "button",
    {
      className: d ? `toggle-sq ${d}` : "toggle-sq",
      "data-active": l,
      "data-tone": e === "live" ? "live" : void 0,
      disabled: r,
      title: c,
      onClick: a,
      children: t
    }
  );
}
function H({ value: t, min: l = 0, max: e = 1, step: r = 0.01, onChange: c, ariaLabel: a }) {
  return /* @__PURE__ */ i(
    "input",
    {
      type: "range",
      min: l,
      max: e,
      step: r,
      value: t,
      "aria-label": a,
      onChange: (d) => c == null ? void 0 : c(Number(d.target.value))
    }
  );
}
function E({ label: t, variant: l = "default", onClick: e }) {
  return /* @__PURE__ */ i("button", { className: l === "save" ? "save-btn" : "btn", onClick: e, children: t });
}
function _({ value: t, options: l, onChange: e, className: r }) {
  return /* @__PURE__ */ i("select", { className: r, value: t, onChange: (c) => e == null ? void 0 : e(c.target.value), children: l.map((c) => /* @__PURE__ */ i("option", { value: c.value, children: c.label }, c.value)) });
}
function Y({ value: t, placeholder: l, onCommit: e, className: r }) {
  const [c, a] = T(t);
  return V(() => {
    a(t);
  }, [t]), /* @__PURE__ */ i(
    "input",
    {
      type: "text",
      className: r,
      placeholder: l,
      value: c,
      onChange: (m) => a(m.target.value),
      onBlur: () => {
        c !== t && (e == null || e(c));
      },
      onKeyDown: (m) => {
        m.key === "Enter" && m.target.blur();
      }
    }
  );
}
function Q({ state: t, label: l }) {
  return /* @__PURE__ */ i("div", { id: "status", "data-state": t, children: l });
}
function Z({ center: t, right: l }) {
  return /* @__PURE__ */ b("header", { children: [
    /* @__PURE__ */ b("div", { className: "nameplate", children: [
      /* @__PURE__ */ i("span", { className: "lamp", "aria-hidden": "true" }),
      /* @__PURE__ */ b("span", { className: "wordmark", children: [
        /* @__PURE__ */ i("b", { children: "VPT" }),
        /* @__PURE__ */ i("span", { className: "sep", children: "/" }),
        "roomcast",
        /* @__PURE__ */ i("span", { className: "desc", children: " control" })
      ] })
    ] }),
    t,
    l
  ] });
}
function M({ screens: t, ownerId: l, onSelect: e }) {
  return /* @__PURE__ */ b("div", { id: "audio-owner", children: [
    /* @__PURE__ */ i("span", { className: "label", children: "Audio on: " }),
    t.map((r) => /* @__PURE__ */ i(
      I,
      {
        label: r.name,
        active: l === r.id,
        onClick: () => e == null ? void 0 : e(r.id)
      },
      r.id
    ))
  ] });
}
const q = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "difference",
  "add"
];
function j([t, l, e]) {
  const r = (c) => Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${r(t)}${r(l)}${r(e)}`;
}
function O({ layer: t, neighbors: l, onUpdate: e, onMove: r, onRemove: c }) {
  var d, m, u, n, v;
  const a = ((d = t.source) == null ? void 0 : d.type) === "color";
  return /* @__PURE__ */ b("div", { className: "strip", children: [
    /* @__PURE__ */ i("div", { className: "idx mono", children: String(t.order ?? 0).padStart(2, "0") }),
    /* @__PURE__ */ b("div", { className: "move-group", children: [
      /* @__PURE__ */ i(
        x,
        {
          className: "move-btn",
          label: "▲",
          title: "Move toward front",
          disabled: !l.above,
          onClick: () => r == null ? void 0 : r("up")
        }
      ),
      /* @__PURE__ */ i(
        x,
        {
          className: "move-btn",
          label: "▼",
          title: "Move toward back",
          disabled: !l.below,
          onClick: () => r == null ? void 0 : r("down")
        }
      )
    ] }),
    /* @__PURE__ */ i("div", { className: "meta", children: /* @__PURE__ */ i(
      Y,
      {
        className: "name-input",
        value: t.name ?? "",
        onCommit: (s) => e == null ? void 0 : e("name", s)
      }
    ) }),
    /* @__PURE__ */ b("div", { className: "source-group", children: [
      /* @__PURE__ */ i(
        _,
        {
          className: "source-type",
          value: ((m = t.source) == null ? void 0 : m.type) ?? "video",
          options: [
            { value: "video", label: "Video URL" },
            { value: "color", label: "Solid color" }
          ],
          onChange: (s) => {
            var o, f;
            return e == null ? void 0 : e(
              "source",
              s === "color" ? { type: "color", color: ((o = t.source) == null ? void 0 : o.color) ?? [0.5, 0.5, 0.5] } : { type: "video", url: ((f = t.source) == null ? void 0 : f.url) ?? "" }
            );
          }
        }
      ),
      /* @__PURE__ */ i("div", { className: "source-field", children: a ? /* @__PURE__ */ i(
        "input",
        {
          type: "color",
          value: j(t.source.color ?? [0.5, 0.5, 0.5]),
          onChange: (s) => {
            const o = s.target.value, f = [1, 3, 5].map((h) => parseInt(o.slice(h, h + 2), 16) / 255);
            e == null || e("source", { type: "color", color: f });
          }
        }
      ) : /* @__PURE__ */ i(
        Y,
        {
          value: ((u = t.source) == null ? void 0 : u.url) ?? "",
          placeholder: "/media/video.mp4",
          onCommit: (s) => e == null ? void 0 : e("source", { type: "video", url: s })
        }
      ) })
    ] }),
    /* @__PURE__ */ i(
      _,
      {
        className: "blend-select",
        value: t.blendMode ?? "normal",
        options: q.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
        onChange: (s) => e == null ? void 0 : e("blendMode", s)
      }
    ),
    /* @__PURE__ */ b("div", { className: "opacity-field", children: [
      /* @__PURE__ */ i(
        H,
        {
          value: t.opacity ?? 1,
          ariaLabel: "Layer opacity",
          onChange: (s) => e == null ? void 0 : e("opacity", s)
        }
      ),
      /* @__PURE__ */ b("span", { className: "opacity-val mono", children: [
        Math.round((t.opacity ?? 1) * 100),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ b("div", { className: "toggles", children: [
      /* @__PURE__ */ i(
        x,
        {
          label: "M",
          title: "Mask",
          active: !!((n = t.mask) != null && n.enabled),
          onClick: () => {
            var s;
            return e == null ? void 0 : e("mask", { ...t.mask, enabled: !((s = t.mask) != null && s.enabled) });
          }
        }
      ),
      /* @__PURE__ */ i(
        x,
        {
          label: ((v = t.mask) == null ? void 0 : v.shape) === "rect" ? "□" : "○",
          title: "Mask shape",
          onClick: () => {
            var s;
            return e == null ? void 0 : e("mask", {
              ...t.mask,
              shape: ((s = t.mask) == null ? void 0 : s.shape) === "rect" ? "ellipse" : "rect"
            });
          }
        }
      ),
      /* @__PURE__ */ i(x, { className: "remove-btn", label: "×", title: "Remove layer", onClick: c })
    ] })
  ] });
}
function z({
  layers: t,
  onUpdateLayer: l,
  onMoveLayer: e,
  onRemoveLayer: r,
  onAddLayer: c
}) {
  const a = [...t].sort((m, u) => (m.order ?? 0) - (u.order ?? 0)), d = [...a].reverse();
  return /* @__PURE__ */ b("div", { id: "layer-rack", children: [
    /* @__PURE__ */ i("div", { className: "rack-title", children: "Layer rack — top of stack first" }),
    d.map((m) => {
      const u = a.findIndex((v) => v.id === m.id), n = { above: u < a.length - 1, below: u > 0 };
      return /* @__PURE__ */ i(
        O,
        {
          layer: m,
          neighbors: n,
          onUpdate: (v, s) => l == null ? void 0 : l(m.id, v, s),
          onMove: (v) => e == null ? void 0 : e(m.id, v),
          onRemove: () => r == null ? void 0 : r(m.id)
        },
        m.id
      );
    }),
    /* @__PURE__ */ i(E, { label: "+ Add layer", onClick: c })
  ] });
}
const F = L(
  function({ previewFrame: l, children: e }, r) {
    const c = W(null);
    return A(
      r,
      () => ({
        setFrame: (a) => {
          c.current && (c.current.src = a);
        }
      }),
      []
    ), /* @__PURE__ */ b("div", { className: "stage", children: [
      /* @__PURE__ */ i("div", { className: "stage__frame", children: /* @__PURE__ */ i("img", { ref: c, className: "preview-img", src: l || void 0, alt: "" }) }),
      e
    ] });
  }
);
function G({ x: t, y: l, active: e = !1, onDragStart: r, onDragTo: c, onDragEnd: a }) {
  const d = W(null), m = (u) => {
    const n = d.current;
    if (!n) return;
    const v = n.parentElement;
    if (!v) return;
    n.setPointerCapture(u.pointerId), n.dataset.active = "true", r == null || r();
    const s = (f) => {
      const h = v.getBoundingClientRect(), N = Math.min(1, Math.max(0, (f.clientX - h.left) / h.width)), k = Math.min(1, Math.max(0, (f.clientY - h.top) / h.height));
      n.style.left = `${N * 100}%`, n.style.top = `${k * 100}%`, c == null || c(N, k);
    }, o = () => {
      n.dataset.active = "false", n.removeEventListener("pointermove", s), n.removeEventListener("pointerup", o), a == null || a();
    };
    n.addEventListener("pointermove", s), n.addEventListener("pointerup", o);
  };
  return /* @__PURE__ */ i(
    "div",
    {
      ref: d,
      className: "handle",
      "data-active": e,
      style: { left: `${t * 100}%`, top: `${l * 100}%` },
      onPointerDown: m
    }
  );
}
const R = L(
  function({ screen: l, screens: e, previewFrame: r, onSelectScreen: c, onSetMode: a, onReset: d, onDragStart: m, onMovePoint: u, onDragEnd: n }, v) {
    const s = l == null ? void 0 : l.warp, f = (s == null ? void 0 : s.mode) === "mesh" ? (s == null ? void 0 : s.mesh.points) ?? [] : (s == null ? void 0 : s.corners) ?? [];
    return /* @__PURE__ */ b("div", { id: "warp-editor", children: [
      /* @__PURE__ */ b("div", { className: "panel-head", children: [
        /* @__PURE__ */ b("h3", { children: [
          (l == null ? void 0 : l.name) ?? "—",
          " — warp"
        ] }),
        /* @__PURE__ */ i("div", { className: "mode-group", children: e.map((h) => /* @__PURE__ */ i(
          I,
          {
            label: h.name,
            active: h.id === (l == null ? void 0 : l.id),
            onClick: () => c == null ? void 0 : c(h.id)
          },
          h.id
        )) })
      ] }),
      /* @__PURE__ */ b("div", { className: "mode-group", children: [
        /* @__PURE__ */ i(I, { label: "Corner pin", active: (s == null ? void 0 : s.mode) !== "mesh", onClick: () => a == null ? void 0 : a("corner") }),
        /* @__PURE__ */ i(I, { label: "Mesh", active: (s == null ? void 0 : s.mode) === "mesh", onClick: () => a == null ? void 0 : a("mesh") }),
        /* @__PURE__ */ i(I, { label: "Reset", onClick: d })
      ] }),
      /* @__PURE__ */ i(F, { ref: v, previewFrame: r, children: f.map((h, N) => /* @__PURE__ */ i(
        G,
        {
          x: h.x,
          y: h.y,
          onDragStart: m,
          onDragTo: (k, g) => u == null ? void 0 : u(N, k, g),
          onDragEnd: n
        },
        N
      )) })
    ] });
  }
);
function K({ pip: t, onDragStart: l, onMove: e, onResize: r, onDragEnd: c }) {
  const a = W(null), d = (u) => {
    const n = a.current, v = n == null ? void 0 : n.parentElement;
    if (!n || !v) return;
    const s = u.currentTarget;
    s.setPointerCapture(u.pointerId), l == null || l();
    const o = v.getBoundingClientRect(), f = u.clientX, h = u.clientY, N = t.x, k = t.y, g = (w) => {
      const B = (w.clientX - f) / o.width, X = (w.clientY - h) / o.height, $ = Math.min(1 - t.width, Math.max(0, N + B)), y = Math.min(1 - t.height, Math.max(0, k + X));
      n.style.left = `${$ * 100}%`, n.style.top = `${y * 100}%`, e == null || e($, y);
    }, C = () => {
      s.removeEventListener("pointermove", g), s.removeEventListener("pointerup", C), c == null || c();
    };
    s.addEventListener("pointermove", g), s.addEventListener("pointerup", C);
  }, m = (u) => {
    const n = a.current, v = n == null ? void 0 : n.parentElement;
    if (!n || !v) return;
    u.currentTarget.setPointerCapture(u.pointerId), l == null || l();
    const s = v.getBoundingClientRect(), o = u.clientX, f = u.clientY, h = t.width, N = t.height, k = (w) => {
      const B = (w.clientX - o) / s.width, X = (w.clientY - f) / s.height, $ = Math.max(0.05, Math.min(1 - t.x, h + B)), y = Math.max(0.05, Math.min(1 - t.y, N + X));
      n.style.width = `${$ * 100}%`, n.style.height = `${y * 100}%`, r == null || r($, y);
    }, g = u.currentTarget, C = () => {
      g.removeEventListener("pointermove", k), g.removeEventListener("pointerup", C), c == null || c();
    };
    g.addEventListener("pointermove", k), g.addEventListener("pointerup", C);
  };
  return /* @__PURE__ */ b(
    "div",
    {
      ref: a,
      className: "pip-box",
      style: {
        left: `${t.x * 100}%`,
        top: `${t.y * 100}%`,
        width: `${t.width * 100}%`,
        height: `${t.height * 100}%`
      },
      children: [
        /* @__PURE__ */ i("div", { className: "pip-box__bar", onPointerDown: d, children: /* @__PURE__ */ i("span", { children: t.title || "PiP" }) }),
        /* @__PURE__ */ i("div", { className: "pip-box__resize", onPointerDown: m })
      ]
    }
  );
}
const P = L(
  function({ screenId: l, pips: e, previewFrame: r, onDragStart: c, onDragEnd: a, onUpdatePip: d, onMovePip: m, onResizePip: u, onRemovePip: n, onAddPip: v }, s) {
    return /* @__PURE__ */ b("div", { id: "pip-manager", children: [
      /* @__PURE__ */ b("h3", { children: [
        "Windows — ",
        l
      ] }),
      /* @__PURE__ */ i(F, { ref: s, previewFrame: r, children: e.map((o) => /* @__PURE__ */ i(
        K,
        {
          pip: o,
          onDragStart: c,
          onDragEnd: a,
          onMove: (f, h) => m == null ? void 0 : m(o.id, f, h),
          onResize: (f, h) => u == null ? void 0 : u(o.id, f, h)
        },
        o.id
      )) }),
      e.map((o) => /* @__PURE__ */ b("div", { className: "pip-row", children: [
        /* @__PURE__ */ i(
          x,
          {
            label: "V",
            title: "Visible",
            active: !!o.visible,
            onClick: () => d == null ? void 0 : d(o.id, "visible", !o.visible)
          }
        ),
        /* @__PURE__ */ i(
          Y,
          {
            value: o.title ?? "",
            placeholder: "Title",
            onCommit: (f) => d == null ? void 0 : d(o.id, "title", f)
          }
        ),
        /* @__PURE__ */ i(
          Y,
          {
            value: o.videoId ?? "",
            placeholder: "YouTube video ID",
            onCommit: (f) => d == null ? void 0 : d(o.id, "videoId", f)
          }
        ),
        /* @__PURE__ */ i(x, { label: "×", title: "Remove window", onClick: () => n == null ? void 0 : n(o.id) })
      ] }, o.id)),
      /* @__PURE__ */ i(E, { label: "+ Add window", onClick: v })
    ] });
  }
);
function D({ presets: t, onRecall: l, onSave: e }) {
  const [r, c] = T(""), a = () => {
    e == null || e(r.trim() || `Preset ${t.length + 1}`), c("");
  };
  return /* @__PURE__ */ i("div", { id: "presets-bar", children: /* @__PURE__ */ b("div", { className: "bar", children: [
    t.map((d) => /* @__PURE__ */ i("button", { className: "preset", onClick: () => l == null ? void 0 : l(d.id), children: d.name }, d.id)),
    /* @__PURE__ */ i(
      "input",
      {
        type: "text",
        className: "preset-name-input",
        placeholder: "Preset name",
        value: r,
        onChange: (d) => c(d.target.value)
      }
    ),
    /* @__PURE__ */ i("button", { className: "save-btn", onClick: a, children: "+ Save current" })
  ] }) });
}
function S({ children: t }) {
  return /* @__PURE__ */ i(
    "div",
    {
      style: {
        background: "var(--ink)",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
        padding: "20px"
      },
      children: t
    }
  );
}
export {
  M as AudioOwner,
  q as BLEND_MODES,
  E as Button,
  z as ChannelRack,
  I as Chip,
  F as ConfidenceMonitor,
  Z as Faceplate,
  H as Fader,
  O as LayerStrip,
  K as PipBox,
  P as PipWindows,
  D as PresetsBar,
  _ as Select,
  Q as StatusLamp,
  Y as TextField,
  x as ToggleSquare,
  S as VenueGround,
  R as WarpEditor,
  G as WarpHandle
};
