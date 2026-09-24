// Minimal structured logger. Only event names, ids and non-sensitive metadata
// may be logged — never request bodies, e-mails, tokens or money amounts.
// Keys that look sensitive are redacted defensively.

const SENSITIVE = /(equity|income|salary|price|rent|amount|password|token|email|eigenkapital|gehalt|data)/i;

type Meta = Record<string, string | number | boolean | null | undefined>;

function redact(meta: Meta = {}): Meta {
  const out: Meta = {};
  for (const [k, v] of Object.entries(meta)) out[k] = SENSITIVE.test(k) ? "[redacted]" : v;
  return out;
}

function write(level: "info" | "warn" | "error", event: string, meta?: Meta) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...redact(meta) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, meta?: Meta) => write("info", event, meta),
  warn: (event: string, meta?: Meta) => write("warn", event, meta),
  /** Logs only the error's name/message, never the object (which may hold input data). */
  error: (event: string, err?: unknown, meta?: Meta) =>
    write("error", event, { ...meta, error: err instanceof Error ? err.name : String(typeof err) }),
};

export { redact as _redactForTests };
