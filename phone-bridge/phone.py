#!/usr/bin/env python3
"""安卓手机控制层 —— 基于 adb，给微信/小红书等 App 做 UI 自动化。

为什么是安卓不是 iPhone：iOS 沙盒不允许外部进程读取或点击第三方 App 的界面，
苹果没有 adb 的对应物。iPhone 上这层做不了，只能走网页版或快捷指令。

首次准备：
  1. 手机开「开发者选项 → USB 调试」，USB 连上 Mac，弹窗点「允许」
  2. 中文输入需要 ADBKeyboard（adb shell input text 不支持中文）：
       下载 https://github.com/senzhk/ADBKeyBoard/raw/master/ADBKeyboard.apk
       adb install ADBKeyboard.apk
       adb shell ime enable com.android.adbkeyboard/.AdbIME
       adb shell ime set com.android.adbkeyboard/.AdbIME
  3. 无线调试（拔线用）：
       adb tcpip 5555 && adb connect 手机IP:5555

用法：
  python3 phone.py status                  # 看设备连没连
  python3 phone.py shot                    # 截屏到 shots/
  python3 phone.py dump                    # 导出当前界面所有可点文字
  python3 phone.py tap "通讯录"             # 按文字点击
  python3 phone.py type "你好"              # 输入中文
  python3 phone.py wechat "文件传输助手" "测试"  # 发微信消息
"""

import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

SHOTS = Path(__file__).parent / "shots"
PKG = {
    "wechat": "com.tencent.mm",
    "xiaohongshu": "com.xingin.xhs",
    "alipay": "com.eg.android.AlipayGphone",
}


def sh(*args, timeout=60):
    r = subprocess.run(["adb", *args], capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.returncode


def devices():
    out, _ = sh("devices")
    return [l.split("\t")[0] for l in out.splitlines()[1:] if "\tdevice" in l]


def require_device():
    d = devices()
    if not d:
        raise SystemExit(
            "❌ 没有连接的安卓设备。\n"
            "   USB：插线 + 手机开 USB 调试 + 弹窗点「允许」\n"
            "   无线：adb connect 手机IP:5555\n"
            "   查看：adb devices"
        )
    return d[0]


def screenshot(name=None):
    SHOTS.mkdir(exist_ok=True)
    name = name or f"shot_{int(time.time())}.png"
    path = SHOTS / name
    r = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True, timeout=60)
    path.write_bytes(r.stdout)
    return path


def ui_dump():
    """抓当前界面的控件树，返回 [{text, desc, clickable, bounds, center}]"""
    sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml, _ = sh("shell", "cat", "/sdcard/ui.xml")
    nodes = []
    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        return nodes
    for n in root.iter("node"):
        text = n.get("text", "") or ""
        desc = n.get("content-desc", "") or ""
        if not text and not desc:
            continue
        b = re.findall(r"\d+", n.get("bounds", ""))
        if len(b) != 4:
            continue
        x1, y1, x2, y2 = map(int, b)
        nodes.append({
            "text": text,
            "desc": desc,
            "clickable": n.get("clickable") == "true",
            "center": ((x1 + x2) // 2, (y1 + y2) // 2),
        })
    return nodes


def find(label, exact=False):
    """按文字或 content-desc 找控件，返回中心坐标"""
    for n in ui_dump():
        hay = f"{n['text']}|{n['desc']}"
        if (label == n["text"] or label == n["desc"]) if exact else (label in hay):
            return n["center"]
    return None


def tap(label=None, xy=None, wait=1.2, retries=3):
    """点击 —— 可按文字找，也可直接给坐标。找不到会重试（界面可能还在加载）"""
    if xy:
        sh("shell", "input", "tap", str(xy[0]), str(xy[1]))
        time.sleep(wait)
        return True
    for i in range(retries):
        pos = find(label)
        if pos:
            sh("shell", "input", "tap", str(pos[0]), str(pos[1]))
            time.sleep(wait)
            return True
        time.sleep(1)
    return False


def type_text(text):
    """输入文本。中文走 ADBKeyboard 广播；纯 ASCII 直接 input text。"""
    if text.isascii():
        sh("shell", "input", "text", text.replace(" ", "%s"))
        return True
    out, _ = sh("shell", "ime", "list", "-s")
    if "adbkeyboard" not in out.lower():
        raise SystemExit(
            "❌ 中文输入需要 ADBKeyboard，未检测到。\n"
            "   adb install ADBKeyboard.apk\n"
            "   adb shell ime enable com.android.adbkeyboard/.AdbIME\n"
            "   adb shell ime set com.android.adbkeyboard/.AdbIME"
        )
    b64 = __import__("base64").b64encode(text.encode()).decode()
    sh("shell", "am", "broadcast", "-a", "ADB_INPUT_B64", "--es", "msg", b64)
    time.sleep(0.6)
    return True


def open_app(key):
    pkg = PKG.get(key, key)
    sh("shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1")
    time.sleep(3)


def back(n=1):
    for _ in range(n):
        sh("shell", "input", "keyevent", "4")
        time.sleep(0.6)


def wechat_send(target, message):
    """给指定联系人/群发一条微信消息。

    风险提示：微信对 UI 自动化有风控，高频使用有封号先例。
    建议只用于「文件传输助手」等自用场景，或低频人工节奏。
    """
    require_device()
    open_app("wechat")
    time.sleep(2)

    if not tap("搜索"):
        # 部分版本搜索是右上角图标，退回坐标兜底：屏幕宽度 88% 处
        out, _ = sh("shell", "wm", "size")
        m = re.search(r"(\d+)x(\d+)", out)
        if m:
            w, h = int(m.group(1)), int(m.group(2))
            tap(xy=(int(w * 0.88), int(h * 0.06)))
        else:
            return False, "找不到搜索入口"

    type_text(target)
    time.sleep(1.5)
    if not tap(target):
        return False, f"搜索不到联系人「{target}」"

    if not tap("发送消息", retries=1):
        pass  # 多数情况点搜索结果直接进会话

    time.sleep(1)
    out, _ = sh("shell", "wm", "size")
    m = re.search(r"(\d+)x(\d+)", out)
    w, h = (int(m.group(1)), int(m.group(2))) if m else (1080, 2400)
    tap(xy=(int(w * 0.45), int(h * 0.94)))  # 输入框

    type_text(message)
    time.sleep(0.8)
    if not tap("发送", retries=2):
        sh("shell", "input", "keyevent", "66")
    time.sleep(1)
    return True, f"已发送给「{target}」"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    cmd = sys.argv[1]
    args = sys.argv[2:]

    if cmd == "status":
        d = devices()
        if d:
            model, _ = sh("shell", "getprop", "ro.product.model")
            ver, _ = sh("shell", "getprop", "ro.build.version.release")
            ime, _ = sh("shell", "ime", "list", "-s")
            print(f"✅ 已连接：{d[0]}  {model}  Android {ver}")
            print(f"   中文输入：{'✅ ADBKeyboard 就绪' if 'adbkeyboard' in ime.lower() else '❌ 未装 ADBKeyboard，中文发不了'}")
        else:
            print("❌ 无设备。插 USB + 开 USB 调试，或 adb connect 手机IP:5555")

    elif cmd == "shot":
        require_device()
        print(f"✅ {screenshot()}")

    elif cmd == "dump":
        require_device()
        for n in ui_dump():
            mark = "🔘" if n["clickable"] else "  "
            print(f"{mark} {(n['text'] or n['desc'])[:40]:<42} {n['center']}")

    elif cmd == "tap":
        require_device()
        print("✅ 已点击" if tap(args[0]) else f"❌ 找不到「{args[0]}」")

    elif cmd == "type":
        require_device()
        type_text(args[0])
        print("✅ 已输入")

    elif cmd == "open":
        require_device()
        open_app(args[0])
        print(f"✅ 已打开 {args[0]}")

    elif cmd == "wechat":
        ok, msg = wechat_send(args[0], args[1])
        print(("✅ " if ok else "❌ ") + msg)

    else:
        print(__doc__)


if __name__ == "__main__":
    main()
