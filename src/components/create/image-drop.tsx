"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 800;

/**
 * Crops to a centred square and re-encodes to JPEG in the browser before
 * uploading.
 *
 * JPEG rather than WebP on purpose: Satori, which renders the OG link
 * previews, cannot decode WebP, so WebP portraits were silently missing from
 * every shared card. Browsers never see this file directly — next/image
 * re-encodes to WebP or AVIF on the way out — so the only cost is a slightly
 * larger object in the bucket.
 *
 * Doing it here rather than server-side is what lets every card assume a 1:1
 * portrait: the contract is enforced at the only point where a non-square
 * image can still be rejected cheaply, and it turns a 4MB phone photo into
 * ~80KB before it ever crosses the network.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      "image/jpeg",
      0.88,
    );
  });
}

export function ImageDrop({
  value,
  onChange,
  accent,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  accent: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("That image is over 5MB.");
      return;
    }
    setBusy(true);
    try {
      const blob = await toSquareJpeg(file);

      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: "image/jpeg" }),
      });
      if (!presign.ok) {
        const data = (await presign.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Upload unavailable");
      }
      const { uploadUrl, publicUrl } = (await presign.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      // Every key is unique, so a URL's bytes never change and can be cached
      // forever. Set here rather than server-side because content-type and
      // cache-control are not part of the presigned signature.
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "content-type": "image/jpeg",
          "cache-control": "public, max-age=31536000, immutable",
        },
        body: blob,
      });
      if (!put.ok) throw new Error("Upload failed");

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={cn(
          "press relative grid aspect-square w-full place-items-center overflow-hidden rounded-inner border-2 border-dashed",
          value ? "border-transparent" : "border-rule-strong hover:border-ink",
        )}
        style={
          value
            ? { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: `color-mix(in oklch, ${accent} 12%, white)` }
        }
      >
        {busy ? (
          <span className="text-xs font-bold text-ink-soft">Uploading…</span>
        ) : value ? (
          <span className="absolute bottom-2 right-2 rounded-pill bg-ink/85 px-2.5 py-1 text-[0.7rem] font-bold text-paper">
            Change
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-soft">
            <Icon name="plus" size={22} strong />
            <span className="text-xs font-bold">Add a photo</span>
            <span className="text-[0.7rem] text-ink-faint">Cropped to a square</span>
          </span>
        )}
      </button>

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
          e.target.value = "";
        }}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1.5 text-xs font-semibold text-ink-faint hover:text-berry"
        >
          Remove photo
        </button>
      )}
      {error && <p className="mt-1.5 text-xs font-semibold text-berry">{error}</p>}
    </div>
  );
}
