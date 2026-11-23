import subprocess
import os
import sys

# 优先读取平台变量，默认回退到分配的 15581 端口
port = os.environ.get("SERVER_PORT", "15581")

# 1. 启动 FastAPI 后端
api_proc = subprocess.Popen([
    sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port
])

# 2. 启动 Telegram Bot
bot_proc = subprocess.Popen([sys.executable, "bot.py"])

api_proc.wait()
bot_proc.wait()
