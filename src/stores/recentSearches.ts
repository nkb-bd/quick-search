import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface RecentSearch {
  query: string
  timestamp: number
  url?: string
  title?: string
  type: 'search' | 'navigation' | 'tab_switch'
  favicon?: string
}

export const useRecentSearchesStore = defineStore('recentSearches', () => {
  // State
  const recentSearches = ref<RecentSearch[]>([])
  const isLoading = ref(false)
  const lastUpdated = ref<number>(0)

  // Constants
  const STORAGE_KEY = 'quick-search-recent-searches'
  const MAX_RECENT_SEARCHES = 10

  // Getters
  const recentSearchQueries = computed(() =>
    recentSearches.value.map(search => search.query)
  )

  const hasRecentSearches = computed(() =>
    recentSearches.value.length > 0
  )

  const getRecentSearchesByLimit = (limit: number) =>
    recentSearches.value.slice(0, limit)

  // Actions
  const loadFromStorage = async () => {
    isLoading.value = true
    try {
      console.log('Loading recent searches from storage...')

      const result = await chrome.storage.local.get(STORAGE_KEY)

      if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
        // Validate and migrate old format if needed
        const stored = result[STORAGE_KEY]

        if (stored.length > 0) {
          // Check if it's old format (array of strings) or new format (array of objects)
          if (typeof stored[0] === 'string') {
            // Migrate old format (strings)
            console.log('Migrating old format recent searches (strings)...')
            recentSearches.value = stored.map((query: string, index: number) => ({
              query,
              timestamp: Date.now() - (index * 1000), // Fake timestamps
              url: undefined,
              title: undefined,
              type: 'search' as const,
              favicon: undefined
            }))
            await saveToStorage() // Save in new format
          } else if (stored[0] && !stored[0].type) {
            // Migrate intermediate format (objects without type)
            console.log('Migrating intermediate format recent searches...')
            recentSearches.value = stored.map((item: any) => ({
              ...item,
              type: 'search' as const,
              favicon: undefined
            }))
            await saveToStorage() // Save in new format
          } else {
            // New format with type field
            recentSearches.value = stored
          }
        }

        console.log('Loaded recent searches:', recentSearches.value)
      } else {
        console.log('No recent searches found in storage')
        recentSearches.value = []
      }

      lastUpdated.value = Date.now()
    } catch (error) {
      console.error('Error loading recent searches:', error)
      recentSearches.value = []
    } finally {
      isLoading.value = false
    }
  }

  const saveToStorage = async () => {
    try {
      console.log('Saving recent searches to storage:', recentSearches.value)

      await chrome.storage.local.set({
        [STORAGE_KEY]: recentSearches.value
      })

      lastUpdated.value = Date.now()

      // Notify other instances
      notifyOtherInstances()

    } catch (error) {
      console.error('Error saving recent searches:', error)
    }
  }

  const addRecentSearch = async (query: string, url?: string, title?: string, type: 'search' | 'navigation' | 'tab_switch' = 'search') => {
    if (!query || query.trim().length === 0) return

    const cleanQuery = query.trim()
    const timestamp = Date.now()

    console.log('Adding recent item:', { query: cleanQuery, url, title, type })

    // For navigation and tab switches, use URL as the key for deduplication
    // For searches, use query as the key
    const isDuplicate = recentSearches.value.some(search => {
      if (type === 'search') {
        return search.query.toLowerCase() === cleanQuery.toLowerCase() && search.type === 'search'
      } else {
        return search.url === url && search.type === type
      }
    })

    // Remove existing entry if it exists
    if (isDuplicate) {
      recentSearches.value = recentSearches.value.filter(search => {
        if (type === 'search') {
          return !(search.query.toLowerCase() === cleanQuery.toLowerCase() && search.type === 'search')
        } else {
          return !(search.url === url && search.type === type)
        }
      })
    }

    // Get favicon for navigation items
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
    const newSearch: RecentSearch = {
      query: cleanQuery,
      timestamp,
      url,
      title,
      type,
      favicon
    }

    recentSearches.value.unshift(newSearch)

    // Keep only the most recent items
    if (recentSearches.value.length > MAX_RECENT_SEARCHES) {
      recentSearches.value = recentSearches.value.slice(0, MAX_RECENT_SEARCHES)
    }

    console.log('Updated recent items:', recentSearches.value)

    // Save to storage
    await saveToStorage()
  }

  const removeRecentSearch = async (query: string) => {
    recentSearches.value = recentSearches.value.filter(
      search => search.query !== query
    )
    await saveToStorage()
  }

  const clearRecentSearches = async () => {
    console.log('Clearing all recent searches')
    recentSearches.value = []
    await saveToStorage()
  }

  const addSampleSearches = async () => {
    // Disabled automatic sample data - only add manually for testing
    console.log('Sample searches disabled - recent searches will be empty until user searches')
  }

  const clearSampleData = async () => {
    // Clear any existing sample data
    const sampleQueries = [
      'Vue.js tutorial',
      'JavaScript async await',
      'Chrome extension development',
      'CSS grid layout',
      'TypeScript interfaces'
    ]

    // Remove sample searches if they exist
    recentSearches.value = recentSearches.value.filter(
      search => !sampleQueries.includes(search.query)
    )

    if (recentSearches.value.length === 0) {
      console.log('🧹 Cleared sample data from recent searches')
      await saveToStorage()
    }
  }

  const notifyOtherInstances = () => {
    const message = {
      action: 'recentSearchesUpdated',
      searches: recentSearches.value, // Send full objects
      timestamp: lastUpdated.value
    }

    console.log('📡 Broadcasting recent searches update to other instances')

    // Send message to background script
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore if no listeners
    })

    // Send message to all tabs (including content scripts and other popups)
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors for tabs that don't have content scripts
          })
        }
      })
    })

    // Also try to send to other extension contexts
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore if no other contexts are listening
    })
  }

  const setupStorageListener = () => {
    // Listen for storage changes from other tabs/instances
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue
        if (newValue && Array.isArray(newValue)) {
          console.log('🔄 Recent searches updated from another tab:', newValue)

          // Only update if the data is actually different to avoid loops
          const currentQueries = recentSearches.value.map(s => s.query)
          const newQueries = newValue.map(s => s.query)

          if (JSON.stringify(currentQueries) !== JSON.stringify(newQueries)) {
            recentSearches.value = newValue
            lastUpdated.value = Date.now()
            console.log('✅ Recent searches synchronized across tabs')
          }
        }
      }
    })
  }

  const setupMessageListener = () => {
    // Listen for messages from other tabs/popups
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (message.action === 'recentSearchesUpdated') {
        console.log('📬 Message received from:', sender.tab ? `tab ${sender.tab.id}` : 'extension')

        if (message.searches && message.timestamp && message.timestamp > lastUpdated.value) {
          console.log('🔄 Updating recent searches from message:', message.searches)

          // Convert array of strings to RecentSearch objects if needed
          if (Array.isArray(message.searches)) {
            if (typeof message.searches[0] === 'string') {
              // Convert string array to RecentSearch objects
              recentSearches.value = message.searches.map((query: string, index: number) => ({
                query,
                timestamp: Date.now() - (index * 1000),
                url: undefined,
                title: undefined
              }))
            } else {
              // Already RecentSearch objects
              recentSearches.value = message.searches
            }
          }

          lastUpdated.value = message.timestamp
          console.log('✅ Recent searches synchronized from message')
        }
      }
    })
  }

  const initialize = async () => {
    console.log('Initializing recent searches store...')

    // Set up listeners first
    setupStorageListener()
    setupMessageListener()

    // Load existing data
    await loadFromStorage()

    // Clear any existing sample data
    await clearSampleData()

    // No automatic sample data - let users build their own recent searches
    console.log('Recent searches store ready - no sample data added')

    console.log('Recent searches store initialized')
  }

  // Auto-save when recentSearches changes
  watch(
    recentSearches,
    () => {
      // Debounce saves to avoid too many storage writes
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        saveToStorage()
      }, 500)
    },
    { deep: true }
  )

  let saveTimeout: ReturnType<typeof setTimeout>

  return {
    // State
    recentSearches,
    isLoading,
    lastUpdated,

    // Getters
    recentSearchQueries,
    hasRecentSearches,
    getRecentSearchesByLimit,

    // Actions
    loadFromStorage,
    saveToStorage,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    addSampleSearches,
    clearSampleData,
    initialize
  }
})
