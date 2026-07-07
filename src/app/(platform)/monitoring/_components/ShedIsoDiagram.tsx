/**
 * @file ShedIsoDiagram.tsx
 * @route /src/app/(platform)/monitoring/_components/ShedIsoDiagram.tsx
 * @description Diagrama isométrico del galpón — porteado literalmente del markup SVG del
 *              mockup de diseño (techo, costado y pared frontal con gradientes, extractores
 *              tipo "pin" y bloques de sensores), con datos reales en vivo. La cantidad de
 *              bloques y extractores es variable según el galpón (ver _lib/isometric.ts).
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState } from "react";
import { Modal } from "@/app/_ui/Modal";
import { computeFanPosition, computeNodePanel, computeViewBox } from "../_lib/isometric";

export type NodeLevel = "GREEN" | "YELLOW_LOW" | "YELLOW_HIGH" | "RED_LOW" | "RED_HIGH" | "NONE";

export interface DiagramNode {
  id: string;
  name: string;
  level: NodeLevel;
  intTemp?: number;
  intHum?: number;
  extTemp?: number;
  extHum?: number;
  pumpOnCount: number;
  pumpTotal: number;
}

export interface DiagramFan {
  id: string;
  name: string;
  fanNumber: number;
  isOn: boolean;
}

const LEVEL_COLOR: Record<NodeLevel, string> = {
  GREEN: "oklch(0.68 0.16 150)",
  YELLOW_LOW: "oklch(0.7 0.15 70)",
  YELLOW_HIGH: "oklch(0.7 0.15 70)",
  RED_LOW: "oklch(0.6 0.2 25)",
  RED_HIGH: "oklch(0.6 0.2 25)",
  NONE: "var(--text-muted)",
};

export function ShedIsoDiagram({ nodes, fans }: { nodes: DiagramNode[]; fans: DiagramFan[] }) {
  const [detail, setDetail] = useState<{ kind: "node"; data: DiagramNode } | { kind: "fan"; data: DiagramFan } | null>(null);

  const vb = computeViewBox(nodes.length, fans.length);
  const pct = (p: { x: number; y: number }) => ({
    left: `${(((p.x - vb.minX) / vb.width) * 100).toFixed(2)}%`,
    top: `${(((p.y - vb.minY) / vb.height) * 100).toFixed(2)}%`,
  });

  const nodePanels = nodes.map((n, i) => ({ node: n, geo: computeNodePanel(i), color: LEVEL_COLOR[n.level] }));
  const fanDots    = fans.map((f, i) => ({ fan: f, geo: computeFanPosition(i) }));

  return (
    <div className="rounded-2xl border border-(--border) bg-(--bg-surface) p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_22px_-16px_rgba(0,0,0,.18)]">
      <h3 className="font-semibold text-(--text-primary) text-sm mb-1">Vista del galpón</h3>
      <p className="text-xs text-(--text-muted) mb-4">Bloques de sensores en el costado · extractores al frente · toca un componente para ver el detalle</p>

      <div
        className="rounded-2xl p-2"
        style={{ border: "1px solid var(--border)", background: "linear-gradient(180deg, color-mix(in oklab, var(--accent), transparent 94%), var(--bg-subtle) 90%)" }}
      >
        <div className="relative overflow-x-auto">
          <svg viewBox={`${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`} className="block w-full h-auto" style={{ fontFamily: "'IBM Plex Mono', monospace", minWidth: 560 }}>
            <defs>
              <linearGradient id="gpRoofF" x1="0" y1="0" x2="0.35" y2="1">
                <stop offset="0" style={{ stopColor: "var(--bg-surface)" }} />
                <stop offset="1" style={{ stopColor: "var(--bg-subtle)" }} />
              </linearGradient>
              <linearGradient id="gpSide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "color-mix(in oklab, var(--accent), transparent 84%)" }} />
                <stop offset="1" style={{ stopColor: "color-mix(in oklab, var(--accent), transparent 93%)" }} />
              </linearGradient>
              <linearGradient id="gpFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "color-mix(in oklab, var(--accent), transparent 74%)" }} />
                <stop offset="1" style={{ stopColor: "color-mix(in oklab, var(--accent), transparent 86%)" }} />
              </linearGradient>
              <radialGradient id="gpGround" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="rgba(0,0,0,0.13)" />
                <stop offset="0.7" stopColor="rgba(0,0,0,0.05)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* sombra de contacto */}
            <ellipse cx={415} cy={340} rx={300} ry={46} fill="url(#gpGround)" />
            {/* techo: faldón trasero */}
            <polygon points="150,158 240,140 580,60 490,78" style={{ fill: "var(--bg-subtle)", stroke: "var(--border)", strokeWidth: 1.6, strokeLinejoin: "round", opacity: 0.8 }} />
            {/* techo: faldón frontal */}
            <polygon points="240,140 330,183 670,103 580,60" style={{ fill: "url(#gpRoofF)", stroke: "var(--border)", strokeWidth: 1.8, strokeLinejoin: "round" }} />
            <line x1={312} y1={174.4} x2={652} y2={94.4} style={{ stroke: "var(--border)", strokeWidth: 1.1, opacity: 0.4 }} />
            <line x1={294} y1={165.8} x2={634} y2={85.8} style={{ stroke: "var(--border)", strokeWidth: 1.1, opacity: 0.4 }} />
            <line x1={276} y1={157.2} x2={616} y2={77.2} style={{ stroke: "var(--border)", strokeWidth: 1.1, opacity: 0.4 }} />
            <line x1={258} y1={148.6} x2={598} y2={68.6} style={{ stroke: "var(--border)", strokeWidth: 1.1, opacity: 0.4 }} />
            {/* cumbrera */}
            <line x1={240} y1={140} x2={580} y2={60} style={{ stroke: "var(--text-muted)", strokeWidth: 2, opacity: 0.45, strokeLinecap: "round" }} />
            {/* gable frontal */}
            <polygon points="150,158 240,140 330,183" style={{ fill: "color-mix(in oklab, var(--accent), transparent 70%)", stroke: "var(--border)", strokeWidth: 1.6, strokeLinejoin: "round" }} />
            {/* costado (paneles de enfriamiento) */}
            <polygon points="330,183 670,103 670,248 330,320" style={{ fill: "url(#gpSide)", stroke: "var(--border)", strokeWidth: 1.8, strokeLinejoin: "round" }} />
            <polygon points="330,310 670,238 670,248 330,320" fill="rgba(0,0,0,0.08)" />
            {/* frente (pared de extractores) */}
            <polygon points="150,158 330,183 330,320 150,300" style={{ fill: "url(#gpFront)", stroke: "var(--border)", strokeWidth: 1.8, strokeLinejoin: "round" }} />
            <polygon points="150,290 330,310 330,320 150,300" fill="rgba(0,0,0,0.12)" />

            {/* NODOS (bloques de sensores) clicables */}
            {nodePanels.map(({ node, geo, color }) => (
              <g key={node.id} className="cursor-pointer" onClick={() => setDetail({ kind: "node", data: node })}>
                <polygon
                  points={`${geo.tn.x},${geo.tn.y} ${geo.tf.x},${geo.tf.y} ${geo.bf.x},${geo.bf.y} ${geo.bn.x},${geo.bn.y}`}
                  style={{ fill: `color-mix(in oklab, ${color}, transparent 82%)`, stroke: color, strokeWidth: 3, strokeLinejoin: "round" }}
                />
                {geo.corr.map((c, i) => (
                  <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} style={{ stroke: color, strokeWidth: 1, opacity: 0.28 }} />
                ))}
              </g>
            ))}

            {/* EXTRACTORES tipo "pin" clicables */}
            {fanDots.map(({ fan, geo }) => {
              const color = fan.isOn ? "var(--accent)" : "var(--border)";
              return (
                <g key={fan.id} className="cursor-pointer" onClick={() => setDetail({ kind: "fan", data: fan })}>
                  <rect x={geo.ring.x} y={geo.ring.y} width={24} height={24} rx={5} style={{ fill: fan.isOn ? "color-mix(in oklab, var(--accent), transparent 82%)" : "var(--bg-subtle)", stroke: color, strokeWidth: 2 }} />
                  <circle cx={geo.center.x} cy={geo.center.y} r={9.5} style={{ fill: "var(--bg-surface)", stroke: color, strokeWidth: 1.2 }} />
                  <g transform={`translate(${geo.icon.x}, ${geo.icon.y}) scale(0.62)`}>
                    <g style={fan.isOn ? { transformOrigin: "12px 12px", animation: "spin 1.6s linear infinite" } : undefined}>
                      <path
                        d="M12 10c0-3 1-4 2.5-4S16 8 14 9.5 M14 14c3 0 4 1 4 2.5S16 18 14.5 16 M10 14c0 3-1 4-2.5 4S8 16 10 14.5 M10 10c-3 0-4-1-4-2.5S8 6 9.5 8"
                        fill="none" stroke={fan.isOn ? "var(--accent)" : "var(--text-muted)"} strokeWidth={2.4} strokeLinecap="round"
                      />
                      <circle cx={12} cy={12} r={2} fill={fan.isOn ? "var(--accent)" : "var(--text-muted)"} />
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Etiquetas de bloque superpuestas (HTML, para tipografía real) */}
          <div className="absolute inset-0 pointer-events-none">
            {nodePanels.map(({ node, geo, color }) => {
              const p = pct(geo.center);
              return (
                <div key={node.id} className="absolute" style={{ left: p.left, top: p.top, transform: "translate(-50%,-50%)" }}>
                  <div className="rounded-lg border border-(--border) bg-(--bg-surface) px-2 py-1 text-center shadow-[0_4px_11px_-7px_rgba(0,0,0,.4)]">
                    <div className="flex items-center justify-center gap-1 text-[8.5px] text-(--text-muted) whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      {node.name}
                    </div>
                    <div className="font-bold text-[15px] leading-tight text-(--text-primary)">
                      {node.intTemp !== undefined ? `${node.intTemp.toFixed(1)}°` : "—"}
                    </div>
                    <div className="text-[9px] text-(--text-muted) whitespace-nowrap">
                      {node.intHum !== undefined ? `${node.intHum}% HR` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 justify-center flex-wrap mt-2.5 text-[11.5px] text-(--text-muted)" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-(--accent)" />Extractor encendido</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-(--text-muted) bg-(--bg-subtle)" />Extractor apagado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px]" style={{ border: "2px solid oklch(0.68 0.16 150)" }} />Bloque · temp / HR</span>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <Modal open={!!detail} title={detail?.kind === "node" ? detail.data.name : detail ? `Extractor ${detail.data.fanNumber}` : ""} onClose={() => setDetail(null)}>
        {detail?.kind === "node" && (
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex-1 min-w-32 rounded-xl p-3.5" style={{ background: "color-mix(in oklab, oklch(0.65 0.17 40), transparent 90%)", border: "1px solid color-mix(in oklab, oklch(0.65 0.17 40), transparent 78%)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.17 40)" }} />
                <span className="text-[10px] tracking-wider font-semibold" style={{ color: "oklch(0.58 0.16 40)" }}>EXTERIOR</span>
              </div>
              <div className="flex items-end gap-3.5 mt-3">
                <div>
                  <div className="font-bold text-2xl leading-none" style={{ color: "oklch(0.58 0.17 40)" }}>
                    {detail.data.extTemp !== undefined ? `${detail.data.extTemp.toFixed(1)}°` : "—"}
                  </div>
                  <div className="text-[10px] text-(--text-muted) mt-0.5">temp</div>
                </div>
                <div>
                  <div className="font-bold text-lg leading-none text-(--text-primary) opacity-75">
                    {detail.data.extHum !== undefined ? `${detail.data.extHum}%` : "—"}
                  </div>
                  <div className="text-[10px] text-(--text-muted) mt-0.5">HR</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-32 rounded-xl p-3.5" style={{ background: "color-mix(in oklab, var(--accent), transparent 90%)", border: "1px solid color-mix(in oklab, var(--accent), transparent 76%)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />
                <span className="text-[10px] tracking-wider font-semibold text-(--accent)">INTERIOR</span>
              </div>
              <div className="flex items-end gap-3.5 mt-3">
                <div>
                  <div className="font-bold text-2xl leading-none text-(--accent)">
                    {detail.data.intTemp !== undefined ? `${detail.data.intTemp.toFixed(1)}°` : "—"}
                  </div>
                  <div className="text-[10px] text-(--text-muted) mt-0.5">temp</div>
                </div>
                <div>
                  <div className="font-bold text-lg leading-none text-(--text-primary) opacity-75">
                    {detail.data.intHum !== undefined ? `${detail.data.intHum}%` : "—"}
                  </div>
                  <div className="text-[10px] text-(--text-muted) mt-0.5">HR</div>
                </div>
              </div>
            </div>
            <div className="w-full rounded-xl p-3 bg-(--bg-subtle) flex items-center justify-between text-sm">
              <span className="text-(--text-muted)">Bombas</span>
              <span className="font-medium text-(--text-primary)">{detail.data.pumpOnCount}/{detail.data.pumpTotal} activas</span>
            </div>
          </div>
        )}
        {detail?.kind === "fan" && (
          <div className="flex flex-col items-center gap-3.5 py-3.5">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center bg-(--bg-subtle)"
              style={{ border: `3px solid ${detail.data.isOn ? "var(--accent)" : "var(--text-muted)"}` }}
            >
              <svg viewBox="0 0 24 24" width={52} height={52} fill="none" stroke={detail.data.isOn ? "var(--accent)" : "var(--text-muted)"} strokeWidth={1.2} style={detail.data.isOn ? { animation: "spin 1.6s linear infinite", transformOrigin: "center" } : undefined}>
                <circle cx={12} cy={12} r={2} />
                <path d="M12 10c0-3 1-4 2.5-4S16 8 14 9.5 M14 14c3 0 4 1 4 2.5S16 18 14.5 16 M10 14c0 3-1 4-2.5 4S8 16 10 14.5 M10 10c-3 0-4-1-4-2.5S8 6 9.5 8" />
              </svg>
            </div>
            <span className="text-xs font-bold tracking-wider px-4 py-1.5 rounded-full bg-(--bg-subtle)" style={{ color: detail.data.isOn ? "var(--accent)" : "var(--text-muted)" }}>
              {detail.data.isOn ? "ENCENDIDO" : "APAGADO"}
            </span>
          </div>
        )}
      </Modal>
    </div>
  );
}
