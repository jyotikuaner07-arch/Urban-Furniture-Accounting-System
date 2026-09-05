import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../features/auth/AuthContext";
import { findUser } from "../data/users";

export default function LoginPage() {
  const [step, setStep] = useState(1);          // 1 = credentials, 2 = OTP
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // STEP 1 — verify credentials, then issue an OTP
  const submitCredentials = (e) => {
    e.preventDefault();
    setError("");

    const user = findUser(loginId, password);
    if (!user) {
      setError("Invalid Login ID or Password.");
      return;
    }

    // 6-digit code. No email service in the demo, so we show it on screen.
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setPendingUser(user);
    setStep(2);
  };

  // STEP 2 — verify the OTP, then actually log in
  const submitOtp = (e) => {
    e.preventDefault();
    setError("");

    if (otpInput !== generatedOtp) {
      setError("Incorrect verification code.");
      return;
    }
    login(pendingUser);
    navigate("/dashboard");
  };

  if (step === 2) {
    return (
      <AuthShell
        title="Two-step verification"
        subtitle={`Enter the 6-digit code sent to ${pendingUser.email}`}
      >
        <form onSubmit={submitOtp} className="space-y-4">
          {/* Demo helper — remove once real email delivery exists */}
          <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
            <ShieldCheck size={16} />
            Demo code: <span className="font-mono font-semibold">{generatedOtp}</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Verification Code</label>
            <input
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              placeholder="000000"
              className="input text-center text-lg tracking-[0.5em] font-mono"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit"
            className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800">
            Verify & Sign In
          </button>

          <button type="button" onClick={() => { setStep(1); setOtpInput(""); setError(""); }}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Back to login
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your accounting workspace.">
      <form onSubmit={submitCredentials} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Login ID or Email</label>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} required
            placeholder="admin01" className="input" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Password</label>
            <button type="button" onClick={() => alert("Password reset is not built yet.")}
              className="text-xs text-slate-500 hover:text-slate-900 hover:underline">
              Forgot password?
            </button>
          </div>
          <input type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required className="input" />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit"
          className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800">
          Continue
        </button>

        <details className="text-xs text-slate-500 border rounded-lg px-3 py-2">
          <summary className="cursor-pointer font-medium">Demo accounts</summary>
          <ul className="mt-2 space-y-1 font-mono">
            <li>admin01 / Admin@123</li>
            <li>account01 / Acct@1234</li>
            <li>customer01 / Cust@1234</li>
            <li>vendor01 / Vend@1234</li>
          </ul>
        </details>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-slate-900 font-medium hover:underline">Sign up</Link>
        </p>
      </form>
    </AuthShell>
  );
}