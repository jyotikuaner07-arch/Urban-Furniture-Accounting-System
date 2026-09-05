import { CheckCircle2, X } from "lucide-react";

// Shows what was just saved, as a key/value list.
export default function SavedBanner({ record, onClose }) {
  if (!record) return null;

  // Don't display internal ids
  const entries = Object.entries(record).filter(([k]) => k !== "id");

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 relative">
      <button onClick={onClose} className="absolute top-3 right-3 text-emerald-700 hover:opacity-70">
        <X size={15} />
      </button>
      <div className="flex items-center gap-2 text-emerald-800 font-medium text-sm mb-3">
        <CheckCircle2 size={16} /> Record saved successfully
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="text-[11px] uppercase tracking-wide text-emerald-700/70">
              {key.replace(/([A-Z])/g, " $1")}
            </div>
            <div className="font-medium text-emerald-900 break-words">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}