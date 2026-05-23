#!/bin/bash
# 文件名: install_advanced_dubbing.sh
# 描述: 自动安装高级影视级 AI 视频配音流水线依赖 (需在 trai31313 conda 环境下运行)

echo "🚀 开始安装高级 AI 视频配音流水线依赖..."

# 1. 安装 Demucs (人声分离)
echo "[1/5] 安装 Demucs..."
pip install -U demucs

# 2. 安装 WhisperX (带时间戳和说话人分离的 STT)
echo "[2/5] 安装 WhisperX..."
pip install git+https://github.com/m-bain/whisperx.git

# 3. 安装 NLLB-200 依赖 (HuggingFace Transformers)
echo "[3/5] 安装 NLLB/Transformers..."
pip install transformers accelerate sentencepiece

# 4. 声音克隆 ModelScope CosyVoice 依赖准备
echo "[4/5] 安装 ModelScope CosyVoice 依赖..."
pip install modelscope matchaudiotext gradio WeTextProcessing
pip install onnxruntime omegaconf

# 5. Wav2Lip 依赖准备
echo "[5/5] 安装 Wav2Lip 基础依赖..."
pip install opencv-python mediapipe librosa==0.9.2

echo "✅ 基础依赖安装完成！"
echo "⚠️ 注意: 运行此流水线还需要下载以下巨大的模型权重文件："
echo "1. Wav2Lip GAN 模型 (wav2lip_gan.pth) 和人脸检测模型 (s3fd.pth)"
echo "2. ModelScope CosyVoice 预训练底模 (iic/CosyVoice-300M)"
echo "请根据官方文档下载至对应目录。"
