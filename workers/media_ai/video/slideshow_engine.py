"""
Slideshow Video Engine (M04c) — Thu hoạch & Nâng cấp từ SocialFlow backend/video_providers/slideshow.py.
Xây dựng video Cinematic Motion (Ken Burns: Zoom In, Zoom Out, Pan Lên, Pan Ngang) bằng FFmpeg.
Không tốn API key, chạy offline hoàn toàn, chi phí 0 credit, tốc độ ~0.45s/cảnh.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple, Dict

FRAME_RESOLUTIONS: Dict[str, Tuple[int, int]] = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),  # 24/09/2026 — bài feed Facebook/Instagram (cấu hình sẵn theo nền tảng)
}

FPS = 30
TRANSITION_DURATION = 0.5  # giây crossfade giữa các phân cảnh
MIN_SLIDE_SECONDS = 1.0
RENDER_TIMEOUT_SECONDS = 180

DEFAULT_MOTION_SEQUENCE = ["ZOOM_IN", "PAN_RIGHT", "ZOOM_OUT", "PAN_UP"]


class SlideshowError(Exception):
    """Lỗi sinh video slideshow."""
    pass


def is_ffmpeg_available() -> bool:
    """Kiểm tra xem máy đã cài ffmpeg chưa."""
    return shutil.which("ffmpeg") is not None


def build_motion_filter(
    motion: str,
    w: int,
    h: int,
    total_frames: int,
    fps: int = FPS,
) -> str:
    """
    Tạo bộ lọc zoompan của FFmpeg cho từng hiệu ứng máy quay điện ảnh (Ken Burns).
    - ZOOM_IN: Thu phóng cận cảnh vào nhụy/bông hoa
    - ZOOM_OUT: Lùi góc máy mở rộng ra toàn bó hoa
    - PAN_UP: Lướt dọc từ cuống lên đỉnh hoa
    - PAN_RIGHT: Lia máy từ trái qua phải
    - STATIC: Giữ khung hình tĩnh
    """
    mot = (motion or "ZOOM_IN").upper().strip()
    d = max(15, total_frames)

    if mot == "ZOOM_IN":
        zoom_expr = "z='min(zoom+0.0015,1.25)'"
        x_expr = "x='iw/2-(iw/zoom/2)'"
        y_expr = "y='ih/2-(ih/zoom/2)'"
    elif mot == "ZOOM_OUT":
        zoom_expr = "z='if(lte(zoom,1.0),1.25,max(1.001,zoom-0.0015))'"
        x_expr = "x='iw/2-(iw/zoom/2)'"
        y_expr = "y='ih/2-(ih/zoom/2)'"
    elif mot == "PAN_UP":
        zoom_expr = "z=1.15"
        x_expr = "x='iw/2-(iw/zoom/2)'"
        y_expr = "y='if(lte(on,1),(ih-ih/zoom),max(0,y-1.5))'"
    elif mot == "PAN_RIGHT":
        zoom_expr = "z=1.15"
        x_expr = "x='if(lte(on,1),0,min(iw-iw/zoom,x+1.5))'"
        y_expr = "y='ih/2-(ih/zoom/2)'"
    else:  # STATIC hoặc mặc định
        zoom_expr = "z=1.0"
        x_expr = "x='iw/2-(iw/zoom/2)'"
        y_expr = "y='ih/2-(ih/zoom/2)'"

    # Scale trước khi zoompan để tránh vỡ nét ảnh khi zoom 1.25x
    scale_w = max(2160, int(w * 1.3))
    return (
        f"scale={scale_w}:-1,"
        f"zoompan={zoom_expr}:d={d}:{x_expr}:{y_expr}:s={w}x{h}:fps={fps},"
        f"format=yuv420p"
    )


def build_ffmpeg_command(
    image_paths: List[Path],
    out_path: Path,
    aspect_ratio: str = "9:16",
    total_duration: int = 15,
    audio_path: Optional[Path] = None,
    motions: Optional[List[str]] = None,
    scene_durations: Optional[List[float]] = None,
    subtitle_overlays: Optional[List[Tuple[Path, float, float]]] = None,
) -> List[str]:
    """
    Tạo câu lệnh ffmpeg hoàn chỉnh với Cinematic Ken Burns và xfade chuyển cảnh mượt mà.
    """
    w, h = FRAME_RESOLUTIONS.get(aspect_ratio, FRAME_RESOLUTIONS["9:16"])
    n = len(image_paths)
    if n == 0:
        raise SlideshowError("Cần ít nhất 1 ảnh để dựng slideshow")

    overlap = TRANSITION_DURATION * (n - 1)
    
    # Tính thời lượng từng slide
    durations: List[float] = []
    if scene_durations and len(scene_durations) == n:
        # 24/09/2026: bù phần chồng xfade — mỗi slide (trừ slide cuối) dài thêm
        # đúng TRANSITION_DURATION để mốc chuyển cảnh trùng mốc tổng thời lượng
        # các cảnh trước ⇒ hình khớp tiếng (bản phối C) và phụ đề từng cảnh.
        durations = [
            max(MIN_SLIDE_SECONDS, float(sd)) + (TRANSITION_DURATION if i < n - 1 else 0.0)
            for i, sd in enumerate(scene_durations)
        ]
    else:
        avg_slide = max(MIN_SLIDE_SECONDS + TRANSITION_DURATION, (total_duration + overlap) / n)
        durations = [avg_slide] * n

    # Chuẩn bị danh sách chuyển động
    resolved_motions: List[str] = []
    for i in range(n):
        if motions and i < len(motions) and motions[i]:
            resolved_motions.append(motions[i])
        else:
            resolved_motions.append(DEFAULT_MOTION_SEQUENCE[i % len(DEFAULT_MOTION_SEQUENCE)])

    # Câu lệnh FFmpeg: nạp từng ảnh (chỉ 1 frame, zoompan sẽ sinh d frame)
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    for img in image_paths:
        args.extend(["-i", str(img)])

    overlays = subtitle_overlays or []
    for png, _s, _e in overlays:
        args.extend(["-i", str(png)])

    if audio_path and audio_path.is_file():
        args.extend(["-i", str(audio_path)])

    chains = []
    for i in range(n):
        frames = int(durations[i] * FPS)
        motion_filter = build_motion_filter(resolved_motions[i], w, h, frames, FPS)
        chains.append(f"[{i}:v]{motion_filter}[v{i}]")

    if n == 1:
        final_video_label = "[v0]"
    else:
        prev = "[v0]"
        current_offset = 0.0
        for i in range(1, n):
            current_offset += durations[i - 1] - TRANSITION_DURATION
            out_label = "[v_out]" if i == n - 1 else f"[x{i}]"
            chains.append(
                f"{prev}[v{i}]xfade=transition=fade:duration={TRANSITION_DURATION}:offset={current_offset:.3f}{out_label}"
            )
            prev = out_label
        final_video_label = "[v_out]"

    # Phụ đề = lời thoại, hiện từng đoạn đúng lúc được đọc (lớp RGBA ghép theo thời gian).
    for k, (_png, start, end) in enumerate(overlays):
        out_label = f"[sub{k}]"
        chains.append(
            f"{final_video_label}[{n + k}:v]overlay=0:0:enable='between(t,{start:.3f},{end:.3f})'{out_label}"
        )
        final_video_label = out_label

    filter_complex = ";".join(chains)
    args.extend(["-filter_complex", filter_complex, "-map", final_video_label])

    if audio_path and audio_path.is_file():
        args.extend([
            "-map", f"{n + len(overlays)}:a",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
        ])

    args.extend([
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(out_path),
    ])

    return args


def render_slideshow(
    image_paths: List[Path],
    out_path: Path,
    aspect_ratio: str = "9:16",
    total_duration: int = 15,
    audio_path: Optional[Path] = None,
    motions: Optional[List[str]] = None,
    scene_durations: Optional[List[float]] = None,
    subtitle_overlays: Optional[List[Tuple[Path, float, float]]] = None,
) -> Path:
    """
    Thực thi render video slideshow Cinematic Motion từ danh sách đường dẫn ảnh.
    """
    if not is_ffmpeg_available():
        raise SlideshowError("ffmpeg chưa được cài đặt trên hệ thống.")

    for p in image_paths:
        if not p.is_file():
            raise SlideshowError(f"Không tìm thấy tệp ảnh: {p}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = build_ffmpeg_command(
        image_paths=image_paths,
        out_path=out_path,
        aspect_ratio=aspect_ratio,
        total_duration=total_duration,
        audio_path=audio_path,
        motions=motions,
        scene_durations=scene_durations,
        subtitle_overlays=subtitle_overlays,
    )

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=RENDER_TIMEOUT_SECONDS,
    )

    if result.returncode != 0 or not out_path.is_file():
        err = (result.stderr or "").strip()
        raise SlideshowError(f"FFmpeg thất bại: {err or 'không có phản hồi'}")

    return out_path
