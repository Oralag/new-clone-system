# 2026-04-17 移动端聊天左滑功能修复

## 目标
修复移动端聊天列表左滑操作按钮（置顶/删除）的显示问题

## 问题描述
- 用户左滑后手指松开，按钮就消失了，无法点击"置顶"和"删除"
- 之前多次尝试修改 `onSwipeEnd` 都无效

## 根本原因
移动端 `touchend` 事件之后会触发 `click` 事件。
之前 `@click="closeSwipe()"` 在每次点击时都会关闭 swipedId。
所以即使 `onSwipeEnd` 不再清空 swipedId，紧随其后的 `click` 事件又把按钮关掉了。

## 最终解决方案
加 `swipeMoved` 标志区分"滑动"和"点击"：

```javascript
const swipeMoved = ref(false) // 区分滑动 vs 点击

function onSwipeStart(e: TouchEvent, g: any) {
  swipeStartX.value = e.touches[0].clientX
  swipeMoved.value = false  // 重置
  currentSwipeItem.value = g
}

function onSwipeMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - swipeStartX.value
  if (Math.abs(dx) > 5) swipeMoved.value = true  // 有实际滑动
  // ... 左滑/右滑逻辑
}

function onSwipeEnd() {
  currentSwipeItem.value = null
  // 不清 swipedId，保持按钮显示
}

// 模板
@click="swipeMoved ? (swipeMoved = false) : (closeSwipe(), router.push(...))"
```

## 行为逻辑
| 操作 | 结果 |
|------|------|
| 左滑后手指松开 | 按钮保持显示 ✅ |
| 点击置顶/删除 | 执行操作 + 关闭按钮 ✅ |
| 点击其他区域 | 关闭按钮 ✅ |
| 纯点击进入聊天 | 正常导航 ✅ |

## 部署结果
- 最终版本：https://0b6ff5a9.nomaderp.pages.dev

## 修改文件
- `/Users/oralagborjigin/new-clone-system/src/views/mobile/MobileChat.vue`

## 历史记录
- 尝试1：CSS opacity 控制 → 无效
- 尝试2：CSS display 控制 → 无效
- 尝试3：Vue v-show 指令 → 无效
- 尝试4：Vue v-if 严格条件 → 无效（找到真正原因）
- 尝试5（成功）：swipeMoved 标志区分滑动 vs 点击
