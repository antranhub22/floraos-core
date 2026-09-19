"use client";

import { useState, useEffect } from "react";
import type { OpportunityItem } from "./opportunity-card";
import type { RunItem } from "./research-runs-table";
import type { ResearchStatusInfo } from "./research-status-banner";
import type { CustomResearchParams } from "./custom-research-modal";

export function useMarketIntelligenceData() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [isSaaSAdmin, setIsSaaSAdmin] = useState(false);
  const [researchStatus, setResearchStatus] = useState<ResearchStatusInfo>({
    state: "idle",
    message: "",
  });

  const checkUserRole = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        const roleKey = data.membership?.role_key;
        const capabilities: string[] = data.capabilities ?? [];
        const isAdmin =
          roleKey === "dieu_hanh" ||
          capabilities.includes("V3") ||
          capabilities.includes("V1");
        setIsSaaSAdmin(Boolean(isAdmin));
      }
    } catch {
      setIsSaaSAdmin(true);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/market-intelligence/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.items ?? []);
      }
    } catch (err) {
      console.error("Lỗi tải cơ hội:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/v1/market-intelligence/research-runs");
      if (res.ok) {
        const data = await res.json();
        const items: RunItem[] = data.items ?? [];
        setRuns(items);

        const hasPending = items.some(
          (r) => r.status === "PENDING" || r.status === "RUNNING"
        );
        if (hasPending) {
          setTimeout(() => {
            fetchRuns();
            fetchOpportunities();
          }, 2500);
        }
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử chạy:", err);
    }
  };

  useEffect(() => {
    checkUserRole();
    fetchOpportunities();
    fetchRuns();
  }, []);

  const handleTriggerRun = async (params: CustomResearchParams) => {
    try {
      setTriggering(true);
      setResearchStatus({
        state: "running",
        message: "Đang quét dữ liệu từ Google, TikTok & YouTube để tìm tín hiệu thời gian thực...",
        keyword: params.keyword,
      });

      const res = await fetch("/api/v1/market-intelligence/research-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_type: params.runType ?? "MANUAL",
          keyword: params.keyword,
          geo: params.geo,
          timeframe: params.timeframe,
          channel: params.channel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setResearchStatus({
          state: "error",
          message:
            errData.error || `Lỗi máy chủ (${res.status}): Không thể khởi tạo phiên quét.`,
        });
        setTriggering(false);
        return;
      }

      const runData = await res.json();
      setResearchStatus({
        state: "running",
        message:
          "Đã nạp vào hàng đợi! AI đang phân tích tín hiệu đa kênh và tính toán cơ hội nội dung mới...",
        keyword: params.keyword,
      });

      let attempts = 0;
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const runRes = await fetch("/api/v1/market-intelligence/research-runs");
          if (runRes.ok) {
            const data = await runRes.json();
            const items: RunItem[] = data.items ?? [];
            setRuns(items);
            const currentRun = items.find((r) => r.id === runData.runId);

            if (currentRun && currentRun.status === "COMPLETED") {
              clearInterval(pollTimer);
              await fetchOpportunities();
              setResearchStatus({
                state: "completed",
                message: `Phân tích thành công! Đã phát hiện ${
                  currentRun.opportunities_created || "nhiều"
                } cơ hội nội dung theo xu hướng cho chủ đề "${params.keyword}".`,
                keyword: params.keyword,
                details: `Đã thu thập thành công ${
                  currentRun.records_collected || 0
                } tín hiệu đa kênh (Google, TikTok, YouTube).`,
              });
              setTriggering(false);

              setTimeout(() => {
                const el = document.getElementById("research-results-section");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 400);
              return;
            }

            if (currentRun && currentRun.status === "FAILED") {
              clearInterval(pollTimer);
              setResearchStatus({
                state: "error",
                message: `Phiên quét thất bại: ${
                  currentRun.error_summary || "Lỗi dịch vụ"
                }`,
              });
              setTriggering(false);
              return;
            }
          }
        } catch {
          // ignore
        }

        if (attempts >= 25) {
          clearInterval(pollTimer);
          setTriggering(false);
          await fetchOpportunities();
        }
      }, 2000);
    } catch (err: any) {
      setResearchStatus({
        state: "error",
        message: `Lỗi kết nối máy chủ: ${err.message}`,
      });
      setTriggering(false);
    }
  };

  return {
    opportunities,
    runs,
    loading,
    triggering,
    isSaaSAdmin,
    researchStatus,
    setResearchStatus,
    fetchOpportunities,
    fetchRuns,
    handleTriggerRun,
  };
}
