import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("interviewer@demo.com");
  const [password, setPassword] = useState("password123");
  const [errorMessage, setErrorMessage] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter email and password.");
      return;
    }

    localStorage.setItem(
      "demo_interviewer",
      JSON.stringify({
        name: "Demo Interviewer",
        email,
        role: "HR Evaluator",
      }),
    );

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden bg-gray-900 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-950">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h1 className="text-xl font-bold">RecruitAI</h1>
              <p className="text-sm text-gray-300">
                Interview Integrity Assistant
              </p>
            </div>
          </div>

          <div>
            <h2 className="max-w-xl text-4xl font-bold leading-tight">
              Review virtual interviews with behavioral timeline support.
            </h2>

            <p className="mt-5 max-w-xl text-gray-300 leading-7">
              Upload or review interview recordings, inspect behavioral
              inconsistency timelines, and use explainable segment-level
              insights to support interviewer judgment.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold">
              Ethical decision-support notice
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              This system does not make final hiring decisions. It highlights
              review-worthy behavioral patterns for qualified human evaluators.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gray-100 px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-950">
                Interviewer Login
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to access the deception analysis dashboard.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                  placeholder="interviewer@company.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign In
              </button>
            </form>

            {/* <p className="mt-6 text-center text-xs text-gray-500">
              Demo credentials are pre-filled. Real authentication can be
              connected later.
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}
