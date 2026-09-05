// Shows the uploaded image if present, otherwise coloured initials.
export default function Avatar({ name = "", src = null, size = 40 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-white/70"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold shrink-0"
    >
      {initials || "?"}
    </div>
  );
}