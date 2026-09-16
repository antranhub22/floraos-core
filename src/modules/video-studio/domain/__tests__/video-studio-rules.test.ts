import { describe, it, expect } from "vitest";
import {
  calculateTotalDuration,
  validateStoryboard,
  normalizeScenes,
} from "../video-storyboard";
import {
  canApproveScript,
  canStartRender,
  canApproveVideo,
} from "../video-approval-rules";
import {
  calculateVideoCreditCost,
  shouldRefundCreditsOnFailure,
} from "../video-pricing-guard";
import { VideoSceneItem } from "../video-types";

describe("Video Studio Domain Rules", () => {
  const validScenes: VideoSceneItem[] = [
    {
      sceneIndex: 1,
      durationSeconds: 4,
      imageAssetId: "asset-master-1",
      textOverlay: "Bó hoa tươi rực rỡ",
      voiceScript: "Mở đầu với những đóa hồng tươi thắm nhất",
    },
    {
      sceneIndex: 2,
      durationSeconds: 4,
      imageAssetId: "asset-detail-2",
      textOverlay: "Gói giấy Hàn Quốc sang trọng",
      voiceScript: "Từng đường gấp tỉ mỉ của nghệ nhân cắm hoa",
    },
    {
      sceneIndex: 3,
      durationSeconds: 4,
      imageAssetId: "asset-master-1",
      textOverlay: "Giao nhanh trong 2 giờ",
      voiceScript: "Đặt ngay hôm nay nhận ưu đãi đặc biệt",
    },
  ];

  describe("Storyboard Validation", () => {
    it("calculates total duration correctly", () => {
      expect(calculateTotalDuration(validScenes)).toBe(12);
    });

    it("passes validation for valid 15s reel", () => {
      const result = validateStoryboard(validScenes, "REEL_15S");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalDurationSeconds).toBe(12);
    });

    it("fails when scene count is too low for TikTok 30s (min 2 scenes)", () => {
      const singleScene = [validScenes[0]!];
      const result = validateStoryboard(singleScene, "TIKTOK_30S");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("tối thiểu 2 cảnh"))).toBe(true);
    });

    it("enforces master image anchor on first or last scene when requested", () => {
      const unanchoredScenes: VideoSceneItem[] = [
        { sceneIndex: 1, durationSeconds: 4, imageAssetId: "other-asset" },
        { sceneIndex: 2, durationSeconds: 4, imageAssetId: "other-asset-2" },
        { sceneIndex: 3, durationSeconds: 4, imageAssetId: "other-asset-3" },
      ];

      const result = validateStoryboard(unanchoredScenes, "REEL_15S", {
        requireMasterImageAnchor: true,
        masterImageAssetId: "asset-master-1",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Master Image"))).toBe(true);
    });

    it("normalizes scenes properly", () => {
      const messyScenes: VideoSceneItem[] = [
        { sceneIndex: 99, durationSeconds: 3.1415 },
        { sceneIndex: 0, durationSeconds: 0.2 },
      ];
      const normalized = normalizeScenes(messyScenes);
      expect(normalized[0]?.sceneIndex).toBe(1);
      expect(normalized[0]?.durationSeconds).toBe(3.1);
      expect(normalized[1]?.sceneIndex).toBe(2);
      expect(normalized[1]?.durationSeconds).toBe(1.0); // min 1.0s
    });
  });

  describe("Two-Stage Approval Gates", () => {
    it("canApproveScript permits valid script in DRAFT or SCRIPT_READY", () => {
      const check = canApproveScript({
        stage: "SCRIPT_READY",
        scriptApproval: "PENDING",
        format: "REEL_15S",
        scenes: validScenes,
      });
      expect(check.allowed).toBe(true);
    });

    it("canApproveScript blocks already approved scripts", () => {
      const check = canApproveScript({
        stage: "SCRIPT_READY",
        scriptApproval: "APPROVED",
        format: "REEL_15S",
        scenes: validScenes,
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("đã được phê duyệt");
    });

    it("canStartRender strictly requires script to be APPROVED first (Gate 1)", () => {
      const checkPending = canStartRender({
        stage: "SCRIPT_READY",
        scriptApproval: "PENDING",
      });
      expect(checkPending.allowed).toBe(false);
      expect(checkPending.reason).toContain("Bắt buộc phải phê duyệt Kịch bản");

      const checkApproved = canStartRender({
        stage: "SCRIPT_APPROVED",
        scriptApproval: "APPROVED",
      });
      expect(checkApproved.allowed).toBe(true);
    });

    it("canApproveVideo requires RENDER_COMPLETED and video asset (Gate 2)", () => {
      const checkIncomplete = canApproveVideo({
        stage: "RENDERING",
        videoApproval: "PENDING",
        finalVideoUrl: null,
        finalAssetId: null,
      });
      expect(checkIncomplete.allowed).toBe(false);

      const checkComplete = canApproveVideo({
        stage: "RENDER_COMPLETED",
        videoApproval: "PENDING",
        finalVideoUrl: "https://example.com/video.mp4",
        finalAssetId: "asset-video-1",
      });
      expect(checkComplete.allowed).toBe(true);
    });
  });

  describe("Pricing & Refund Guard", () => {
    it("calculates credit costs for reel 15s with voice", () => {
      const cost = calculateVideoCreditCost({
        format: "REEL_15S",
        durationSeconds: 15,
        hasAiVoice: true,
      });
      expect(cost.baseCredits).toBe(25);
      expect(cost.voiceCredits).toBe(5);
      expect(cost.totalCredits).toBe(30);
    });

    it("offers reduced cost for local FFmpeg slideshow", () => {
      const cost = calculateVideoCreditCost({
        format: "SLIDESHOW",
        durationSeconds: 20,
        hasAiVoice: false,
        isSlideshowLocal: true,
      });
      expect(cost.totalCredits).toBe(5);
      expect(cost.isFreeTierEligible).toBe(true);
    });

    it("refunds credits on job failure", () => {
      expect(shouldRefundCreditsOnFailure("FAILED")).toBe(true);
      expect(shouldRefundCreditsOnFailure("ERROR")).toBe(true);
      expect(shouldRefundCreditsOnFailure("COMPLETED")).toBe(false);
    });
  });
});
