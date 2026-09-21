const FullPageLoader = ({ label = 'Loading' }) => (
  <div className="flex min-h-screen items-center justify-center bg-ground">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <p className="text-sm text-muted">{label}…</p>
    </div>
  </div>
);

export default FullPageLoader;
