#!/usr/bin/env python
"""
ACE-Step 音乐生成独立运行脚本
使用 soundfile 代替 torchaudio 避免 torchcodec 依赖问题
进程隔离，绕过 Python 3.13 keyword 参数限制
"""

import os
import sys
import time

# === sys.path 隔离 ===
for p in list(sys.path):
    if p.startswith("/home/qyjgylc_whf/code/trai/backend"):
        sys.path.remove(p)
_site_idx = next((i for i, p in enumerate(sys.path) if "site-packages" in p), len(sys.path))
sys.path.insert(_site_idx, "/home/qyjgylc_whf/code/trai/backend/acestep_lib")
sys.path.insert(_site_idx + 1, "/home/qyjgylc_whf/code/trai/backend/acestep_lib/acestep")

OUT_DIR = "/home/qyjgylc_whf/code/trai/output_music"
CKPT_DIR = os.path.join(OUT_DIR, "checkpoints")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CKPT_DIR, exist_ok=True)

print("[1] 导入 pipeline...")
import soundfile as sf
from acestep.pipeline_ace_step import ACEStepPipeline

print("[2] 创建 pipe...")
pipe = ACEStepPipeline(
    checkpoint_dir=CKPT_DIR,
    dtype="bfloat16",
    cpu_offload=True,
    torch_compile=False,
)
print("[3] 加载 checkpoint...")
pipe.load_checkpoint(CKPT_DIR)
pipe.loaded = True
print("[4] 模型加载完成")


def generate_music(
    prompt: str,
    duration: float = 30.0,
    steps: int = 27,
    guidance_scale: float = 7.0,
    output_path: str = None,
) -> str:
    """
    生成音乐并保存

    Args:
        prompt: 音乐描述
        duration: 时长（秒）
        steps: 推理步数
        guidance_scale: 引导强度
        output_path: 输出文件路径

    Returns:
        生成的音频文件路径
    """
    if output_path is None:
        timestamp = int(time.time())
        safe_prompt = "".join(c for c in prompt if c.isalnum() or c in (" ", "_", "-")).strip()[:30]
        output_path = os.path.join(OUT_DIR, f"{safe_prompt}_{timestamp}.wav")

    print(f"[5] 生成音乐 | prompt: {prompt} | duration: {duration}s | steps: {steps}...")

    t0 = time.time()

    # 使用纯 positional args 绕过 Python 3.13 keyword 参数限制
    result = pipe(
        duration,  # 1  audio_duration
        prompt,  # 2  prompt
        "",  # 3  o3ics
        steps,  # 4  infer_step
        guidance_scale,  # 5  guidance_scale
        "euler",  # 6  scheduler_type
        "apg",  # 7  cfg_type
        10.0,  # 8  omega_scale
        None,  # 9  manual_seeds
        0.5,  # 10 guidance_interval
        0.0,  # 11 guidance_interval_decay
        1.0,  # 12 min_guidance_scale
        False,  # 13 use_erg_tag
        False,  # 14 use_erg_o3ic
        False,  # 15 use_erg_diffusion
        "",  # 16 oss_steps
        0.0,  # 17 guidance_scale_text
        0.0,  # 18 guidance_scale_o3ic
        False,  # 19 audio2audio_enable
        0.5,  # 20 ref_audio_strength
        None,  # 21 ref_audio_input
        "none",  # 22 lora_name_or_path
        1.0,  # 23 lora_weight
        None,  # 24 retake_seeds
        0.5,  # 25 retake_variance
        "text2music",  # 26 task
        0,  # 27 repaint_start
        0,  # 28 repaint_end
        None,  # 29 src_audio_path
        None,  # 30 edit_target_prompt
        None,  # 31 edit_target_o3ics
        0.0,  # 32 edit_n_min
        1.0,  # 33 edit_n_max
        1,  # 34 edit_n_avg
        output_path,  # 35 save_path
        1,  # 36 batch_size
        False,  # 37 debug
    )

    elapsed = time.time() - t0
    print(f"[6] 生成完成! 耗时: {elapsed:.1f}s")

    # result 是 AudioResult 对象
    audio = result.audios[0]
    sr = result.sample_rate

    # 从音频张量保存
    if hasattr(audio, "cpu"):
        audio_np = audio.cpu().numpy()
        if audio_np.ndim == 2:
            audio_np = audio_np.T  # (channels, samples) -> (samples, channels)
        sf.write(output_path, audio_np, sr)
    else:
        sf.write(output_path, audio.T, sr)

    file_size = os.path.getsize(output_path)
    print(f"[7] 已保存: {output_path} ({file_size // 1024}KB)")

    return output_path


# === 命令行入口 ===
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python ace_step_music_runner.py <prompt> <duration> <steps> [guidance_scale] [output_path]")
        print("示例: python ace_step_music_runner.py '古风音乐' 30 27 7.0 /path/to/output.wav")
        sys.exit(1)

    prompt = sys.argv[1]
    duration = float(sys.argv[2])
    steps = int(sys.argv[3])
    guidance_scale = float(sys.argv[4]) if len(sys.argv) > 4 else 7.0
    output_path = sys.argv[5] if len(sys.argv) > 5 else None

    try:
        result_path = generate_music(prompt, duration, steps, guidance_scale, output_path)
        print(f"SUCCESS: {result_path}")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
