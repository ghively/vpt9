import { useRef, useState } from "react";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { MediaItem, MediaKind } from "./types";
import { parseTags } from "./tags";

const KIND_TAG: Record<MediaKind, string> = { video: "MP4", gif: "GIF", image: "JPG" };

function formatSize(bytes: number): string {
  if (bytes >= 1 << 30) return `${(bytes / (1 << 30)).toFixed(1)} GB`;
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(0)} MB`;
  if (bytes >= 1 << 10) return `${(bytes / (1 << 10)).toFixed(0)} KB`;
  return `${bytes} B`;
}


export interface MediaLibraryProps {
  media: MediaItem[];
  /** POST target for uploads, e.g. "http://host:8080/api/media". */
  uploadUrl: string;
  onRename?: (id: string, name: string) => void;
  /** Commit a row's full tag list (media.<id>.tags — see actions.setMediaTags). */
  onSetTags?: (id: string, tags: string[]) => void;
  onRemove?: (id: string) => void;
  /** Camera record-to-disk (task A14b): true while a recording is in progress. When set,
   *  the record button lights and toggling it stops + saves the clip to this library. */
  recording?: boolean;
  onToggleRecord?: () => void;
}

/** The persistent media-library pane: upload (with progress) + a record-from-camera toggle
 *  + a row per file. Uploads go over HTTP (not the WS protocol); the server broadcasts a
 *  `create` on success (including when a finished recording is uploaded by the render
 *  client), so the list re-renders from shared state without this component tracking it. */
export function MediaLibrary({ media, uploadUrl, onRename, onSetTags, onRemove, recording = false, onToggleRecord }: MediaLibraryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // XMLHttpRequest (not fetch) specifically for upload.onprogress on large files.
  const upload = (file: File) => {
    setError(null);
    // Mark the upload in-flight IMMEDIATELY — the `progress === null` guards on the
    // button/input otherwise allow a second concurrent upload during the window before
    // the first onprogress event (or forever, when length isn't computable).
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("X-File-Name", file.name);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = `upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* keep default */ }
        setError(msg);
      }
    };
    xhr.onerror = () => { setProgress(null); setError("upload failed (network error)"); };
    xhr.send(file);
  };

  return (
    <section id="media-library" className="sc-card">
      <div className="media-head">
        <h3>Media library</h3>
        <input
          ref={fileRef}
          type="file"
          className="media-file-input"
          accept="video/mp4,image/gif,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && progress === null) upload(file);
            e.target.value = "";
          }}
        />
        <Button
          label={progress === null ? "+ Upload" : `Uploading ${progress}%`}
          onClick={() => {
            if (progress === null) fileRef.current?.click();
          }}
        />
        {onToggleRecord && (
          <ToggleSquare
            className="media-record-btn"
            label={recording ? "■ Stop" : "● Rec"}
            tone="live"
            active={recording}
            title={
              recording
                ? "Stop recording and save the clip to the library"
                : "Record the live camera feed to the library (the render client with the camera captures it)"
            }
            onClick={onToggleRecord}
          />
        )}
      </div>
      {error && <div className="media-error mono">{error}</div>}
      {media.length === 0 ? (
        <div className="empty-note">No media yet — upload an mp4, gif, or jpg.</div>
      ) : (
        media.map((m) => (
          <div className="media-row" key={m.id}>
            <span className="media-tag mono">{KIND_TAG[m.kind]}</span>
            <div className="media-fields">
              <TextField className="media-name" value={m.name} onCommit={(v) => onRename?.(m.id, v)} />
              {onSetTags && (
                <TextField
                  className="media-tags mono"
                  placeholder="tags, comma-separated…"
                  title="Organization tags — the media bin can filter by these"
                  value={(m.tags ?? []).join(", ")}
                  onCommit={(v) => onSetTags(m.id, parseTags(v))}
                />
              )}
            </div>
            <span className="media-size mono">{formatSize(m.size)}</span>
            <ToggleSquare label="×" title="Delete media" onClick={() => onRemove?.(m.id)} />
          </div>
        ))
      )}
    </section>
  );
}
