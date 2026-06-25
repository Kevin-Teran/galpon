import type { Metadata } from "next";
export const metadata: Metadata = { title: "Usuarios — Galpon" };
export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
