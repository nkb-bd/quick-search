import { ref, watch } from 'vue'

export function useRecentSearches() {
  const recentSearches = ref<string[]>([])
  const STORAGE_KEY = 'quick-search-recent-searches'
  const MAX_RECENT_SEARCHES = 8

  // Load recent searches from storage
  const loadRecentSearches = async (): Promise<void> => {
    try {
      console.log('Loading recent searches from storage...')
      const result = await chrome.storage.local.get(STORAGE_KEY)
      
      if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
        recentSearches.value = result[STORAGE_KEY]
        console.log('Loaded recent searches:', recentSearches.value)
      } else {
        console.log('No recent searches found in storage')
        recentSearches.value = []
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
      recentSearches.value = []
    }
  }

  // Save recent searches to storage
  const saveRecentSearches = async (): Promise<void> => {
    try {
      console.log('Saving recent searches:', recentSearches.value)
      await chrome.storage.local.set({
        [STORAGE_KEY]: recentSearches.value
      })
      
      // Notify other instances
      chrome.runtime.sendMessage({
        action: 'recentSearchesUpdated',
        searches: recentSearches.value
      }).catch(() => {
        // Ignore if no listeners
      })
      
    } catch (error) {
      console.error('Error saving recent searches:', error)
    }
  }

  // Add a new recent search
  const addRecentSearch = async (query: string): Promise<void> => {
    if (!query || query.trim().length === 0) return

    const cleanQuery = query.trim()
    console.log('Adding recent search:', cleanQuery)

    // Remove existing entry if it exists (case insensitive)
    recentSearches.value = recentSearches.value.filter(
      search => search.toLowerCase() !== cleanQuery.toLowerCase()
    )

    // Add new search at the beginning
    recentSearches.value.unshift(cleanQuery)

    // Keep only the most recent searches
    if (recentSearches.value.length > MAX_RECENT_SEARCHES) {
      recentSearches.value = recentSearches.value.slice(0, MAX_RECENT_SEARCHES)
    }

    console.log('Updated recent searches:', recentSearches.value)

    // Save to storage
    await saveRecentSearches()
  }

  // Clear all recent searches
  const clearRecentSearches = async (): Promise<void> => {
    recentSearches.value = []
    await saveRecentSearches()
  }

  // Add sample searches for testing
  const addSampleSearches = async (): Promise<void> => {
    if (recentSearches.value.length === 0) {
      const sampleSearches = [
        'Vue.js tutorial',
        'JavaScript async await',
        'Chrome extension development',
        'CSS grid layout',
        'TypeScript interfaces'
      ]
      
      recentSearches.value = sampleSearches
      await saveRecentSearches()
      console.log('Added sample searches:', sampleSearches)
    }
  }

  // Listen for storage changes from other instances
  const setupStorageListener = () => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue
        if (newValue && Array.isArray(newValue)) {
          console.log('Recent searches updated from storage:', newValue)
          recentSearches.value = newValue
        }
      }
    })
  }

  // Listen for messages from other parts of the extension
  const setupMessageListener = () => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'recentSearchesUpdated' && message.searches) {
        console.log('Recent searches updated from message:', message.searches)
        recentSearches.value = message.searches
      }
    })
  }

  // Initialize
  const initialize = async () => {
    await loadRecentSearches()
    setupStorageListener()
    setupMessageListener()
    
    // Add sample data if empty
    if (recentSearches.value.length === 0) {
      await addSampleSearches()
    }
  }

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    loadRecentSearches,
    initialize
  }
}
