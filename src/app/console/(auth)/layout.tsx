export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="console-shell console-auth-shell relative flex min-h-dvh items-center justify-center overflow-hidden p-4"
    >
      <div className="console-grid-mesh" aria-hidden="true" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--neon-violet)_18%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
