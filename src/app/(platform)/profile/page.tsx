/**
 * @file page.tsx
 * @route /src/app/(platform)/profile/page.tsx
 * @description Página de perfil: actualizar nombre y cambiar contraseña.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition } from "react";


const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrador",
  OPERATOR:    "Operador",
};

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--bg-surface) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--border)">
        <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-(--text-secondary)">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) px-3.5 py-2.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function Alert({ type, message }: { type: "error" | "success"; message: string }) {
  const styles = type === "error"
    ? "bg-red-500/8 border-red-500/20 text-red-400"
    : "bg-emerald-500/8 border-emerald-500/20 text-emerald-400";
  const icon = type === "error"
    ? "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    : "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {message}
    </div>
  );
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
    >
      {pending && (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile]           = useState<ProfileData | null>(null);
  const [loading, setLoading]           = useState(true);

  // Name form
  const [name, setName]                 = useState("");
  const [nameMsg, setNameMsg]           = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [namePending, startNameTrans]   = useTransition();

  // Password form
  const [currentPass, setCurrentPass]   = useState("");
  const [newPass, setNewPass]           = useState("");
  const [confirmPass, setConfirmPass]   = useState("");
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [passMsg, setPassMsg]           = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [passPending, startPassTrans]   = useTransition();

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then((data: ProfileData | null) => {
        if (data) { setProfile(data); setName(data.name); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    startNameTrans(async () => {
      const res = await fetch("/api/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name }),
      });
      if (res.ok) {
        setProfile(p => p ? { ...p, name } : p);
        setNameMsg({ type: "success", text: "Nombre actualizado correctamente." });
      } else {
        const d = await res.json().catch(() => ({}));
        setNameMsg({ type: "error", text: d.error ?? "Error al actualizar." });
      }
    });
  }

  function handlePassSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg(null);
    if (newPass !== confirmPass) {
      setPassMsg({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    startPassTrans(async () => {
      const res = await fetch("/api/profile/password", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: currentPass, newPassword: newPass, confirmPassword: confirmPass }),
      });
      if (res.ok) {
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
        setPassMsg({ type: "success", text: "Contraseña actualizada correctamente." });
      } else {
        const d = await res.json().catch(() => ({}));
        setPassMsg({ type: "error", text: d.error ?? "Error al cambiar la contraseña." });
      }
    });
  }

  function EyeButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
    return (
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary) transition-colors p-0.5" aria-label={show ? "Ocultar" : "Mostrar"}>
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>
    );
  }

  const initial   = profile?.name?.[0]?.toUpperCase() ?? "?";
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-(--text-muted) text-sm">
        Cargando perfil…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Profile card */}
      <div className="rounded-2xl border border-(--border) bg-(--bg-surface) p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-emerald-400">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-(--text-primary) truncate">{profile?.name}</h2>
          <p className="text-sm text-(--text-secondary) truncate">{profile?.email}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role}
            </span>
            {memberSince && (
              <span className="text-xs text-(--text-muted)">Miembro desde {memberSince}</span>
            )}
          </div>
        </div>
      </div>

      {/* Name form */}
      <SectionCard title="Información personal">
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <Field label="Nombre completo">
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              minLength={2}
              maxLength={100}
              disabled={namePending}
            />
          </Field>
          <Field label="Correo electrónico">
            <Input
              type="email"
              value={profile?.email ?? ""}
              disabled
              readOnly
            />
          </Field>
          {nameMsg && <Alert type={nameMsg.type} message={nameMsg.text} />}
          <div className="flex justify-end pt-1">
            <SubmitButton pending={namePending} label="Guardar cambios" pendingLabel="Guardando…" />
          </div>
        </form>
      </SectionCard>

      {/* Password form */}
      <SectionCard title="Cambiar contraseña">
        <form onSubmit={handlePassSubmit} className="space-y-4">
          <Field label="Contraseña actual">
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                required
                disabled={passPending}
                className="pr-11"
              />
              <EyeButton show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
            </div>
          </Field>
          <Field label="Nueva contraseña">
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                disabled={passPending}
                className="pr-11"
              />
              <EyeButton show={showNew} onToggle={() => setShowNew(v => !v)} />
            </div>
          </Field>
          <Field label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Repite la nueva contraseña"
              required
              disabled={passPending}
            />
          </Field>
          {passMsg && <Alert type={passMsg.type} message={passMsg.text} />}
          <div className="flex justify-end pt-1">
            <SubmitButton pending={passPending} label="Actualizar contraseña" pendingLabel="Actualizando…" />
          </div>
        </form>
      </SectionCard>

    </div>
  );
}
