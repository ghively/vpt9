import { useRef, useState } from "react";
import { TextField } from "./primitives/TextField";
import { ToggleSquare } from "./primitives/ToggleSquare";
import { Button } from "./primitives/Button";
import type { MediaItem, MediaKind } from "./types";

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
  onRemove?: (id: string) => void;
}

/** The persistent media-library pane: upload (with progress) + a row per file. Uploads
 *  go over HTTP (not the WS protocol); the server broadcasts a `create` on success, so
 *  the list re-renders from shared state without this component tracking it locally. */
export function MediaLibrary({ media, uploadUrl, onRename, onRemove }: MediaLibraryProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // XMLHttpRequest (not fetch) specifically for upload.onprogress on large files.
  const upload = (file: File) => {
    setError(null);
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
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <Button
          label={progress === null ? "+ Upload" : `Uploading ${progress}%`}
          onClick={() => fileRef.current?.click()}
        />
      </div>
      {error && <div className="media-error mono">{error}</div>}
      {media.length === 0 ? (
        <div className="empty-note">No media yet — upload an mp4, gif, or jpg.</div>
      ) : (
        media.map((m) => (
          <div className="media-row" key={m.id}>
            <span className="media-tag mono">{KIND_TAG[m.kind]}</span>
            <TextField className="media-name" value={m.name} onCommit={(v) => onRename?.(m.id, v)} />
            <span className="media-size mono">{formatSize(m.size)}</span>
            <ToggleSquare label="×" title="Delete media" onClick={() => onRemove?.(m.id)} />
          </div>
        ))
      )}
    </section>
  );
}
