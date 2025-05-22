// Content script for cross-tab synchronization
// This runs in every tab to enable communication between tabs

console.log('🔄 Quick Search sync content script loaded')

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📬 Content script received message:', message.action)
  
  if (message.action === 'recentSearchesUpdated') {
    // Forward the message to any Pinia stores that might be listening
    // This is handled by the store's message listener
    console.log('✅ Recent searches sync message received in tab')
  }
  
  // Always send a response to avoid "port closed" errors
  sendResponse({ received: true })
})

// Notify that this tab is ready for sync
chrome.runtime.sendMessage({
  action: 'tabReady',
  tabId: 'content-script'
}).catch(() => {
  // Ignore if background script isn't ready
})

export {}
