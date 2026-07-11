import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'node:stream';

// music-metadata is ESM-only. The API compiles to CommonJS, so we can't
// static-import it — use a lazy dynamic import instead, cached in a module-
// scope promise so it only loads once per process. Typed loosely: we only
// touch `format.duration` on the return.
type ParseStreamFn = (
  stream: Readable,
  fileInfo: { mimeType?: string; size?: number },
  opts: { duration: boolean },
) => Promise<{ format?: { duration?: number } }>;

let parseStreamPromise: Promise<ParseStreamFn> | null = null;
function getParseStream(): Promise<ParseStreamFn> {
  if (!parseStreamPromise) {
    parseStreamPromise = (
      new Function('return import("music-metadata")')() as Promise<{
        parseStream: ParseStreamFn;
      }>
    ).then((m) => m.parseStream);
  }
  return parseStreamPromise;
}

// Bytes to fetch when probing an audio URL. music-metadata reads the file
// header to determine duration for common formats (mp3, m4a, ogg); the
// header lives in the first few hundred KB. 512 KB is generous — covers
// ID3v2 tags and MP4/M4A moov boxes that sit before the audio data.
const PROBE_HEAD_BYTES = 512 * 1024;

// Per-URL probe budget. Bad URLs, slow storage, or rate-limited CDNs will
// exceed this — we log and return null rather than blocking an admin save
// on network conditions we can't control.
const PROBE_TIMEOUT_MS = 5000;

@Injectable()
export class AudioProbeService {
  private readonly logger = new Logger(AudioProbeService.name);

  // Fetches the first PROBE_HEAD_BYTES of a URL via HTTP Range and reads
  // duration from the audio header. Returns null on any failure (network
  // error, non-2xx response, unparseable body, timeout). Callers should
  // fall back to 0 or leave the field unchanged rather than throwing —
  // audio duration is a nice-to-have stat, not a correctness invariant.
  async probeDurationMs(url: string): Promise<number | null> {
    if (!url) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Ask for only the head bytes. Servers that ignore Range still
          // stream the whole file — we cap the read below.
          Range: `bytes=0-${PROBE_HEAD_BYTES - 1}`,
        },
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 206) {
        this.logger.warn(
          `probeDurationMs: non-ok status ${response.status} for ${url}`,
        );
        return null;
      }

      if (!response.body) {
        this.logger.warn(`probeDurationMs: empty body for ${url}`);
        return null;
      }

      // Convert the WHATWG stream to a Node Readable and cap the total
      // bytes read. music-metadata reads only what it needs off the front,
      // but the cap defends against servers that ignore Range headers.
      const nodeStream = Readable.fromWeb(response.body as any);
      const capped = capReadableToBytes(nodeStream, PROBE_HEAD_BYTES);

      const contentType =
        response.headers.get('content-type') ?? 'audio/mpeg';

      const parseStream = await getParseStream();
      const meta = await parseStream(
        capped,
        { mimeType: contentType, size: undefined },
        { duration: true },
      );
      const durationSec = meta.format?.duration;
      if (!Number.isFinite(durationSec) || (durationSec ?? 0) <= 0) {
        this.logger.warn(
          `probeDurationMs: no duration in metadata for ${url}`,
        );
        return null;
      }
      return Math.round((durationSec as number) * 1000);
    } catch (err) {
      // AbortError is expected on timeout — logged at debug, not warn.
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') {
        this.logger.debug?.(`probeDurationMs: timeout for ${url}`);
      } else {
        this.logger.warn(
          `probeDurationMs: failed for ${url}: ${(err as Error).message}`,
        );
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Wrap a Node Readable so it emits at most `maxBytes` and then ends. Prevents
// runaway reads when a server ignores our Range request.
function capReadableToBytes(source: Readable, maxBytes: number): Readable {
  let read = 0;
  const out = new Readable({ read() {} });
  source.on('data', (chunk: Buffer) => {
    if (read >= maxBytes) return;
    const remaining = maxBytes - read;
    if (chunk.length <= remaining) {
      out.push(chunk);
      read += chunk.length;
    } else {
      out.push(chunk.subarray(0, remaining));
      read = maxBytes;
      source.destroy();
      out.push(null);
    }
  });
  source.on('end', () => out.push(null));
  source.on('error', (err) => out.destroy(err));
  return out;
}
