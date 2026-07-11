import { Injectable, Logger } from '@nestjs/common';

// Thin wrapper around PostHog's Query API. We only need HogQL reads here —
// no ingest, no events, no dashboard config. Config comes from env; when
// any of the three env vars is missing the service short-circuits every
// query to null so consumers can treat "no analytics configured" the same
// as "PostHog unreachable" — both cases fall back to zero counters.

const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const HOST = process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com';

// Bounded per-query wait — PostHog usually responds in <500ms but occasional
// spikes hit multiple seconds. We cap at 5s so a slow PostHog can't hold
// up a cache miss on /public/web/usage-stats past a reasonable landing-
// page render budget. On timeout we return null and the endpoint serves
// zeros with a warning in the logs.
const QUERY_TIMEOUT_MS = 5_000;

@Injectable()
export class PostHogQueryService {
  private readonly logger = new Logger(PostHogQueryService.name);

  isConfigured(): boolean {
    return !!(PROJECT_ID && PERSONAL_API_KEY);
  }

  // Runs a HogQL query and returns the first row's first column as a number.
  // Every query we send is `SELECT <aggregate> FROM events WHERE ...` which
  // always yields one row + one column. Returns null on any failure —
  // callers fall back to 0.
  async querySingleNumber(hogql: string): Promise<number | null> {
    const results = await this.queryRows(hogql);
    if (!results || results.length === 0) return 0;
    const firstRow = results[0];
    if (!Array.isArray(firstRow) || firstRow.length === 0) return 0;
    const value = firstRow[0];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value == null) return 0;
    // HogQL sometimes returns numeric-strings for sum/count aggregates
    // depending on the underlying column type. Best-effort parse.
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Runs a HogQL query and returns the raw `results` rows (each row is an
  // array of column values, positional). Callers project into their own
  // shape. Returns null on any failure so callers can distinguish "empty
  // result set" (returns []) from "network / auth failure" (returns null).
  async queryRows(hogql: string): Promise<unknown[][] | null> {
    if (!this.isConfigured()) {
      this.logger.debug?.('PostHog not configured — skipping query.');
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
    try {
      const res = await fetch(`${HOST}/api/projects/${PROJECT_ID}/query/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PERSONAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: { kind: 'HogQLQuery', query: hogql },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`PostHog query ${res.status}: ${text.slice(0, 200)}`);
        return null;
      }
      const json = (await res.json()) as unknown;
      const results = (json as { results?: unknown[] }).results;
      if (!Array.isArray(results)) return [];
      // Filter out any non-array rows defensively — HogQL is well-behaved
      // here but the JSON shape is nominally unknown.
      return results.filter((r): r is unknown[] => Array.isArray(r));
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') {
        this.logger.warn(
          `PostHog query timed out after ${QUERY_TIMEOUT_MS}ms.`,
        );
      } else {
        this.logger.warn(`PostHog query failed: ${(err as Error).message}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
