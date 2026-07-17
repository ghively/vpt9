// Shared capability probe for e2e specs that assert on a real <video> actually DECODING and
// ADVANCING frames — slot-texture motion, loopMode "once" stop-at-end, play/pause reflected
// in <video> state, a gif animating (which needs the same media pipeline). Headless Chromium
// in this sandbox can't decode/advance mp4: the element never leaves readyState 0 (a
// documented platform limitation — see CLAUDE.md's headless media/GPU caveat), so those
// assertions are unobservable here, NOT failing. Probe the capability against a known media
// url so callers can `test.skip()` cleanly (mirroring the server suite's ffmpeg-gated tests)
// instead of red-failing a video-only path; on a real GPU the probe passes and the test runs
// for real. Unlike the specs' inlined server bootstrap (kept per-file on purpose to avoid
// shared module STATE), this is a pure, stateless helper — safe to import across specs.
export async function videoCanAdvance(page, url) {
  return page.evaluate(async (u) => {
    const v = document.createElement("video");
    v.src = u;
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    document.body.appendChild(v);
    await v.play().catch(() => {});
    const t0 = v.currentTime;
    await new Promise((r) => setTimeout(r, 1200));
    const ok = v.readyState >= 2 && v.currentTime > t0;
    v.remove();
    return ok;
  }, url);
}
