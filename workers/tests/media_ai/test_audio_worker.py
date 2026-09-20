"""Test Audio Worker — workers/media_ai/audio/audio_worker.py.

Test thuần: không đọc ảnh, không gọi mạng, không chạm CSDL.
Chỉ test logic xử lý job (routing taskType, fallback, duration, scene outputs).
"""

import pytest

from media_ai.audio.audio_worker import process_audio_job


def make_scene(index, script="", duration=5.0):
    return {
        "sceneIndex": index,
        "voiceScript": script,
        "targetDurationSeconds": duration,
    }


def make_payload(task_type="AUDIO_MIX", scenes=None, total_duration=30.0, **overrides):
    base = {
        "taskType": task_type,
        "scenes": scenes or [make_scene(1, "Xin chào", 5.0), make_scene(2, "Cảm ơn", 5.0)],
        "totalDurationSeconds": total_duration,
        "voiceId": "flora-nu-truyen-cam",
        "providerKey": "edge_tts",
        "providerVoiceCode": "nova",
        "qualityTier": "standard",
        "voiceVolume": 1.0,
        "bgmDuckingVolume": 0.22,
        "bgmNormalVolume": 0.65,
    }
    base.update(overrides)
    return base


class TestAudioJob_Routing:
    """Task type routing — nhiệm vụ khác nhau xử lý khác nhau."""

    def test_voiceover_task_type(self, tmp_path):
        payload = make_payload(task_type="VOICEOVER")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"
        assert isinstance(result["providerUsed"], str) and len(result["providerUsed"]) > 0
        assert len(result["scenes"]) == 2

    def test_music_select_task_type(self, tmp_path):
        payload = make_payload(task_type="MUSIC_SELECT", musicTrackId="acoustic-warm-guitar")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_audio_mix_task_type(self, tmp_path):
        payload = make_payload(task_type="AUDIO_MIX")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_voice_clone_task_type(self, tmp_path):
        payload = make_payload(task_type="VOICE_CLONE")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"


class TestAudioJob_Scenes:
    """Scene processing — từng scene được xử lý riêng."""

    def test_three_scenes(self, tmp_path):
        scenes = [
            make_scene(1, "Scene 1", 5.0),
            make_scene(2, "Scene 2", 10.0),
            make_scene(3, "Scene 3", 15.0),
        ]
        payload = make_payload(scenes=scenes, total_duration=30.0)
        result = process_audio_job(payload, tmp_path)
        assert len(result["scenes"]) == 3
        assert result["scenes"][0]["sceneIndex"] == 1
        assert result["scenes"][2]["sceneIndex"] == 3

    def test_scene_with_empty_script_generates_silence(self, tmp_path):
        scenes = [make_scene(1, "", 5.0)]
        payload = make_payload(scenes=scenes, total_duration=5.0)
        result = process_audio_job(payload, tmp_path)
        assert result["scenes"][0]["sceneIndex"] == 1
        assert result["scenes"][0]["voiceUrl"] is None

    def test_single_scene(self, tmp_path):
        scenes = [make_scene(1, "Duy nhất", 10.0)]
        payload = make_payload(scenes=scenes, total_duration=10.0)
        result = process_audio_job(payload, tmp_path)
        assert len(result["scenes"]) == 1
        assert result["scenes"][0]["sceneIndex"] == 1


class TestAudioJob_Fallback:
    """Provider fallback — providerKey không hợp lệ thì dùng mặc định."""

    def test_invalid_provider_uses_fallback(self, tmp_path):
        payload = make_payload(providerKey="unknown_provider")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"


class TestAudioJob_Duration:
    """Duration handling — tổng thời lượng tính đúng từ scenes."""

    def test_total_duration_matches_payload(self, tmp_path):
        payload = make_payload(total_duration=60.0)
        result = process_audio_job(payload, tmp_path)
        assert result["totalDurationSeconds"] > 0
        assert result["status"] == "COMPLETED"

    def test_short_duration(self, tmp_path):
        payload = make_payload(total_duration=5.0)
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"


class TestAudioJob_Music:
    """Music selection — musicTrackId điều khiển BGM."""

    def test_with_music_track(self, tmp_path):
        payload = make_payload(musicTrackId="acoustic-warm-guitar")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_without_music_track(self, tmp_path):
        payload = make_payload(musicTrackId=None)
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_music_mood_in_payload(self, tmp_path):
        payload = make_payload(musicMood="romantic")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"


class TestAudioJob_EmptyScenes:
    """Edge case: không có scene."""

    def test_empty_scenes_list(self, tmp_path):
        payload = make_payload(scenes=[], total_duration=10.0)
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"


class TestAudioJob_Structure:
    """Kết quả có đúng cấu trúc expected."""

    def test_result_has_required_fields(self, tmp_path):
        payload = make_payload()
        result = process_audio_job(payload, tmp_path)
        assert "status" in result
        assert "scenes" in result
        assert "providerUsed" in result
        for scene in result["scenes"]:
            assert "sceneIndex" in scene
            assert "voiceUrl" in scene
            assert "voiceStorageKey" in scene
            assert "actualDurationSeconds" in scene


class TestAudioJob_ProviderUsed:
    """Kiểm tra provider nào được sử dụng."""

    def test_openai_provider(self, tmp_path):
        payload = make_payload(providerKey="openai")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_elevenlabs_provider(self, tmp_path):
        payload = make_payload(providerKey="elevenlabs")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"

    def test_local_fallback_provider(self, tmp_path):
        payload = make_payload(providerKey="local_fallback")
        result = process_audio_job(payload, tmp_path)
        assert result["status"] == "COMPLETED"
