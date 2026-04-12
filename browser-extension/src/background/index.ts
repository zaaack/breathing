// Background service worker for Breathing App Chrome Extension

// 窗口尺寸配置（手机大小）
const WINDOW_WIDTH = 375
const WINDOW_HEIGHT = 667

// 存储当前窗口 ID
let currentWindowId: number | null = null

// 点击图标：创建或聚焦小窗口
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('/dist/index.html')

  // 如果窗口已存在，聚焦它
  if (currentWindowId) {
    try {
      const win = await chrome.windows.get(currentWindowId)
      if (win) {
        chrome.windows.update(currentWindowId, { focused: true })
        return
      }
    } catch {
      currentWindowId = null
    }
  }

  // 获取当前活动窗口以计算位置
  const currentWindow = await chrome.windows.getCurrent()

  // 计算窗口位置：右上角，扩展图标下方
  const toolbarHeight = 40
  const iconWidth = 30
  const padding = 8

  let left = 100
  let top = 100

  if (currentWindow && currentWindow.left !== undefined && currentWindow.width !== undefined) {
    left = currentWindow.left + currentWindow.width - WINDOW_WIDTH - iconWidth - padding
    top = currentWindow.top ?? 0
    top += toolbarHeight + padding
  }

  // 创建新的小窗口
  const win = await chrome.windows.create({
    url,
    type: 'popup',
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT + 35,
    left: Math.round(left),
    top: Math.round(top),
    focused: true,
  })
  if (win?.id) {
    currentWindowId = win.id
  }
})

// 监听窗口关闭
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === currentWindowId) {
    currentWindowId = null
  }
})