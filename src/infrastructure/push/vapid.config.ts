/**
 * @file vapid.config.ts
 * @route /src/infrastructure/push/vapid.config.ts
 * @description Configuración de claves VAPID para Web Push.
 *              Generar claves con: npx web-push generate-vapid-keys
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import webpush from "web-push";

let initialized = false;

export function initVapid(): void {
  if (initialized) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@galpon.app";

  if (!publicKey || !privateKey) {
    console.warn("[VAPID] Claves no configuradas — push notifications deshabilitadas");
    return;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  initialized = true;
}

export { webpush };
