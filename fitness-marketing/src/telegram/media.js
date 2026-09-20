import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { ROOT } from "../lib/io.js";

export function mediaDir() {
  const dir = join(ROOT, "output", "media");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Download a Telegram file (photo/video/document) to output/media/
 */
export async function downloadTelegramFile(apiBase, fileId, suggestedName = "media.bin") {
  const metaRes = await fetch(`${apiBase}/getFile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file_id: fileId })
  });
  const meta = await metaRes.json();
  if (!meta.ok) throw new Error(meta.description || "getFile failed");

  const filePath = meta.result.file_path;
  const token = apiBase.split("/bot").pop();
  const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const ext = (filePath.split(".").pop() || "bin").toLowerCase();
  const base = String(suggestedName)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 80);
  const localName = base.includes(".")
    ? `${Date.now()}-${base}`
    : `${Date.now()}-${base}.${ext}`;
  const localPath = join(mediaDir(), localName);

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(localPath));

  return {
    localPath,
    localName,
    telegramPath: filePath,
    size: meta.result.file_size || null,
    ext
  };
}

export function pickMediaFromMessage(msg) {
  if (msg.video) {
    return {
      type: "video",
      fileId: msg.video.file_id,
      name: msg.video.file_name || "video.mp4",
      meta: {
        duration: msg.video.duration,
        width: msg.video.width,
        height: msg.video.height,
        mime: msg.video.mime_type
      }
    };
  }
  if (msg.video_note) {
    return {
      type: "video_note",
      fileId: msg.video_note.file_id,
      name: "video_note.mp4",
      meta: {
        duration: msg.video_note.duration,
        width: msg.video_note.length,
        height: msg.video_note.length
      }
    };
  }
  if (msg.animation) {
    return {
      type: "animation",
      fileId: msg.animation.file_id,
      name: msg.animation.file_name || "anim.mp4",
      meta: {
        duration: msg.animation.duration,
        width: msg.animation.width,
        height: msg.animation.height
      }
    };
  }
  if (msg.photo?.length) {
    const best = msg.photo[msg.photo.length - 1];
    return {
      type: "photo",
      fileId: best.file_id,
      name: "photo.jpg",
      meta: { width: best.width, height: best.height }
    };
  }
  if (msg.document?.mime_type?.startsWith("video/")) {
    return {
      type: "video",
      fileId: msg.document.file_id,
      name: msg.document.file_name || "video.mp4",
      meta: { mime: msg.document.mime_type }
    };
  }
  if (msg.document) {
    return {
      type: "document",
      fileId: msg.document.file_id,
      name: msg.document.file_name || "file.bin",
      meta: { mime: msg.document.mime_type }
    };
  }
  return null;
}
