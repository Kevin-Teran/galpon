/**
 * @file page.tsx
 * @route /src/app/(platform)/monitoring/page.tsx
 * @description Monitoreo en tiempo real por galpón: KPIs agregados, estado de extractores/bombas
 *              y diagrama isométrico de bloques de sensores, con lecturas vía SSE.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/app/_ui/PageHeader";
import { DiagramFan, DiagramNode, NodeLevel, ShedIsoDiagram } from "./_components/ShedIsoDiagram";

interface ShedSummary {
  id: string;
  name: string;
  _count: { nodes: number; fans: number };
}

interface AlertRange {
  metric: "TEMPERATURE" | "HUMIDITY";
  yellowLowMin: number;
  greenMin: number;
  greenMax: number;
  yellowHighMax: number;
}

interface SensorDetail {
  id: string;
  metric: "TEMPERATURE" | "HUMIDITY";
  side: "INTERIOR" | "EXTERIOR";
}

interface PumpDetail { id: string; pumpEvents: { id: string }[]; }
interface FanDetail  { id: string; name: string; fanNumber: number; fanEvents: { id: string }[]; }

interface NodeDetail {
  id: string;
  name: string;
  sensors: SensorDetail[];
  pumps: PumpDetail[];
}

interface ShedDetail {
  id: string;
  name: string;
  nodes: NodeDetail[];
  fans: FanDetail[];
  organization: { name: string; alertRanges: AlertRange[] };
}

interface MeasurementPoint {
  sensorId: string;
  metric: "TEMPERATURE" | "HUMIDITY";
  value: number;
  sensor: { side: "INTERIOR" | "EXTERIOR"; node: { name: string } };
}

const SEVERITY: Record<NodeLevel, number> = { NONE: 0, GREEN: 1, YELLOW_LOW: 2, YELLOW_HIGH: 2, RED_LOW: 3, RED_HIGH: 3 };

function classifyLevel(value: number, range: AlertRange): NodeLevel {
  if (value < range.yellowLowMin)   return "RED_LOW";
  if (value < range.greenMin)       return "YELLOW_LOW";
  if (value <= range.greenMax)      return "GREEN";
  if (value <= range.yellowHighMax) return "YELLOW_HIGH";
  return "RED_HIGH";
}

export default function MonitoringPage() {
  const [sheds, setSheds]           = useState<ShedSummary[]>([]);
  const [selectedShed, setSelected] = useState<string | null>(null);
  const [detail, setDetail]         = useState<ShedDetail | null>(null);
  const [latest, setLatest]         = useState<Map<string, number>>(new Map()); // sensorId -> value
  const [openAlerts, setAlerts]     = useState(0);
  const [connected, setConnected]   = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Lista de galpones
  useEffect(() => {
    fetch("/api/sheds")
      .then(r => r.ok ? r.json() : [])
      .then((data: ShedSummary[]) => {
        setSheds(data);
        if (data.length > 0) setSelected(prev => prev ?? data[0].id);
      })
      .catch(() => {});
  }, []);

  // Estructura del galpón seleccionado (nodos, sensores, bombas, extractores) — se refresca
  // periódicamente para reflejar cambios de encendido/apagado (no viajan por el stream de 5s).
  useEffect(() => {
    if (!selectedShed) return;
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/sheds/${selectedShed}`);
      if (!cancelled && res.ok) setDetail(await res.json());
    }
    load();
    const interval = setInterval(load, 20_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedShed]);

  // Stream de lecturas en vivo filtrado por galpón seleccionado
  useEffect(() => {
    if (!selectedShed) return;
    esRef.current?.close();
    setConnected(false);
    setLatest(new Map());

    const es = new EventSource(`/api/monitoring/stream?shedId=${selectedShed}`);
    esRef.current = es;
    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const { measurements, openAlerts: oa } = JSON.parse(e.data) as { measurements: MeasurementPoint[]; openAlerts: number };
      setAlerts(oa);
      setLatest(prev => {
        const next = new Map(prev);
        for (const m of measurements) if (!next.has(m.sensorId)) next.set(m.sensorId, m.value);
        return next;
      });
    };

    return () => { es.close(); };
  }, [selectedShed]);

  const rangeFor = (metric: "TEMPERATURE" | "HUMIDITY") => detail?.organization.alertRanges.find(r => r.metric === metric);

  const diagramNodes: DiagramNode[] = (detail?.nodes ?? []).map(n => {
    const val = (metric: "TEMPERATURE" | "HUMIDITY", side: "INTERIOR" | "EXTERIOR") => {
      const sensor = n.sensors.find(s => s.metric === metric && s.side === side);
      return sensor ? latest.get(sensor.id) : undefined;
    };
    const intTemp = val("TEMPERATURE", "INTERIOR");
    const intHum  = val("HUMIDITY", "INTERIOR");
    const extTemp = val("TEMPERATURE", "EXTERIOR");
    const extHum  = val("HUMIDITY", "EXTERIOR");

    const tempRange = rangeFor("TEMPERATURE");
    const humRange  = rangeFor("HUMIDITY");
    const tempLevel: NodeLevel = intTemp !== undefined && tempRange ? classifyLevel(intTemp, tempRange) : "NONE";
    const humLevel:  NodeLevel = intHum  !== undefined && humRange  ? classifyLevel(intHum, humRange)   : "NONE";
    const level = SEVERITY[tempLevel] >= SEVERITY[humLevel] ? tempLevel : humLevel;

    return {
      id: n.id, name: n.name, level, intTemp, intHum, extTemp, extHum,
      pumpOnCount: n.pumps.filter(p => p.pumpEvents.length > 0).length,
      pumpTotal: n.pumps.length,
    };
  });

  const diagramFans: DiagramFan[] = (detail?.fans ?? []).map(f => ({
    id: f.id, name: f.name, fanNumber: f.fanNumber, isOn: f.fanEvents.length > 0,
  }));

  const avg = (values: (number | undefined)[]) => {
    const nums = values.filter((v): v is number => v !== undefined);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined;
  };
  const kpiIntTemp = avg(diagramNodes.map(n => n.intTemp));
  const kpiIntHum  = avg(diagramNodes.map(n => n.intHum));
  const kpiExtTemp = avg(diagramNodes.map(n => n.extTemp));
  const fansOn     = diagramFans.filter(f => f.isOn).length;
  const pumpsOn    = diagramNodes.reduce((a, n) => a + n.pumpOnCount, 0);
  const pumpsTotal = diagramNodes.reduce((a, n) => a + n.pumpTotal, 0);

  return (
    <div>
      <PageHeader
        title="Monitoreo en tiempo real"
        description="Lecturas actualizadas cada 5 segundos vía SSE"
        action={
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-(--text-muted)">{connected ? "Conectado" : "Desconectado"}</span>
          </div>
        }
      />

      {openAlerts > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <span className="text-red-400 text-lg">⚠</span>
          <p className="text-sm font-medium text-red-400">{openAlerts} alerta{openAlerts > 1 ? "s" : ""} activa{openAlerts > 1 ? "s" : ""} — <a href="/alerts" className="underline">Ver alertas</a></p>
        </div>
      )}

      {sheds.length === 0 ? (
        <div className="text-center py-16 text-(--text-muted)">
          <p className="text-4xl mb-3">◎</p>
          <p className="text-sm">No hay galpones registrados todavía.</p>
        </div>
      ) : (
        <>
          {/* Selector de galpón */}
          <div className="flex flex-wrap gap-2 mb-5">
            {sheds.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  selectedShed === s.id
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-(--border) bg-(--bg-surface) text-(--text-muted) hover:text-(--text-primary)"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
            <Kpi label="Temp. interior" value={kpiIntTemp !== undefined ? `${kpiIntTemp.toFixed(1)}°` : "—"} />
            <Kpi label="Humedad interior" value={kpiIntHum !== undefined ? `${kpiIntHum.toFixed(0)}%` : "—"} />
            <Kpi label="Temp. exterior" value={kpiExtTemp !== undefined ? `${kpiExtTemp.toFixed(1)}°` : "—"} />
            <Kpi label="Extractores activos" value={`${fansOn}/${diagramFans.length}`} />
            <Kpi label="Bombas activas" value={`${pumpsOn}/${pumpsTotal}`} />
          </div>

          {detail && <ShedIsoDiagram nodes={diagramNodes} fans={diagramFans} />}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
      <p className="text-xs text-(--text-muted) mb-1">{label}</p>
      <p className="text-xl font-bold text-(--text-primary) tabular-nums">{value}</p>
    </div>
  );
}
