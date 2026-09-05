import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Search,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import { products, placeCustomerOrder } from "../data/store";
import { useAuth } from "../features/auth/AuthContext";
import ProductArt from "../components/ProductArt";

// Category → colour, so the catalog tiles aren't all identical grey.


export default function ShopPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);     // [{ id, name, salesPrice, qty }]
  const [search, setSearch] = useState("");
  const [placed, setPlaced] = useState(null);
  const [error, setError] = useState("");

  const visible = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Adding an item already in the cart just bumps its quantity.
  const addToCart = (product) => {
    const existing = cart.find((c) => c.id === product.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([
        ...cart,
        { id: product.id, name: product.name, salesPrice: product.salesPrice, qty: 1 },
      ]);
    }
    setError("");
  };

  const changeQty = (id, delta) => {
    setCart(
      cart
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)   // dropping to zero removes the line
    );
  };

  const removeLine = (id) => setCart(cart.filter((c) => c.id !== id));

  const cartTotal = cart.reduce((s, c) => s + c.qty * c.salesPrice, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const checkout = () => {
    const result = placeCustomerOrder(user, cart);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPlaced(result);
    setCart([]);
  };

  // ---------- ORDER CONFIRMATION ----------
  if (placed) {
    return (
      <div className="max-w-xl space-y-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-emerald-700 mb-4">
            <CheckCircle2 size={20} />
            <h1 className="text-lg font-semibold">Order placed</h1>
          </div>

          <dl className="text-sm border rounded-xl divide-y bg-white/70">
            <Row label="Order Number" value={placed.order.number} mono />
            <Row label="Invoice Number" value={placed.invoice.number} mono />
            <Row label="Order Date" value={placed.order.date} />
            <Row label="Payment Due By" value={placed.invoice.dueDate} />
            <Row label="Total" value={`₹${placed.order.total.toLocaleString()}`} />
            <Row label="Status" value={placed.invoice.status} />
          </dl>

          <div className="mt-4 rounded-xl border bg-white/70 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-2.5 font-medium">Product</th>
                  <th className="text-right p-2.5 font-medium">Qty</th>
                  <th className="text-right p-2.5 font-medium">Price</th>
                  <th className="text-right p-2.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {placed.order.lines.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2.5">{l.product}</td>
                    <td className="p-2.5 text-right">{l.qty}</td>
                    <td className="p-2.5 text-right">₹{l.unitPrice.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-medium">
                      ₹{(l.qty * l.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              View My Invoices
            </button>
            <button
              onClick={() => setPlaced(null)}
              className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
            >
              Continue Shopping
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ---------- CATALOG ----------
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Shop</h1>
        <p className="text-sm text-slate-500">
          Browse our catalogue and place an order. An invoice is raised automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-white/70"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((p) => (
              <GlassCard key={p.id} className="p-4 flex flex-col">
                <ProductArt name={p.name} className="w-full h-40 mb-3" />

                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500 capitalize mb-3">
                  {p.category} · {p.type}
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    ₹{p.salesPrice.toLocaleString()}
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </GlassCard>
            ))}

            {visible.length === 0 && (
              <div className="col-span-2 text-center text-sm text-slate-500 py-10">
                No products match your search.
              </div>
            )}
          </div>
        </div>

        {/* cart — sticky so it stays visible while scrolling the catalog */}
        <div className="lg:sticky lg:top-4 h-fit">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={17} />
              <h2 className="font-semibold">Your Cart</h2>
              {cartCount > 0 && (
                <span className="ml-auto text-xs bg-slate-900 text-white rounded-full px-2 py-0.5">
                  {cartCount}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Your cart is empty.
              </p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-slate-500">
                          ₹{c.salesPrice.toLocaleString()} each
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeQty(c.id, -1)}
                          className="p-1 border rounded-md bg-white hover:bg-slate-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center">{c.qty}</span>
                        <button
                          onClick={() => changeQty(c.id, 1)}
                          className="p-1 border rounded-md bg-white hover:bg-slate-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeLine(c.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>

                {error && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={checkout}
                  className="w-full mt-4 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800"
                >
                  Place Order
                </button>

                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  An invoice will be raised with 14 days to pay.
                </p>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}