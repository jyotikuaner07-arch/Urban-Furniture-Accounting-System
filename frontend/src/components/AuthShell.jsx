import Logo from "./Logo";

// Split-screen wrapper: brand panel on the left, form on the right.
// `children` is whatever form we pass in (login or signup).
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — brand panel (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between">
        <Logo size={44} className="[&_div]:text-white [&_.text-slate-500]:text-slate-400" />

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-snug">
            Keep your books<br />balanced, always.
          </h2>
          <p className="text-slate-400 max-w-sm">
            Track contacts, products, purchases and sales — with every
            transaction posted to the ledger automatically.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-slate-400">
          <div>
            <div className="text-2xl font-semibold text-white">Double</div>
            <div>entry ledger</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">3</div>
            <div>live reports</div>
          </div>
        </div>
      </div>

      {/* RIGHT — the form area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* logo shows here only on small screens, since left panel is hidden */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={40} />
          </div>

          <div className="bg-white border rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-semibold mb-1">{title}</h1>
            <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}