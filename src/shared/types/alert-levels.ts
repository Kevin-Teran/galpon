/**
 * @file alert-levels.ts
 * @route /src/shared/types/alert-levels.ts
 * @description Niveles de alerta del sistema de monitoreo.
 *              Define la escala de criticidad y las contraseñas de acción correspondientes.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

export enum AlertLevel {
  GREEN = "GREEN",
  YELLOW_LOW = "YELLOW_LOW",
  YELLOW_HIGH = "YELLOW_HIGH",
  RED_LOW = "RED_LOW",
  RED_HIGH = "RED_HIGH",
}

export enum DeviceType {
  PUMP = "PUMP",
  FAN = "FAN",
}

export enum DeviceAction {
  ON = "ON",
  OFF = "OFF",
}

export enum EventReason {
  YELLOW_LOW = "YELLOW_LOW",
  YELLOW_HIGH = "YELLOW_HIGH",
  RED_LOW = "RED_LOW",
  RED_HIGH = "RED_HIGH",
  MANUAL = "MANUAL",
  SCHEDULE = "SCHEDULE",
}

export enum NodeType {
  INTERIOR = "INTERIOR",
  EXTERIOR = "EXTERIOR",
}

export const ALERT_LEVEL_PRIORITY: Record<AlertLevel, number> = {
  [AlertLevel.GREEN]: 0,
  [AlertLevel.YELLOW_LOW]: 1,
  [AlertLevel.YELLOW_HIGH]: 1,
  [AlertLevel.RED_LOW]: 2,
  [AlertLevel.RED_HIGH]: 2,
};

export function isRedLevel(level: AlertLevel): boolean {
  return level === AlertLevel.RED_LOW || level === AlertLevel.RED_HIGH;
}

export function isYellowLevel(level: AlertLevel): boolean {
  return level === AlertLevel.YELLOW_LOW || level === AlertLevel.YELLOW_HIGH;
}
