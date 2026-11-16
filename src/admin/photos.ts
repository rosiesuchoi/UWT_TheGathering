// Member photos. An officer picks a picture; it is shrunk in the browser to a
// small web image, shown in the binder straight away, and uploaded with the
// next save as a new file in public/members/.
import { photoPreviews } from '../ui/edits';

/** Pictures picked but not saved yet, by file name. */
const pending = new Map<string, Blob>();

/** The longest side of the saved picture, in pixels. A card shows it far smaller. */
const MAX_SIDE = 720;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

export const PHOTO_DIR = 'public/members/';

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if ('createImageBitmap' in window) {
    try {
      // "from-image" turns a phone photo the right way up.
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height };
    } catch {
      // Fall through to the slower route.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

function slug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return base || 'member';
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 5);
}

/** Shrink a picked picture and remember it. Returns the file name to put in members.json. */
export async function addPhoto(file: File, memberName: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a picture file: JPG, PNG or WebP.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('That picture is too large. Pick one under 30 MB.');
  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error('This browser could not open that picture. Try a JPG or PNG.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(decoded.width, decoded.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(decoded.width * scale));
  canvas.height = Math.max(1, Math.round(decoded.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not shrink the picture.');
  ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

  // WebP is smallest. A browser that cannot write it hands back a PNG, so fall back to JPEG.
  let blob = await toBlob(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!blob) throw new Error('This browser could not shrink the picture.');

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${slug(memberName)}-${randomId()}.${ext}`;
  pending.set(name, blob);
  photoPreviews.set(name, URL.createObjectURL(blob));
  return name;
}

/** The address to show a photo from: the temporary one if it is not saved yet. */
export function photoSrc(name: string): string {
  return photoPreviews.get(name) ?? `${import.meta.env.BASE_URL}members/${name}`;
}

/** True while a photo has been picked but not saved. */
export const isPending = (name: string): boolean => pending.has(name);

/** The picked photos that are still in use, as base64 for the commit. */
export async function takePending(inUse: Set<string>): Promise<Array<{ name: string; base64: string }>> {
  const out: Array<{ name: string; base64: string }> = [];
  for (const [name, blob] of pending) {
    if (!inUse.has(name)) continue;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    out.push({ name, base64: dataUrl.slice(dataUrl.indexOf(',') + 1) });
  }
  return out;
}

/** Forget photos that were saved. Their temporary addresses keep working. */
export function markSaved(names: string[]): void {
  names.forEach((n) => pending.delete(n));
}
