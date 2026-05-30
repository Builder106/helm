// Marine snow — tiny particulates drifting slowly downward, the way
// they appear under a dive lamp. Two stacked layers at different
// drift speeds give a subtle parallax. Pure CSS via the .marine-snow
// utility (defined in index.css) and a slower offset variant.

export function MarineSnow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="marine-snow absolute inset-0 opacity-70" />
      <div
        className="marine-snow absolute inset-0 opacity-40"
        style={{ animationDuration: '120s', backgroundPosition: '200px 400px' }}
      />
    </div>
  );
}
