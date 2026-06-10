/**
 * @file page.tsx
 * @route /src/app/(platform)/monitoring/page.tsx
 * @description Monitoreo en tiempo real de temperatura y humedad vía SSE.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/app/_ui/PageHeader";

interface MeasurementPoint {
  nodeId: string;
  metric: string;
  value: number;
  timestamp: string;
  node: { name: string; type: string; hardwareId: string };
}

interface NodeLatest {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  hardwareId: string;
  temperature?: number;
  humidity?: number;
  tempTs?: string;
  humTs?: string;
}

export default function MonitoringPage() {
  const [nodes, setNodes]       = useState<NodeLatest[]>([]);
  const [openAlerts, setAlerts] = useState(0);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/monitoring/stream");
    esRef.current = es;
    setConnected(false);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      const { measurements, openAlerts: oa } = JSON.parse(e.data) as {
        measurements: MeasurementPoint[];
        openAlerts: number;
      };
      setAlerts(oa);
      const map = new Map<string, NodeLatest>();
      for (const m of measurements) {
        if (!map.has(m.nodeId)) {
          map.set(m.nodeId, { nodeId: m.nodeId, nodeName: m.node.name, nodeType: m.node.type, hardwareId: m.node.hardwareId });
        }
        const entry = map.get(m.nodeId)!;
        if (m.metric === "TEMPERATURE" && !entry.temperature) {
          entry.temperature = m.value; entry.tempTs = m.timestamp;
        }
        if (m.metric === "HUMIDITY" && !entry.humidity) {
          entry.humidity = m.value; entry.humTs = m.timestamp;
        }
      }
      setNodes(Array.from(map.values()));
    };

    return () => { es.close(); };
  }, []);

  return (
    <div>
      <PageHeader
        title="Monitoreo en tiempo real"
        description="Lecturas actualizadas cada 5 segundos vía SSE"
        action={
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-[var(--text-muted)]">{connected ? "Conectado" : "Desconectado"}</span>
          </div>
        }
      />

      {openAlerts > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <span className="text-red-400 text-lg">⚠</span>
          <p className="text-sm font-medium text-red-400">{openAlerts} alerta{openAlerts > 1 ? "s" : ""} activa{openAlerts > 1 ? "s" : ""} — <a href="/alerts" className="underline">Ver alertas</a></p>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-4xl mb-3">◎</p>
          <p className="text-sm">Esperando lecturas de los nodos...</p>
          <p className="text-xs mt-1">Los nodos deben publicar en sus topics MQTT</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(n => (
          <NodeCard key={n.nodeId} node={n} />
        ))}
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: NodeLatest }) {
  const tempLevel = getLevel(node.temperature);
  const humLevel  = getLevel(node.humidity);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">{node.nodeName}</h3>
          <p className="text-xs text-[var(--text-muted)] font-mono">{node.hardwareId}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${node.nodeType === "INTERIOR" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
          {node.nodeType}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricChip label="Temperatura" value={node.temperature} unit="°C" level={tempLevel} ts={node.tempTs} />
        <MetricChip label="Humedad"     value={node.humidity}    unit="%" level={humLevel} ts={node.humTs} />
      </div>
    </div>
  );
}

function MetricChip({ label, value, unit, level, ts }: {
  label: string; value?: number; unit: string; level: "green" | "yellow" | "red" | "none"; ts?: string;
}) {
  const colors = {
    green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red:    "bg-red-500/10 text-red-400 border-red-500/20",
    none:   "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)]",
  }[level];

  return (
    <div className={`rounded-lg border p-3 ${colors}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">
        {value !== undefined ? `${value.toFixed(1)}${unit}` : "—"}
      </p>
      {ts && <p className="text-xs opacity-50 mt-1">{new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>}
    </div>
  );
}

function getLevel(value?: number): "green" | "yellow" | "red" | "none" {
  if (value === undefined) return "none";
  // Evaluación simplificada hasta que se consulten los rangos reales por organización
  return "green";
}
