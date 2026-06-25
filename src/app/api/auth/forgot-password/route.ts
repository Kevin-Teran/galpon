/**
 * @file route.ts
 * @route /src/app/api/auth/forgot-password/route.ts
 * @description POST /api/auth/forgot-password — Genera token de reset y envía email.
 *              Siempre responde 200 para no revelar si el email existe (seguridad).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/shared/database/prisma.client";
import { apiErrorResponse } from "@/shared/middleware/auth.middleware";

const schema = z.object({ email: z.string().email() });

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ ok: true }, { status: 200 });

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });

    // Responder siempre OK (no revelar si el email existe)
    if (!user) return Response.json({ ok: true }, { status: 200 });

    const rawToken    = crypto.randomBytes(32).toString("hex");
    const tokenHash   = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry      = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: tokenHash, resetPasswordExpiry: expiry },
    });

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

    if (process.env.SMTP_HOST) {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from:    process.env.SMTP_FROM,
        to:      user.email,
        subject: "Restablecer contraseña — Galpon",
        html: `
          <p>Hola ${user.name},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p><a href="${resetLink}" style="color:#10b981">Restablecer contraseña</a></p>
          <p>Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        `,
      });
    } else if (process.env.NODE_ENV !== "production") {
      console.info(`[RESET] Link para ${user.email}: ${resetLink}`);
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
