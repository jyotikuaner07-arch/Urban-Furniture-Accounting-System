// Frosted panel used across every page.
export default function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}