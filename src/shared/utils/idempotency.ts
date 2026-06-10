/**
 * @file idempotency.ts
 * @route /src/shared/utils/idempotency.ts
 * @description Cache de claves de idempotencia en memoria para evitar
 *              procesamiento duplicado de mensajes MQTT y requests de API.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

const TTL_MS = 60_000;

interface Entry {
  resolvedAt: number;
}

const store = new Map<string, Entry>();

export function isProcessed(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  if (Date.now() - entry.resolvedAt > TTL_MS) {
    store.delete(key);
    return false;
  }
  return true;
}

export function markProcessed(key: string): void {
  store.set(key, { resolvedAt: Date.now() });
}

export function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (isProcessed(key)) return Promise.resolve(null);
  markProcessed(key);
  return fn();
}
