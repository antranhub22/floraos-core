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
    <div className="rounded-xl border border-cool-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-cool-50 border-b border-cool-200 font-semibold text-xs text-cool-700 uppercase tracking-wider">
        Nhật ký quét
      </div>
      <table className="min-w-full divide-y divide-cool-200 text-xs text-left">
        <thead className="bg-cool-50 text-cool-500">
          <tr>
            <th className="px-4 py-3 font-medium">Mã lượt chạy</th>
            <th className="px-4 py-3 font-medium">Loại</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Tín hiệu</th>
            <th className="px-4 py-3 font-medium">Cơ hội sinh ra</th>
            <th className="px-4 py-3 font-medium">Thời gian</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cool-100 bg-white">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-cool-50/50">
              <td className="px-4 py-3 font-mono text-caption text-cool-600">{r.id.slice(0, 8)}...</td>
              <td className="px-4 py-3 font-medium text-cool-800">{r.run_type}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-caption font-bold ${
                    r.status === "COMPLETED"
                      ? "bg-mint-50 text-mint-700"
                      : r.status === "RUNNING"
                      ? "bg-azure-50 text-azure-700 animate-pulse"
                      : r.status === "FAILED"
                      ? "bg-alert-50 text-alert-700"
                      : "bg-sand-50 text-sand-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-cool-600">{r.records_collected}</td>
              <td className="px-4 py-3 text-cool-600">{r.opportunities_created}</td>
              <td className="px-4 py-3 text-cool-400">
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
