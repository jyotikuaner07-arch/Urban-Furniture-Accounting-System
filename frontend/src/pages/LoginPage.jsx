import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../features/auth/AuthContext";
import { useLogin } from "../features/auth/useLogin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  // FastAPI puts its message in `detail`. It's a string for 400/401,
  // an array of field errors for 422 validation failures.
  const errorMessage = (() => {
    const err = loginMutation.error;
    if (!err) return "";
    if (!err.response) return "Cannot reach the server. Is the backend running on port 8000?";
    const detail = err.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .join(" · ");
    }
    return "Login failed. Please try again.";
  })();

  const submit = (e) => {
    e.preventDefault();
    // Backend expects `email`, not a login id.
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          login(data);           // stores token + maps the role
          navigate("/dashboard");
        },
      }
    );
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your accounting workspace.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@urban.com"
            className="input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Password</label>
            <button
              type="button"
              onClick={() => alert("Password reset is not built yet.")}
              className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>

        {errorMessage && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loginMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-slate-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}