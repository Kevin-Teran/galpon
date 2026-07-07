/**
 * @file isometric.ts
 * @route /src/app/(platform)/monitoring/_lib/isometric.ts
 * @description Geometría del diagrama isométrico del galpón, generalizada a partir de las
 *              posiciones fijas del mockup de diseño (4 bloques / 6 extractores) a cualquier
 *              cantidad real de nodos y ventiladores. Las posiciones del mockup avanzan con un
 *              paso lineal constante entre elementos consecutivos; acá se extrapola ese mismo
 *              paso para N elementos.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

export interface Point { x: number; y: number; }
export interface NodePanel {
  tn: Point; tf: Point; bf: Point; bn: Point;
  center: Point;
  /** Líneas diagonales internas (wireframe) que dan la sensación de bloque paneleado. */
  corr: { x1: number; y1: number; x2: number; y2: number }[];
}
export interface FanPosition {
  center: Point;
  /** Esquina superior-izquierda del anillo (círculo de 24x24) que enmarca el ícono. */
  ring: Point;
  /** Esquina superior-izquierda del ícono (15x15) centrado dentro del anillo. */
  icon: Point;
}

// Puntos base (nodo/ventilador índice 0) y deltas por paso, tal como aparecen en el mockup.
const NODE_TN_BASE: Point = { x: 350.4, y: 192.2 };
const NODE_TF_BASE: Point = { x: 411.6, y: 177.8 };
const NODE_BF_BASE: Point = { x: 411.6, y: 290.7 };
const NODE_BN_BASE: Point = { x: 350.4, y: 303.7 };
const NODE_TOP_DELTA: Point = { x: 78.2, y: -18.4 };
const NODE_BOTTOM_DELTA: Point = { x: 78.2, y: -16.55 };

const FAN_BASE: Point = { x: 165, y: 230.9 };
const FAN_DELTA: Point = { x: 30, y: 3.74 };

function step(base: Point, delta: Point, i: number): Point {
  return { x: base.x + delta.x * i, y: base.y + delta.y * i };
}

export function computeNodePanel(index: number): NodePanel {
  const tn = step(NODE_TN_BASE, NODE_TOP_DELTA, index);
  const tf = step(NODE_TF_BASE, NODE_TOP_DELTA, index);
  const bf = step(NODE_BF_BASE, NODE_BOTTOM_DELTA, index);
  const bn = step(NODE_BN_BASE, NODE_BOTTOM_DELTA, index);
  const center: Point = {
    x: (tn.x + tf.x + bf.x + bn.x) / 4,
    y: (tn.y + tf.y + bf.y + bn.y) / 4,
  };
  const corr = [1, 2, 3, 4].map((k) => {
    const f = k / 5;
    return {
      x1: tn.x + (tf.x - tn.x) * f, y1: tn.y + (tf.y - tn.y) * f,
      x2: bn.x + (bf.x - bn.x) * f, y2: bn.y + (bf.y - bn.y) * f,
    };
  });
  return { tn, tf, bf, bn, center, corr };
}

export function computeFanPosition(index: number): FanPosition {
  const center = step(FAN_BASE, FAN_DELTA, index);
  return {
    center,
    ring: { x: center.x - 12, y: center.y - 12 },
    icon: { x: center.x - 7.5, y: center.y - 7.5 },
  };
}

/**
 * viewBox de referencia del mockup original (4 bloques / 6 extractores) — incluye el galpón
 * (techo, costado, pared frontal) dibujado a coordenadas fijas. Se usa como piso mínimo y se
 * extiende hacia la derecha si el galpón real tiene más bloques/extractores que el mockup.
 */
const REFERENCE_VIEWBOX = { minX: 112, minY: 25, width: 705, height: 400 };

/** Calcula el viewBox necesario para que el galpón y todos los paneles/ventiladores entren. */
export function computeViewBox(nodeCount: number, fanCount: number) {
  const margin = 40;
  let maxX = REFERENCE_VIEWBOX.minX + REFERENCE_VIEWBOX.width;

  for (let i = 0; i < nodeCount; i++) {
    const p = computeNodePanel(i);
    maxX = Math.max(maxX, p.tn.x, p.tf.x, p.bf.x, p.bn.x);
  }
  for (let i = 0; i < fanCount; i++) {
    const f = computeFanPosition(i);
    maxX = Math.max(maxX, f.ring.x + 24);
  }

  return { ...REFERENCE_VIEWBOX, width: (maxX + margin) - REFERENCE_VIEWBOX.minX };
}
