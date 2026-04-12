import './App.css'

export default function App() {
  const iframeUrl = chrome.runtime.getURL('/dist/index.html')

  const mergeToMain = () => {
    chrome.runtime.sendMessage({ type: 'mergeToMain' })
  }

  const openFullscreen = () => {
    chrome.runtime.sendMessage({ type: 'openFullscreen', url: iframeUrl })
  }

  return (
    <div className="floating-container">
      <div className="floating-header">
        <button className="header-btn" onClick={mergeToMain} title="合并到主窗口">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <button className="header-btn" onClick={openFullscreen} title="全屏打开">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
      <iframe className="floating-iframe" src={iframeUrl} frameBorder="0" allowFullScreen />
    </div>
  )
}
