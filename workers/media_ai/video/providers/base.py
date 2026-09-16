"""
Cổng giao tiếp chuẩn cho các Nhà cung cấp Video (Video Providers) — M04c.
Thiết kế theo chuẩn Clean Architecture & Provider Pattern.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional


class VideoProviderError(Exception):
    """Lỗi phát sinh trong quá trình xử lý của Video Provider."""
    pass


class BaseVideoProvider(ABC):
    """
    Giao diện cơ sở cho mọi Video Provider trong hệ thống.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Tên định danh của nhà cung cấp (vd: LOCAL_CINEMATIC, VEO, HEYGEN)."""
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Phiên bản mô hình đang sử dụng."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Kiểm tra xem provider đã sẵn sàng môi trường (API Key, phụ thuộc) chưa."""
        pass

    @abstractmethod
    def render_video(
        self,
        job_id: str,
        org_id: str,
        payload: Dict[str, Any],
        out_file: Path,
        progress_callback: Optional[Any] = None,
    ) -> Path:
        """
        Thực thi tiến trình render và trả về đường dẫn tệp MP4 kết quả.
        """
        pass
