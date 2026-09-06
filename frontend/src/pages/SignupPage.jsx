import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Truck, Loader2, AlertCircle } from "lucide-react";
import axiosClient from "../api/axiosClient";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../features/auth/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", mobile: "", city: "", state: "", pincode: "",
    contact_type: "customer", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Enter a valid email address.";
    if (form.password.length < 6) err.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) err.confirmPassword = "Passwords do not match.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      // Backend creates the Contact record and the login together.
      // It returns a token, so we log straight in.
      const { data } = await axiosClient.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        contact_type: form.contact_type,
        mobile: form.mobile || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
      });
      login(data);
      navigate("/portal");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrors({
        form: typeof detail === "string" ? detail : "Could not create your account.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="For customers and vendors. Staff accounts are set up by an administrator."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">I am a</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "customer", label: "Customer", hint: "Browse products, view my bills", icon: ShoppingBag },
              { value: "vendor", label: "Vendor", hint: "View orders placed with me", icon: Truck },
            ].map((o) => {
              const Icon = o.icon;
              const active = form.contact_type === o.value;
              return (
                <label key={o.value}
                  className={`border rounded-lg px-3 py-3 cursor-pointer transition-colors ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
                  }`}>
                  <input type="radio" name="contact_type" value={o.value}
                    checked={active} onChange={change} className="sr-only" />
                  <Icon size={18} className="mb-1" />
                  <div className="text-sm font-medium">{o.label}</div>
                  <div className={`text-[11px] ${active ? "text-slate-300" : "text-slate-500"}`}>
                    {o.hint}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {errors.form && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />{errors.form}
          </div>
        )}

        <Field label={form.contact_type === "vendor" ? "Business Name" : "Full Name"} error={errors.name}>
          <input name="name" value={form.name} onChange={change} required className="input" />
        </Field>

        <Field label="Email" error={errors.email}>
          <input name="email" type="email" value={form.email} onChange={change} required
            placeholder="you@example.com" className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mobile">
            <input name="mobile" value={form.mobile} onChange={change} className="input" />
          </Field>
          <Field label="City">
            <input name="city" value={form.city} onChange={change} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="State">
            <input name="state" value={form.state} onChange={change} className="input" />
          </Field>
          <Field label="Pincode">
            <input name="pincode" value={form.pincode} onChange={change} className="input" />
          </Field>
        </div>

        <Field label="Password" error={errors.password}>
          <input name="password" type="password" value={form.password} onChange={change}
            required placeholder="At least 6 characters" className="input" />
        </Field>

        <Field label="Re-enter Password" error={errors.confirmPassword}>
          <input name="confirmPassword" type="password" value={form.confirmPassword}
            onChange={change} required className="input" />
        </Field>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-slate-900 font-medium hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}