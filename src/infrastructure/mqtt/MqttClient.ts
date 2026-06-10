/**
 * @file MqttClient.ts
 * @route /src/infrastructure/mqtt/MqttClient.ts
 * @description Singleton de conexión al broker MQTT externo.
 *              Expone métodos para suscribirse a topics y publicar mensajes.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import mqtt, { MqttClient as IMqttClient } from "mqtt";

let client: IMqttClient | null = null;

export function getMqttClient(): IMqttClient {
  if (client && client.connected) return client;

  const brokerUrl = process.env.MQTT_BROKER_URL;
  if (!brokerUrl) throw new Error("MQTT_BROKER_URL no configurada");

  client = mqtt.connect(brokerUrl, {
    clientId: process.env.MQTT_CLIENT_ID ?? "galpon-server",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000,
    connectTimeout: 10_000,
    clean: true,
  });

  client.on("connect", () =>
    console.info("[MQTT] Conectado al broker:", brokerUrl)
  );
  client.on("error", (err) => console.error("[MQTT] Error:", err.message));
  client.on("reconnect", () => console.warn("[MQTT] Reconectando..."));
  client.on("offline", () => console.warn("[MQTT] Cliente offline"));

  return client;
}

export function publishCommand(
  hardwareId: string,
  action: "on" | "off"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const mqttClient = getMqttClient();
    mqttClient.publish(hardwareId, action, { qos: 1 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
