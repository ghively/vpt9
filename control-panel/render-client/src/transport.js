// Shared clip-transport PLAYBACK logic for a single <video> element, used by both a
// layer's private video (layers.js) and a shared source-bank slot's video
// (source-bank.js). Because many layers can point at one slot, per-slot transport lives
// on the slot and drives the slot's own element here — a consuming layer never touches
// it (see layers.js render(): applyTransport is skipped for slot sources).
//
// Handles: play/pause, playback rate, loop-region seek-back, palindrome ping-pong, and
// scrub seek (task A11). It deliberately does NOT touch native `video.loop` (the layer
// path derives that from shouldLoop() — playlist items must NOT native-loop — and the
// slot path syncs it from loopMode itself), and it does NOT touch audio (pan/vol via Web
// Audio is layer-only, since shared slots stay muted per the audio-owner policy — that
// stays in layers.js).
//
// `entry` is any object used to stash per-element handler state across frames:
//   _loopHandler, _loopDir, _latestTransport, _seekVideo, _lastSeek.
// Reuse the same `entry` across frames for one element; when the element is REPLACED call
// clearTransportState(entry, oldVideo) first so a stale timeupdate handler doesn't keep
// firing on the dead element and the next element re-adopts seek cleanly.

// Native `video.loop` policy for a loopMode: only "loop"/"palindrome" repeat the whole
// clip; "off"/"once" play through and stop (task A10). Callers that own native-loop (the
// slot path) use this; the layer path uses shouldLoop() instead (playlist-aware).
export function nativeLoop(transport) {
  const mode = transport?.loopMode;
  return mode === "loop" || mode === "palindrome";
}

// Detach the loop handler and reset all per-element transport bookkeeping. Call this when
// the <video> element backing `entry` is about to be replaced or torn down.
export function clearTransportState(entry, video) {
  if (video && entry._loopHandler) video.removeEventListener("timeupdate", entry._loopHandler);
  entry._loopHandler = null;
  entry._loopDir = 1;
  entry._latestTransport = null;
  entry._seekVideo = null;
  entry._lastSeek = undefined;
}

function startPalindromeReverse(entry, transport) {
  const video = entry.videoEl;
  let last = performance.now();
  const step = (now) => {
    if (entry._loopDir !== -1 || !video) return;
    // Read the CURRENT transport each frame (entry._latestTransport is refreshed by
    // applyVideoTransport) so a pause or rate change mid-reverse takes effect — the old
    // closure-captured transport kept rewinding a paused palindrome layer forever.
    const t = entry._latestTransport ?? transport;
    if (t.playing === false) {
      // Hold position while paused, keep the reverse leg armed for resume.
      last = now;
      requestAnimationFrame(step);
      return;
    }
    // Real elapsed time, not an assumed 60 Hz tick — on 120/144 Hz displays the fixed
    // 1/60 step made the reverse leg run 2-2.4x too fast, breaking the ping-pong symmetry.
    const dt = Math.min(0.25, (now - last) / 1000) * Math.abs(t.rate ?? 1);
    last = now;
    video.currentTime = Math.max(t.loopIn, video.currentTime - dt);
    if (video.currentTime <= t.loopIn) {
      entry._loopDir = 1;
      video.play().catch(() => {});
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Scrub seek (task A11): transport.seek is a 0..1 fraction of the clip's duration. We
// apply it ONCE when it changes (tracked per-element via _lastSeek) rather than writing
// the value back to null every frame — a "track last-applied" approach chosen over the
// render-client clearing the seek in shared state, because with multiple render clients
// each holding its own <video>, a write-back-and-broadcast clear would race (one client
// nulling the seek before another had a chance to apply it). The tradeoff: seeking to the
// EXACT same fraction twice in a row is a no-op (a different value is required to re-fire).
function applySeek(video, t, entry) {
  // First frame for a freshly-attached element: adopt whatever seek is already in state
  // WITHOUT seeking, so a stale scrub value doesn't yank a newly-loaded clip. Only a
  // subsequent change to the value then triggers an actual seek.
  if (entry._seekVideo !== video) {
    entry._seekVideo = video;
    entry._lastSeek = t.seek;
    return;
  }
  const seek = t.seek;
  if (seek == null) {
    entry._lastSeek = seek;
    return;
  }
  if (seek === entry._lastSeek) return;
  const duration = video.duration;
  if (Number.isFinite(duration) && duration > 0) {
    video.currentTime = Math.min(duration, Math.max(0, seek * duration));
    entry._lastSeek = seek;
  }
  // If duration isn't known yet, leave _lastSeek unchanged so the seek retries next frame.
}

// Apply the transport's playback state to `video`, every frame. `transport` is the layer's
// or slot's transport object; `entry` holds the per-element handler bookkeeping.
export function applyVideoTransport(video, transport, entry) {
  if (!video || !transport) return;
  const t = transport;

  // `!video.ended`: a non-looping clip ("off"/"once", task A10) that has played through
  // sits paused at its last frame with `playing` still true — re-calling play() here would
  // restart it from the top (the browser rewinds an ended element on play), turning "once"
  // into an accidental loop. Leave it stopped; scrubbing (which clears `ended`) resumes it.
  if (t.playing && video.paused && !video.ended) video.play().catch(() => {});
  if (!t.playing && !video.paused) video.pause();
  video.playbackRate = Math.max(0.0625, t.rate ?? 1); // browsers reject 0 and clamp very small values inconsistently; floor it

  // Loop / palindrome region. The handler reads the current region + mode from
  // _latestTransport on every `timeupdate`, and _latestTransport is refreshed (or cleared)
  // here on every call — so turning loop OFF (mode "off"/"once", or blanking loopIn/loopOut)
  // actually releases the clip instead of leaving the old handler firing on stale bounds.
  const loopActive =
    t.loopMode !== "off" && t.loopMode !== "once" && t.loopIn != null && t.loopOut != null && t.loopOut > t.loopIn;
  entry._latestTransport = loopActive ? t : null;
  if (loopActive && !entry._loopHandler) {
    entry._loopDir = 1;
    entry._loopHandler = () => {
      const layerT = entry._latestTransport;
      if (!layerT) return;
      if (layerT.loopMode === "palindrome") {
        if (entry._loopDir === 1 && video.currentTime >= layerT.loopOut) {
          entry._loopDir = -1;
          video.pause();
          startPalindromeReverse(entry, layerT);
        }
      } else if (video.currentTime >= layerT.loopOut) {
        video.currentTime = layerT.loopIn;
      }
    };
    video.addEventListener("timeupdate", entry._loopHandler);
  } else if (!loopActive && entry._loopHandler) {
    // Loop disabled: detach the handler and cancel any in-flight palindrome reverse (its
    // rAF loop bails when _loopDir !== -1).
    video.removeEventListener("timeupdate", entry._loopHandler);
    entry._loopHandler = null;
    entry._loopDir = 1;
  }

  applySeek(video, t, entry);
}
