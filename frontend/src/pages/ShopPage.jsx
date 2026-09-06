import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Package } from "lucide-react";
import axiosClient from "../api/axiosClient";
import GlassCard from "../components/GlassCard";
import ProductArt from "../components/ProductArt";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function errorText(error) {
  if (!error) return "";
  if (!error.response) return "Cannot reach the server.";
  const d = error.response.data?.detail;
  if (typeof d === "string") return d;
  return `${error.response.status} — request failed`;
}

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // /portal/products returns sales price only — cost and margin are
  // internal data and never leave the server for a contact user.
  const query = useQuery({
    queryKey: ["portal", "products"],
    queryFn: async () => (await axiosClient.get("/portal/products")).data,
  });

  const all = query.data || [];

  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();

  const visible = all.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Shop</h1>
        <p className="text-sm text-slate-500">
          Browse our catalogue. To place an order, get in touch and we'll raise a
          quotation for you.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-white/70"
          />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {!query.isLoading && (
          <span className="text-sm text-slate-500 ml-auto">
            {visible.length} of {all.length} products
          </span>
        )}
      </div>

      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-16">
          <Loader2 size={16} className="animate-spin" /> Loading catalogue...
        </div>
      )}

      {query.isError && (
        <div className="py-4">
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />{errorText(query.error)}
          </div>
          <button onClick={() => query.refetch()}
            className="mt-2 text-sm underline text-slate-600 hover:text-slate-900">
            Try again
          </button>
        </div>
      )}

      {!query.isLoading && !query.isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((p) => (
            <GlassCard key={p.id} className="p-4 flex flex-col">
              <ProductArt name={p.name} className="w-full h-36 mb-3" />
              <div className="font-medium leading-tight">{p.name}</div>
              <div className="text-xs text-slate-500 capitalize mb-3">
                {p.category || "Uncategorised"} · {p.type}
              </div>
              <div className="mt-auto text-lg font-semibold">{money(p.sales_price)}</div>
            </GlassCard>
          ))}

          {visible.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-16">
              <Package size={28} className="mx-auto mb-2 text-slate-300" />
              No products match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}