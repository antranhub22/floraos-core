"""
Local Cinematic Motion Video Provider (Phương án A — Kích hoạt mặc định).
Sử dụng FFmpeg Ken Burns camera movements, Ducking Audio & Multi-style Subtitles.
Hoàn toàn ngoại tuyến, 0 credit cost, tốc độ render ~0.45s/cảnh.
"""

from __future__ import annotations

import os
import shutil
import tempfile
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

from media_ai.video.providers.base import BaseVideoProvider, VideoProviderError
from media_ai.video.slideshow_engine import (
    render_slideshow,
    is_ffmpeg_available,
    SlideshowError,
)
from media_ai.video.audio_engine import build_audio_track
from media_ai.video.caption_engine import render_caption_to_file

REPO_ROOT = Path(__file__).resolve().parents[4]
STORAGE_ROOT = REPO_ROOT / "var" / "storage"


class LocalCinematicProvider(BaseVideoProvider):
    """Provider render video Cinematic Motion cục bộ bằng FFmpeg."""

    @property
    def name(self) -> str:
        return "LOCAL_CINEMATIC"

    @property
    def model_version(self) -> str:
        return "ffmpeg-kenburns-v2.0"

    def is_available(self) -> bool:
        return is_ffmpeg_available()

    def _resolve_image(self, asset_ref: str, org_id: str, temp_dir: Path, idx: int) -> Optional[Path]:
        """Giải quyết nguồn ảnh từ URL hoặc đường dẫn cục bộ."""
        s = str(asset_ref).strip()
        if s.startswith("http://") or s.startswith("https://"):
            dest = temp_dir / f"download_{idx}.jpg"
            try:
                req = urllib.request.Request(s, headers={"User-Agent": "FloraOS-Video/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp, open(dest, "wb") as f:
                    f.write(resp.read())
                if dest.is_file() and dest.stat().st_size > 0:
                    return dest
            except Exception as e:
                print(f"⚠️ [LocalCinematic] Không tải được ảnh {s}: {e}", flush=True)
                return None

        # Kiểm tra storage root
        p = STORAGE_ROOT / s
        if p.is_file():
            return p

        # Kiểm tra đường dẫn assets/{org_id}
        org_p = STORAGE_ROOT / "org" / org_id / s
        if org_p.is_file():
            return org_p

        return None

    def render_video(
        self,
        job_id: str,
        org_id: str,
        payload: Dict[str, Any],
        out_file: Path,
        progress_callback: Optional[Any] = None,
    ) -> Path:
        """Render video với đầy đủ chuyển động Ken Burns, âm thanh và phụ đề."""
        if not self.is_available():
            raise VideoProviderError("FFmpeg chưa được cài đặt trên hệ thống.")

        scenes = payload.get("scenes") or []
        aspect_ratio = payload.get("aspectRatio") or "9:16"
        duration_seconds = int(payload.get("durationSeconds") or 15)
        music_track = payload.get("musicTrack") or payload.get("music_track")
        voice_code = payload.get("voiceCode") or payload.get("voice_code")
        caption_style = str(payload.get("captionStyle") or payload.get("caption_style") or "MODERN_BADGE")
        video_job_id = payload.get("videoJobId") or job_id

        out_dir = out_file.parent
        out_dir.mkdir(parents=True, exist_ok=True)

        if progress_callback:
            progress_callback("STAGE", {"stage": "RESOLVING_ASSETS", "progress": 25})

        # 1. Thu thập danh sách ảnh, chuyển động và thời lượng từng cảnh
        image_paths: List[Path] = []
        scene_motions: List[str] = []
        scene_durations: List[float] = []

        for idx, sc in enumerate(scenes):
            asset_ref = sc.get("imageAssetId") or sc.get("imageUrl")
            if asset_ref:
                resolved = self._resolve_image(str(asset_ref), org_id, out_dir, idx)
                if not resolved:
                    raise VideoProviderError(
                        f"Không đọc được ảnh của cảnh #{idx + 1} ({asset_ref}) — không dựng video thiếu cảnh."
                    )
                if resolved:
                    image_paths.append(resolved)
                    motion = sc.get("motionEffect") or sc.get("motion_effect") or "ZOOM_IN"
                    scene_motions.append(motion)
                    dur = float(sc.get("durationSeconds") or sc.get("duration_seconds") or 3.0)
                    scene_durations.append(dur)

        # 24/09/2026: bỏ "ảnh mẫu dự phòng" (tulip/gerbera trong kho) — video
        # quảng bá sản phẩm của tiệm không được dựng bằng ảnh hoa khác.
        if not image_paths:
            raise VideoProviderError("Không tìm thấy hình ảnh nào để dựng video.")

        # 2. Tổng hợp âm thanh (TTS + Nhạc nền)
        audio_path: Optional[Path] = None
        if progress_callback:
            progress_callback("STAGE", {"stage": "AUDIO_SYNTHESIS", "progress": 40})

        try:
            audio_out_file = out_dir / f"{video_job_id}_audio.aac"
            audio_path = build_audio_track(
                scenes=scenes,
                music_track=music_track,
                voice_code=voice_code,
                total_duration=duration_seconds,
                out_audio_file=audio_out_file,
            )
        except Exception as a_err:
            print(f"⚠️ [LocalCinematic] Lỗi tổng hợp âm thanh: {a_err}", flush=True)
            audio_path = None

        # 3. Kết xuất phụ đề lên từng phân cảnh
        captioned_paths: List[Path] = []
        temp_caption_files: List[Path] = []
        if caption_style != "NONE":
            if progress_callback:
                progress_callback("STAGE", {"stage": "CAPTION_RENDERING", "progress": 55})

        for idx, img_p in enumerate(image_paths):
            sc_text = ""
            if idx < len(scenes):
                sc_voice = str(scenes[idx].get("voiceScript") or scenes[idx].get("voice_script") or "").strip()
                sc_overlay = str(scenes[idx].get("textOverlay") or scenes[idx].get("text_overlay") or "").strip()
                sc_text = sc_voice if sc_voice else sc_overlay

            if sc_text and caption_style != "NONE":
                cap_out = out_dir / f"cap_{video_job_id}_{idx}.jpg"
                try:
                    render_caption_to_file(img_p, sc_text, cap_out, style_name=caption_style)
                    captioned_paths.append(cap_out)
                    temp_caption_files.append(cap_out)
                except Exception as c_err:
                    print(f"⚠️ [LocalCinematic] Lỗi vẽ phụ đề cảnh {idx}: {c_err}", flush=True)
                    captioned_paths.append(img_p)
            else:
                captioned_paths.append(img_p)

        # 4. Render FFmpeg Cinematic Ken Burns
        if progress_callback:
            progress_callback("STAGE", {"stage": "RENDERING", "progress": 70})

        try:
            render_slideshow(
                image_paths=captioned_paths,
                out_path=out_file,
                aspect_ratio=aspect_ratio,
                total_duration=duration_seconds,
                audio_path=audio_path,
                motions=scene_motions,
                scene_durations=scene_durations,
            )
        finally:
            # Dọn dẹp tệp tạm
            if audio_path and audio_path.is_file():
                audio_path.unlink(missing_ok=True)
            for tf in temp_caption_files:
                if tf.is_file():
                    tf.unlink(missing_ok=True)

        return out_file
