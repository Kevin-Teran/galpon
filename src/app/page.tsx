/**
 * @file page.tsx
 * @route /src/app/page.tsx
 * @description Ruta raíz — redirige al dashboard (el middleware se encarga de la auth).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
