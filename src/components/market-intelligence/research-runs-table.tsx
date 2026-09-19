"use client";

import React from "react";

export interface RunItem {
  id: string;
  run_type: string;
  status: string;
  created_at: string;
  records_collected: number;
  opportunities_created: number;
  error_summary?: string | null;
}

interface ResearchRunsTableProps {
  runs: RunItem[];
}

export function ResearchRunsTable({ runs }: ResearchRunsTableProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 font-semibold text-xs text-stone-700 uppercase tracking-wider">
        Nhật ký quét
      </div>
      <table className="min-w-full divide-y divide-stone-200 text-xs text-left">
        <thead className="bg-stone-50 text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Mã lượt chạy</th>
            <th className="px-4 py-3 font-medium">Loại</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Tín hiệu</th>
            <th className="px-4 py-3 font-medium">Cơ hội sinh ra</th>
            <th className="px-4 py-3 font-medium">Thời gian</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-stone-50/50">
              <td className="px-4 py-3 font-mono text-[11px] text-stone-600">{r.id.slice(0, 8)}...</td>
              <td className="px-4 py-3 font-medium text-stone-800">{r.run_type}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.status === "RUNNING"
                      ? "bg-sky-50 text-sky-700 animate-pulse"
                      : r.status === "FAILED"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-stone-600">{r.records_collected}</td>
              <td className="px-4 py-3 text-stone-600">{r.opportunities_created}</td>
              <td className="px-4 py-3 text-stone-400">
                {new Date(r.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
