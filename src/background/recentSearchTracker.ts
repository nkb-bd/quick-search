// Comprehensive Navigation Tracker - Monitors all browser activity

interface RecentItem {
  query: string
  timestamp: number
  url?: string
  title?: string
  type: 'search' | 'navigation' | 'tab_switch'
  favicon?: string
}

class RecentNavigationTracker {
  private recentItems: RecentItem[] = []
  private readonly MAX_RECENT_ITEMS = 15
  private readonly STORAGE_KEY = 'quick-search-recent-searches'
  private lastTabId: number | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Load existing recent searches
    await this.loadRecentSearches()

    // Set up listeners
    this.setupTabListeners()
    this.setupSearchListeners()

    console.log('🔄 Comprehensive Navigation Tracker initialized')
  }

  private async loadRecentSearches() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY)
      if (result[this.STORAGE_KEY] && Array.isArray(result[this.STORAGE_KEY])) {
        this.recentItems = result[this.STORAGE_KEY]
        console.log('💾 Loaded recent items:', this.recentItems.length)
      }
    } catch (error) {
      console.error('Error loading recent items:', error)
    }
  }

  private async saveRecentSearches() {
    try {
      console.log('💾 Saving recent items to storage:', this.recentItems.length)

      await chrome.storage.local.set({
        [this.STORAGE_KEY]: this.recentItems
      })

      // Notify all tabs about the update
      this.notifyTabsOfUpdate()
    } catch (error) {
      console.error('Error saving recent items:', error)
    }
  }

  private setupTabListeners() {
    // Listen for tab updates (navigation)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.title) {
        // Check if this is a search or regular navigation
        const searchQuery = this.extractSearchQuery(tab.url)
        if (searchQuery) {
          this.addRecentItem(searchQuery, tab.url, tab.title, 'search')
        } else {
          // Regular navigation - use page title as query
          this.addRecentItem(tab.title, tab.url, tab.title, 'navigation')
        }
      }
    })

    // Listen for tab activation (switching tabs)
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url && tab.title && this.lastTabId !== activeInfo.tabId) {
          console.log('🔄 Tab switched to:', tab.title)
          this.addRecentItem(tab.title, tab.url, tab.title, 'tab_switch')
          this.lastTabId = activeInfo.tabId
        }
      } catch (error) {
        console.error('Error handling tab activation:', error)
      }
    })
  }

  private setupSearchListeners() {
    // Listen for messages from content scripts or popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'addRecentSearch':
          this.addRecentItem(message.query, message.url, message.title, message.type || 'search')
          sendResponse({ success: true })
          break
        case 'getRecentSearches':
          sendResponse({ searches: this.getRecentSearchQueries() })
          break
        case 'clearRecentSearches':
          this.clearRecentSearches()
          sendResponse({ success: true })
          break
      }
    })
  }

  private addRecentItem(query: string, url?: string, title?: string, type: 'search' | 'navigation' | 'tab_switch' = 'search') {
    if (!query || query.trim().length === 0) return

    const cleanQuery = query.trim()
    const timestamp = Date.now()

    console.log('📝 Adding recent item:', { query: cleanQuery, type, url })

    // Remove existing entry if it exists
    this.recentItems = this.recentItems.filter(item => {
      if (type === 'search') {
        return !(item.query.toLowerCase() === cleanQuery.toLowerCase() && item.type === 'search')
      } else {
        return !(item.url === url && item.type === type)
      }
    })

    // Get favicon for non-search items
    let favicon: string | undefined
    if (type !== 'search' && url) {
      try {
        const urlObj = new URL(url)
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      } catch {
        favicon = undefined
      }
    }

    // Add new item at the beginning
    const newItem: RecentItem = {
      query: cleanQuery,
      timestamp,
      url,
      title,
      type,
      favicon
    }

    this.recentItems.unshift(newItem)

    // Keep only the most recent items
    if (this.recentItems.length > this.MAX_RECENT_ITEMS) {
      this.recentItems = this.recentItems.slice(0, this.MAX_RECENT_ITEMS)
    }

    // Save to storage
    this.saveRecentSearches()
  }

  private extractSearchQuery(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Google Search
      if (hostname.includes('google.com')) {
        return urlObj.searchParams.get('q')
      }

      // Bing Search
      if (hostname.includes('bing.com')) {
        return urlObj.searchParams.get('q')
      }

      // DuckDuckGo
      if (hostname.includes('duckduckgo.com')) {
        return urlObj.searchParams.get('q')
      }

      // Perplexity
      if (hostname.includes('perplexity.ai')) {
        return urlObj.searchParams.get('q')
      }

      // Yahoo Search
      if (hostname.includes('yahoo.com')) {
        return urlObj.searchParams.get('p')
      }

      // Yandex
      if (hostname.includes('yandex.com')) {
        return urlObj.searchParams.get('text')
      }

      // Baidu
      if (hostname.includes('baidu.com')) {
        return urlObj.searchParams.get('wd')
      }

      return null
    } catch (error) {
      return null
    }
  }

  // Legacy function for backward compatibility
  public addRecentSearch(query: string, url?: string, title?: string) {
    this.addRecentItem(query, url, title, 'search')
  }

  public getRecentSearchQueries(): string[] {
    return this.recentItems.map(item => item.query)
  }

  public getRecentItems(): RecentItem[] {
    return [...this.recentItems]
  }

  public clearRecentSearches() {
    this.recentItems = []
    this.saveRecentSearches()
  }

  private notifyTabsOfUpdate() {
    // Send message to all tabs to update their recent searches
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'recentSearchesUpdated',
            searches: this.getRecentSearchQueries(),
            items: this.getRecentItems()
          }).catch(() => {
            // Ignore errors for tabs that don't have content scripts
          })
        }
      })
    })

    // Also notify any open popups
    chrome.runtime.sendMessage({
      action: 'recentSearchesUpdated',
      searches: this.getRecentSearchQueries()
    }).catch(() => {
      // Ignore if no popup is open
    })
  }
}

// Initialize the comprehensive navigation tracker
export const recentNavigationTracker = new RecentNavigationTracker()
