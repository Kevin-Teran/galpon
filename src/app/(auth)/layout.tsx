/**
 * @file layout.tsx
 * @route /src/app/(auth)/layout.tsx
 * @description Layout para páginas de autenticación (login).
 *              Centrado vertical y horizontal con fondo oscuro.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      {children}
    </main>
  );
}
