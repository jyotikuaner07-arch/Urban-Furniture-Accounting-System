import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  List, LayoutGrid, ArrowLeft, Plus, Pencil, Archive, Loader2, AlertCircle,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import SavedBanner from "../components/SavedBanner";
import ProductArt from "../components/ProductArt";

/* ============================================================
   API LAYER
   Verified against backend/app/routes/product_routes.py:
   { id, name, type, sales_price, cost_price, category, is_archived }
   Note snake_case — the backend does not use camelCase.
   ============================================================ */

async function fetchProducts(filters = {}) {
  const params = {};
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  const { data } = await axiosClient.get("/products", { params });
  return Array.isArray(data) ? data : [];
}

async function createProduct(payload) {
  const { data } = await axiosClient.post("/products", payload);
  return data;
}

async function updateProduct({ id, payload }) {
  const { data } = await axiosClient.put(`/products/${id}`, payload);
  return data;
}

async function archiveProduct(id) {
  await axiosClient.delete(`/products/${id}`);
  return id;
}

// Form (strings) -> API shape (numbers, snake_case)
function toPayload(form) {
  return {
    name: form.name.trim(),
    type: form.type,
    sales_price: Number(form.sales_price),
    cost_price: Number(form.cost_price),
    category: form.category?.trim() || null,
  };
}

// API record -> form fields
function toForm(product) {
  return {
    name: product.name || "",
    type: product.type || "goods",
    category: product.category || "",
    sales_price: product.sales_price ?? "",
    cost_price: product.cost_price ?? "",
  };
}

function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server. Is the backend running on port 8000?";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .join(" · ");
  }
  return `${error.response.status} — request failed`;
}

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ============================================================
   HOOKS
   ============================================================ */

const productKeys = {
  all: ["products"],
  list: (filters = {}) => ["products", "list", filters],
};

function useProducts(filters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });
}

function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

/* ============================================================
   PAGE
   ============================================================ */

export default function ProductsPage() {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [saved, setSaved] = useState(null);

  const productsQuery = useProducts(typeFilter ? { type: typeFilter } : {});
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const archiveMutation = useArchiveProduct();

  const rows = (productsQuery.data || []).filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
  };

  const openNew = () => { setEditing(null); resetMutations(); setView("form"); };
  const openEdit = (p) => { setEditing(p); resetMutations(); setView("form"); };

  const handleSave = (form) => {
    const payload = toPayload(form);
    const onSuccess = (record) => {
      setSaved({
        name: record.name,
        type: record.type,
        category: record.category || "—",
        "sales price": money(record.sales_price),
        cost: money(record.cost_price),
      });
      setView("list");
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  const handleArchive = (product) => {
    if (!window.confirm(`Archive "${product.name}"? It will be hidden from lists.`)) return;
    archiveMutation.mutate(product.id);
  };

  if (view === "form") {
    return (
      <ProductForm
        initial={editing ? toForm(editing) : null}
        isEditing={!!editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={errorText(createMutation.error || updateMutation.error)}
        onCancel={() => setView("list")}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Plus size={15} /> New
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 max-w-xs border rounded-lg px-3 py-1.5 text-sm bg-white/70"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All types</option>
          <option value="goods">Goods</option>
          <option value="service">Service</option>
          <option value="combo">Combo</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {productsQuery.isFetching && !productsQuery.isLoading && (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          )}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-slate-900 text-white" : "bg-white"}`}>
              <List size={16} />
            </button>
            <button onClick={() => setView("kanban")}
              className={`p-2 ${view === "kanban" ? "bg-slate-900 text-white" : "bg-white"}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-semibold">Products</h1>

      {saved && <SavedBanner record={saved} onClose={() => setSaved(null)} />}

      {archiveMutation.isError && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorText(archiveMutation.error)}
        </div>
      )}

      {productsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10">
          <Loader2 size={16} className="animate-spin" /> Loading products...
        </div>
      )}

      {productsQuery.isError && (
        <div className="py-4">
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {errorText(productsQuery.error)}
          </div>
          <button onClick={() => productsQuery.refetch()}
            className="mt-2 text-sm underline text-slate-600 hover:text-slate-900">
            Try again
          </button>
        </div>
      )}

      {!productsQuery.isLoading && !productsQuery.isError && (
        view === "list" ? (
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/50 border-b border-white/60">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Sales Price</th>
                  <th className="text-right p-3 font-medium">Cost</th>
                  <th className="text-right p-3 font-medium">Margin</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const margin = (p.sales_price || 0) - (p.cost_price || 0);
                  const marginPct = p.sales_price
                    ? Math.round((margin / p.sales_price) * 100)
                    : 0;
                  return (
                    <tr key={p.id} className="border-b border-white/50 last:border-0 hover:bg-white/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <ProductArt name={p.name} className="w-11 h-11 shrink-0" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">{p.category || "—"}</td>
                      <td className="p-3 capitalize">{p.type}</td>
                      <td className="p-3 text-right">{money(p.sales_price)}</td>
                      <td className="p-3 text-right text-slate-500">{money(p.cost_price)}</td>
                      <td className="p-3 text-right">
                        <span className={margin >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                          {money(margin)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">({marginPct}%)</span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleArchive(p)}
                            disabled={archiveMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 disabled:opacity-40"
                            title="Archive">
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((p) => (
              <GlassCard key={p.id} className="p-4">
                <ProductArt name={p.name} className="w-full h-36 mb-3" />

                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 capitalize mb-3">
                      {p.category || "—"} · {p.type}
                    </div>
                  </div>
                  <button onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 shrink-0">
                    <Pencil size={14} />
                  </button>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sales</span>
                  <span className="font-medium">{money(p.sales_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cost</span>
                  <span className="text-slate-500">{money(p.cost_price)}</span>
                </div>
                <div className="flex justify-between text-sm border-t mt-2 pt-2">
                  <span className="text-slate-500">Margin</span>
                  <span className="font-medium text-emerald-700">
                    {money((p.sales_price || 0) - (p.cost_price || 0))}
                  </span>
                </div>
              </GlassCard>
            ))}
            {rows.length === 0 && (
              <div className="col-span-3 text-center text-slate-500 py-10">
                No products found.
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   FORM
   ============================================================ */

const EMPTY_FORM = {
  name: "", type: "goods", category: "", sales_price: "", cost_price: "",
};

function ProductForm({ initial, isEditing, isSaving, error, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const margin = Number(form.sales_price || 0) - Number(form.cost_price || 0);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} className="p-2 border rounded-lg bg-white">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-semibold">
          {isEditing ? "Edit Product" : "New Product"}
        </h1>
        <button type="submit" disabled={isSaving}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Confirm"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <GlassCard className="p-5">
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
              <input name="category" value={form.category} onChange={change}
                placeholder="e.g. Furniture" className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sales Price</label>
              <input name="sales_price" type="number" min="0" step="0.01"
                value={form.sales_price} onChange={change} required className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost Price</label>
              <input name="cost_price" type="number" min="0" step="0.01"
                value={form.cost_price} onChange={change} required className="input" />
            </div>

            {(form.sales_price || form.cost_price) && (
              <div className="col-span-2 text-sm rounded-lg px-3 py-2 border bg-slate-50">
                Margin:{" "}
                <span className={`font-medium ${margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {money(margin)}
                </span>
                {margin < 0 && (
                  <span className="text-red-600 ml-2">Cost is higher than the sales price.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </form>
  );
}