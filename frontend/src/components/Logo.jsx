// Inline SVG armchair — used on login and signup.
// Size and color are controlled by props so we can reuse it anywhere.
export default function Logo({ size = 40, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* backrest */}
        <rect x="12" y="8" width="24" height="16" rx="4" fill="#0f172a" />
        {/* seat */}
        <rect x="8" y="24" width="32" height="10" rx="3" fill="#334155" />
        {/* left armrest */}
        <rect x="4" y="18" width="6" height="16" rx="3" fill="#0f172a" />
        {/* right armrest */}
        <rect x="38" y="18" width="6" height="16" rx="3" fill="#0f172a" />
        {/* legs */}
        <rect x="10" y="34" width="4" height="7" rx="1.5" fill="#64748b" />
        <rect x="34" y="34" width="4" height="7" rx="1.5" fill="#64748b" />
      </svg>
      <div className="leading-tight">
        <div className="font-bold text-lg tracking-tight">Urban Furniture</div>
        <div className="text-[11px] text-slate-500 uppercase tracking-widest">
          Accounting System
        </div>
      </div>
    </div>
  );
}