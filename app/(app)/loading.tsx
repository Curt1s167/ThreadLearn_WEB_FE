export default function AppLoading() {
  return (
    <div className="min-h-screen bg-canvas-cream p-6">
      <div className="h-14 rounded-lg border border-black/10 bg-white/80" />
      <div className="mx-auto mt-12 max-w-6xl space-y-6" aria-busy="true" aria-label="Loading page">
        <div className="h-10 w-64 rounded-lg skeleton" />
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 rounded-lg skeleton" />)}
        </div>
        <div className="h-72 rounded-lg skeleton" />
      </div>
    </div>
  );
}
