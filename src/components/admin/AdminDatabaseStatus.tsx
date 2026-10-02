import React from "react";
import { AdminDbStatus } from "@/lib/repository/admin";

interface AdminDatabaseStatusProps {
  dbStatus: AdminDbStatus;
  isLoading?: boolean;
}

export function AdminDatabaseStatus({ dbStatus, isLoading }: AdminDatabaseStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="w-48 h-4 bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              dbStatus.isConnected
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Database Engine Health
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  dbStatus.isConnected
                    ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                    : "bg-amber-950/80 border border-amber-800 text-amber-300"
                }`}
              >
                {dbStatus.isConnected ? "Operational" : "Fallback Active"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {dbStatus.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 sm:border-l sm:border-slate-800 sm:pl-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
              Provider
            </span>
            <span className="font-medium text-slate-200">{dbStatus.provider}</span>
          </div>

          {dbStatus.latencyMs !== undefined && (
            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Latency
              </span>
              <span className="font-mono text-emerald-400 font-medium">
                {dbStatus.latencyMs}ms
              </span>
            </div>
          )}

          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
              Security
            </span>
            <span className="text-slate-300">RLS Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
