import { useState } from "react";
import { List, LayoutGrid, ArrowLeft } from "lucide-react";
import { products as productStore, addProduct } from "../data/store";
import SavedBanner from "../components/SavedBanner";
import ProductArt from "../components/ProductArt";

export default function ProductsPage() {
  const [view, setView] = useState("list");
  const [rows, setRows] = useState([...productStore]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(null);
  const [formError, setFormError] = useState("");

  const filtered = rows.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (view === "form") {
    return (
      <ProductForm
        error={formError}
        onCancel={() => {
          setFormError("");
          setView("list");
        }}
        onSave={(data) => {
          // form inputs arrive as strings — convert before storing
          const result = addProduct({
            ...data,
            salesPrice: Number(data.salesPrice),
            cost: Number(data.cost),
          });

          if (!result.ok) {
            setFormError(result.message);
            return;
          }

          setFormError("");
          setSaved(result.record);
          setRows([...productStore]);
          setView("list");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("form")}
          className="px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          New
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 max-w-sm border rounded-lg px-3 py-1.5 text-sm bg-white/70"
        />

        <div className="ml-auto flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`p-2 ${view === "list" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`p-2 ${view === "kanban" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold">Products</h1>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {view === "list" ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/50 border-b border-white/60">
              <tr>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Sales Price</th>
                <th className="text-right p-3 font-medium">Cost</th>
                <th className="text-right p-3 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const margin = p.salesPrice - p.cost;
                const marginPct = p.salesPrice
                  ? Math.round((margin / p.salesPrice) * 100)
                  : 0;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-white/50 last:border-0 hover:bg-white/50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ProductArt name={p.name} className="w-11 h-11 shrink-0" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{p.category}</td>
                    <td className="p-3 capitalize">{p.type}</td>
                    <td className="p-3 text-right">₹{p.salesPrice.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500">
                      ₹{p.cost.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-emerald-700 font-medium">
                        ₹{margin.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">({marginPct}%)</span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-4"
            >
              <ProductArt name={p.name} className="w-full h-36 mb-3" />

              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-slate-500 capitalize mb-3">
                {p.category} · {p.type}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sales</span>
                <span className="font-medium">₹{p.salesPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cost</span>
                <span className="text-slate-500">₹{p.cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t mt-2 pt-2">
                <span className="text-slate-500">Margin</span>
                <span className="font-medium text-emerald-700">
                  ₹{(p.salesPrice - p.cost).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center text-slate-500 py-10">
              No products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductForm({ onSave, onCancel, error }) {
  const [form, setForm] = useState({
    name: "",
    type: "goods",
    category: "",
    salesPrice: "",
    cost: "",
  });

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  // Live margin preview as the user types prices
  const margin = Number(form.salesPrice || 0) - Number(form.cost || 0);

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">New Product</h1>
        <button
          type="submit"
          className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Confirm
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl p-5">
        <div className="flex gap-5">
          <ProductArt name={form.name} className="w-32 h-32 shrink-0" />

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input name="name" value={form.name} onChange={change} required className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product Type</label>
              <select name="type" value={form.type} onChange={change} className="input bg-white">
                <option value="goods">Goods</option>
                <option value="service">Service</option>
                <option value="combo">Combo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                name="category"
                value={form.category}
                onChange={change}
                required
                placeholder="e.g. Furniture"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sales Price</label>
              <input
                name="salesPrice"
                type="number"
                min="0"
                value={form.salesPrice}
                onChange={change}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost</label>
              <input
                name="cost"
                type="number"
                min="0"
                value={form.cost}
                onChange={change}
                required
                className="input"
              />
            </div>

            {(form.salesPrice || form.cost) && (
              <div className="col-span-2 text-sm rounded-lg px-3 py-2 border bg-slate-50">
                Margin:{" "}
                <span
                  className={`font-medium ${
                    margin >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  ₹{margin.toLocaleString()}
                </span>
                {margin < 0 && (
                  <span className="text-red-600 ml-2">
                    Cost is higher than the sales price.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}