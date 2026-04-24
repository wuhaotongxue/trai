# trai

一个用于实验与沉淀代码片段的小仓库。

## 环境要求

- **后端 Python 环境**: 	rai (Conda) / Python 3.13.13

### 使用 Conda 创建后端环境（推荐使用清华源）

\\\ash
# 1. 创建 conda 虚拟环境
conda create -n trai python=3.13.13 -y

# 2. 激活环境
conda activate trai

# 3. 设置默认激活环境 (可选)
# 如果你希望每次打开终端时自动激活该环境，可以执行以下命令：
# 对于 PowerShell:
# Add-Content -Path $PROFILE -Value "
conda activate trai"
# 对于 CMD:
# reg add "HKCU\Software\Microsoft\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "conda activate trai" /f

# 4. 安装依赖（使用清华源加速）
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .
\\\

## 快速开始

\\\ash
git clone https://github.com/wuhaotongxue/trai.git
cd trai
\\\

## 镜像仓库

- GitHub：https://github.com/wuhaotongxue/trai
- Gitee（码云）：https://gitee.com/no5689/trai
- 如有问题, 请联系邮箱: wuhaotongxue@gmail.com

## 贡献

欢迎提交 Issue / PR。

## 作者

wuhaotongxue <wuhaotongxue@gmail.com>
