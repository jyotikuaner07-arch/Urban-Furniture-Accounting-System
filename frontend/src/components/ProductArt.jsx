import { useState } from "react";
import { Package } from "lucide-react";

// Maps product name → file in /public/products/
// Anything in /public is served from the site root, so no import needed.
const IMAGES = {
  "Office Chair":     "/products/office-chair.jpg",
  "Wooden Table":     "/products/wooden-table.jpg",
  "Sofa":             "/products/sofa.jpg",
  "Assembly Service": "/products/assembly-service.jpg",
};

// Each photo has a different subject placement, so we nudge the crop
// per image to keep the product centred at any aspect ratio.
const FOCUS = {
  "Office Chair":     "object-center",
  "Wooden Table":     "object-center",
  "Sofa":             "object-[center_65%]",  // sofa sits low in the frame
  "Assembly Service": "object-center",
};

export default function ProductArt({ name, className = "" }) {
  const src = IMAGES[name];
  const [failed, setFailed] = useState(false);

  // Graceful fallback — a missing file shows an icon, never a broken image.
  if (!src || failed) {
    return (
      <div
        className={`bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 ${className}`}
      >
        <Package size={26} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${FOCUS[name] || "object-center"}`}
      />
    </div>
  );
}