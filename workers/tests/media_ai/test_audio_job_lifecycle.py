"""Vòng đời job `audio.generate` (23/09/2026) — không Postgres, không TTS thật.

Trước ngày này không worker nào nhận `audio.generate`: credit bị trừ lúc tạo
job, job đứng PENDING mãi. Khoá: thành công → tệp lên kho + COMPLETED với
`audio_storage_key`; lỗi → FAILED kèm lý do, không nuốt lỗi.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from media_ai.audio import audio_worker


class _Cur:
    def __init__(self, log: list) -> None:
        self.log = log

    def execute(self, sql: str, params: Any = None) -> None:
        self.log.append((" ".join(sql.split()), params))

    def __enter__(self) -> "_Cur":
        return self

    def __exit__(self, *a: Any) -> None:
        return None


class _Conn:
    def __init__(self) -> None:
        self.log: list = []

    def cursor(self, **_k: Any) -> _Cur:
        return _Cur(self.log)

    def commit(self) -> None: ...

    def rollback(self) -> None: ...


def _job() -> dict:
    return {
        "id": "job-1",
        "organization_id": "org-1",
        "product_id": None,
        "payload": {"scenes": [{"sceneIndex": 1, "voiceScript": "Xin chào", "targetDurationSeconds": 3}]},
    }


def test_thanh_cong_ghi_kho_va_completed(monkeypatch, tmp_path: Path):
    tep = tmp_path / "mixed.m4a"
    tep.write_bytes(b"audio-bytes")
    monkeypatch.setattr(
        audio_worker,
        "process_audio_job",
        lambda payload, work_dir: {
            "status": "COMPLETED",
            "mixedAudioPath": str(tep),
            "voiceOnlyPath": "x",
            "totalDurationSeconds": 3.0,
            "providerUsed": "edge_tts",
            "scenes": [],
        },
    )
    da_ghi: dict = {}
    import shared.storage as storage

    monkeypatch.setattr(
        storage, "ghi_bytes", lambda key, body, mime, root: da_ghi.update(key=key, body=body, mime=mime)
    )

    conn = _Conn()
    audio_worker.process_audio_generation_job(conn, _job())

    assert da_ghi["key"].startswith("org/org-1/unfiled/")
    assert da_ghi["key"].endswith("_audio.m4a")
    assert da_ghi["mime"] == "audio/mp4"
    cap_nhat = [p for sql, p in conn.log if "SET status = 'COMPLETED'" in sql]
    assert cap_nhat, conn.log
    output = json.loads(cap_nhat[0][0])
    assert output["audio_storage_key"] == da_ghi["key"]
    assert output["total_duration_seconds"] == 3.0


def test_loi_phoi_tron_thanh_failed_co_ly_do(monkeypatch):
    monkeypatch.setattr(
        audio_worker,
        "process_audio_job",
        lambda payload, work_dir: {"status": "FAILED", "error": "Không thể phối trộn âm thanh"},
    )
    conn = _Conn()
    audio_worker.process_audio_generation_job(conn, _job())
    failed = [p for sql, p in conn.log if "SET status = 'FAILED'" in sql]
    assert failed and "phối trộn" in failed[0][0]
    assert not any("SET status = 'COMPLETED'" in sql for sql, _ in conn.log)
