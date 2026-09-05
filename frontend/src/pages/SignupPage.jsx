import { provisionContactData } from "../data/store";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Upload, X } from "lucide-react";
import AuthShell from "../components/AuthShell";
import Avatar from "../components/Avatar";
import { registerUser } from "../data/users";

const ROLE_OPTIONS = [
  { value: "admin",      label: "Admin",      hint: "Full system control" },
  { value: "accountant", label: "Accountant", hint: "Master data, transactions, reports" },
  { value: "contact",    label: "Contact",    hint: "Customer or vendor portal" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", loginId: "", email: "", mobile: "", city: "", state: "",
    role: "accountant", contactType: "customer",
    password: "", confirmPassword: "", avatar: null,
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Convert the chosen image to a base64 string so it can live in localStorage.
  const pickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 300 * 1024) {
      setErrors({ ...errors, avatar: "Image must be under 300 KB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: reader.result }));
      setErrors((er) => ({ ...er, avatar: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Name is required.";
    if (form.loginId.length < 6 || form.loginId.length > 12)
      err.loginId = "Login ID must be 6–12 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      err.email = "Enter a valid email address.";

    const strong =
      form.password.length > 8 &&
      /[a-z]/.test(form.password) &&
      /[A-Z]/.test(form.password) &&
      /[^A-Za-z0-9]/.test(form.password);
    if (!strong)
      err.password = "Min 8 chars, with uppercase, lowercase and a special character.";

    if (form.password !== form.confirmPassword)
      err.confirmPassword = "Passwords do not match.";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = registerUser(form);
    if (!result.ok) {
      setErrors({ [result.field]: result.message });
      return;
    }

    // Contacts get a matching master record plus starter transactions,
    // so their portal dashboard has real data to show.
    if (result.user.role === "contact") {
      provisionContactData(result.user);
    }

    setSaved(result.user);
  };

  if (saved) {
    return (
      <AuthShell title="Account created" subtitle="Here's what we saved.">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 size={16} /> Registration successful
          </div>

          <div className="flex justify-center py-2">
            <Avatar name={saved.name} src={saved.avatar} size={72} />
          </div>

          <dl className="text-sm border rounded-lg divide-y">
            <Row label="Name" value={saved.name} />
            <Row label="Login ID" value={saved.loginId} />
            <Row label="Email" value={saved.email} />
            <Row label="Role" value={saved.role} cap />
            {saved.contactType && <Row label="Contact Type" value={saved.contactType} cap />}
            {saved.mobile && <Row label="Mobile" value={saved.mobile} />}
            {saved.city && <Row label="City" value={saved.city} />}
          </dl>

          <button onClick={() => navigate("/login")}
            className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800">
            Continue to Login
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Choose the role that fits your work.">
      <form onSubmit={submit} className="space-y-4">

        {/* avatar picker */}
        <div className="flex items-center gap-4">
          <Avatar name={form.name} src={form.avatar} size={56} />
          <div className="flex-1">
            <label className="inline-flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50">
              <Upload size={14} /> Upload photo
              <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </label>
            {form.avatar && (
              <button type="button"
                onClick={() => setForm({ ...form, avatar: null })}
                className="ml-2 text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1">
                <X size={12} /> Remove
              </button>
            )}
            {errors.avatar && <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>}
          </div>
        </div>

        <Field label="Name" error={errors.name}>
          <input name="name" value={form.name} onChange={change} required
            placeholder="Full name" className="input" />
        </Field>

        <Field label="Login ID" error={errors.loginId}>
          <input name="loginId" value={form.loginId} onChange={change} required
            placeholder="6–12 characters" className="input" />
        </Field>

        <Field label="Email" error={errors.email}>
          <input name="email" type="email" value={form.email} onChange={change} required
            placeholder="you@company.com" className="input" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Mobile">
            <input name="mobile" value={form.mobile} onChange={change} className="input" />
          </Field>
          <Field label="City">
            <input name="city" value={form.city} onChange={change} className="input" />
          </Field>
          <Field label="State">
            <input name="state" value={form.state} onChange={change} className="input" />
          </Field>
        </div>

        <Field label="Role">
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <label key={r.value}
                className={`border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  form.role === r.value ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
                }`}>
                <input type="radio" name="role" value={r.value}
                  checked={form.role === r.value} onChange={change} className="sr-only" />
                <div className="text-sm font-medium">{r.label}</div>
                <div className={`text-[11px] ${form.role === r.value ? "text-slate-300" : "text-slate-500"}`}>
                  {r.hint}
                </div>
              </label>
            ))}
          </div>
        </Field>

        {/* Only shown when Contact is selected */}
        {form.role === "contact" && (
          <Field label="Contact Type">
            <div className="grid grid-cols-2 gap-2">
              {["customer", "vendor"].map((t) => (
                <label key={t}
                  className={`border rounded-lg px-3 py-2 text-sm text-center cursor-pointer capitalize transition-colors ${
                    form.contactType === t ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"
                  }`}>
                  <input type="radio" name="contactType" value={t}
                    checked={form.contactType === t} onChange={change} className="sr-only" />
                  {t}
                </label>
              ))}
            </div>
          </Field>
        )}

        <Field label="Password" error={errors.password}>
          <input name="password" type="password" value={form.password}
            onChange={change} required className="input" />
        </Field>

        <Field label="Re-enter Password" error={errors.confirmPassword}>
          <input name="confirmPassword" type="password" value={form.confirmPassword}
            onChange={change} required className="input" />
        </Field>

        <button type="submit"
          className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800">
          Create Account
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

function Row({ label, value, cap }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${cap ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}