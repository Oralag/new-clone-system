#!/usr/bin/env python3
"""
数字游牧ERP — 社交媒体发布服务
基于 social-auto-upload (sau) 的本地发布服务

安装依赖：
  pip install fastapi uvicorn
  pip install social-auto-upload   # 或 pip install git+https://github.com/dreammis/social-auto-upload.git

首次使用须登录账号（以小红书为例）：
  sau xiaohongshu login --account default

启动服务：
  python server.py

暴露给云端（配合 ngrok）：
  ngrok http 8765
  然后把 ngrok URL 填入 ERP 设置 → 发布服务地址
"""

import subprocess
import os
import tempfile
import urllib.request
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="数字游牧 社交发布服务", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 数据模型 ─────────────────────────────────────────────────────────────────

class PublishRequest(BaseModel):
    platform: str          # xiaohongshu / douyin / bilibili / kuaishou
    account: str = "default"
    title: str
    body: str
    hashtags: List[str] = []
    images: List[str] = []   # HTTP URL 或本地路径
    schedule: Optional[str] = None   # "2026-03-24 21:30"

class PublishResponse(BaseModel):
    success: bool
    message: str

class AccountStatus(BaseModel):
    platform: str
    account: str
    logged_in: bool

# ── 支持的平台映射 ────────────────────────────────────────────────────────────

SUPPORTED_PLATFORMS = {"xiaohongshu", "douyin", "bilibili", "kuaishou"}

# ── 辅助函数 ─────────────────────────────────────────────────────────────────

def download_image(url: str, tmp_dir: str) -> str:
    """把 HTTP 图片下载到临时目录，返回本地路径"""
    ext = url.split("?")[0].rsplit(".", 1)[-1] if "." in url else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"
    filename = os.path.join(tmp_dir, f"img_{hash(url) & 0xFFFFFF}.{ext}")
    if not os.path.exists(filename):
        urllib.request.urlretrieve(url, filename)
    return filename

def resolve_images(images: List[str], tmp_dir: str) -> List[str]:
    """把 URL 列表转成本地文件路径列表"""
    local_paths = []
    for img in images:
        if img.startswith("http://") or img.startswith("https://"):
            local_paths.append(download_image(img, tmp_dir))
        elif os.path.exists(img):
            local_paths.append(img)
        else:
            raise ValueError(f"图片不存在: {img}")
    return local_paths

def build_note(body: str, hashtags: List[str]) -> str:
    """拼正文 + 话题标签"""
    if hashtags:
        return body + "\n\n" + " ".join(f"#{tag}" for tag in hashtags)
    return body

def run_sau(cmd: List[str]) -> PublishResponse:
    """运行 sau 命令，返回结果"""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=180, encoding="utf-8"
        )
        if result.returncode == 0:
            return PublishResponse(success=True, message="发布成功 ✅")
        else:
            err = (result.stderr or result.stdout or "未知错误").strip()[:300]
            return PublishResponse(success=False, message=f"发布失败：{err}")
    except subprocess.TimeoutExpired:
        return PublishResponse(success=False, message="超时（>3分钟），请检查浏览器是否卡住")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="未找到 sau 命令，请先运行: pip install social-auto-upload"
        )

# ── 接口 ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "数字游牧社交发布服务"}


@app.post("/publish", response_model=PublishResponse)
async def publish(req: PublishRequest):
    if req.platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(400, f"不支持的平台: {req.platform}，可选: {', '.join(SUPPORTED_PLATFORMS)}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        # 下载/解析图片
        local_images: List[str] = []
        if req.images:
            try:
                local_images = resolve_images(req.images, tmp_dir)
            except Exception as e:
                return PublishResponse(success=False, message=f"图片处理失败：{e}")

        note = build_note(req.body, req.hashtags)

        if req.platform in {"xiaohongshu", "kuaishou"} and local_images:
            # 图文帖子
            cmd = [
                "sau", req.platform, "upload-note",
                "--account", req.account,
                "--title", req.title,
                "--note", note,
                "--images", *local_images,
            ]
        elif req.platform == "douyin" and local_images:
            # 抖音图文
            cmd = [
                "sau", "douyin", "upload-note",
                "--account", req.account,
                "--title", req.title,
                "--note", note,
                "--images", *local_images,
            ]
        elif req.platform == "bilibili":
            # B站专栏（纯文字）
            cmd = [
                "sau", "bilibili", "upload-note",
                "--account", req.account,
                "--title", req.title,
                "--note", note,
            ]
        else:
            return PublishResponse(
                success=False,
                message=f"{req.platform} 图文发布需要提供图片，请先生成海报或上传图片"
            )

        if req.schedule:
            cmd.extend(["--schedule", req.schedule])

        return run_sau(cmd)


@app.get("/accounts/{platform}", response_model=AccountStatus)
def check_account(platform: str, account: str = "default"):
    """检查某平台账号是否已登录"""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(400, f"不支持的平台: {platform}")
    try:
        result = subprocess.run(
            ["sau", platform, "check", "--account", account],
            capture_output=True, text=True, timeout=30
        )
        return AccountStatus(platform=platform, account=account, logged_in=result.returncode == 0)
    except FileNotFoundError:
        raise HTTPException(500, "未安装 social-auto-upload")


@app.post("/login/{platform}")
def login(platform: str, account: str = "default"):
    """触发登录（会打开浏览器，须在本地执行）"""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(400, f"不支持的平台: {platform}")
    subprocess.Popen(["sau", platform, "login", "--account", account])
    return {"message": f"已打开 {platform} 登录浏览器，请在浏览器中完成登录"}


# ── 启动 ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("🚀 数字游牧社交发布服务")
    print("📖 接口文档: http://localhost:8765/docs")
    print("✅ 健康检查: http://localhost:8765/health")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8765)
