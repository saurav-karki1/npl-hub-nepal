"use client";

/**
 * NPL Hub Nepal — Admin Login Page
 *
 * Dedicated Supabase email/password authentication screen.
 * Clean, professional, sports-editorial dark theme.
 */

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth/admin-auth-context";

export default function AdminLoginPage() {
  const { signIn, isConfigured } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please provide both email address and password.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);

    if (error) {
      setErrorMsg(error);
      setIsSubmitting(false);
    } else {
      router.replace("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0a5c36]/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand identity */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Image
              src="/images/logo.png"
              alt="NPL Hub Nepal Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain drop-shadow"
            />
            <span className="text-2xl font-black tracking-tight text-white">
              NPL<span className="text-[#10b981]">Hub</span> Nepal
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a5c36]/20 border border-[#0a5c36]/50 text-[#34d399] text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Admin Portal Access
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Authorized administration console for managing NPL Season 3 tournament data.
          </p>
        </div>

        {/* Configuration Warning if Supabase is missing */}
        {!isConfigured && (
          <div className="mt-6 p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
            <p className="font-bold text-amber-100 mb-1">Configuration Notice</p>
            Supabase environment variables are missing. Please ensure{" "}
            <code className="text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            are set in your environment.
          </div>
        )}

        {/* Login Card */}
        <div className="mt-6 bg-[#0c121e] py-8 px-6 sm:px-10 shadow-2xl rounded-xl border border-slate-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error banner */}
            {errorMsg && (
              <div
                className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
                role="alert"
              >
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠️</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nplhub.np"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070b12] border border-slate-700/80 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-hidden focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070b12] border border-slate-700/80 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-hidden focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
              />
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-md text-sm font-bold text-white bg-[#0a5c36] hover:bg-[#0e7b49] active:bg-[#073d24] border border-[#10b981]/30 shadow-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c121e] focus:ring-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span>Sign In to Admin Panel</span>
                )}
              </button>
            </div>
          </form>

          {/* Card footer */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-500">
              Credentials are authenticated directly by Supabase Auth with encrypted tokens.
            </p>
            <div>
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>← Return to Public Website</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
