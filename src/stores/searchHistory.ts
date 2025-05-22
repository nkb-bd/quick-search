import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSearchHistoryStore = defineStore('searchHistory', () => {
  // State
  const searchHistory = ref<string[]>([])
  const isLoading = ref(false)

  // Constants
  const STORAGE_KEY = 'quick-search-history'
  const MAX_HISTORY_ITEMS = 50

  // Getters
  const hasHistory = computed(() => searchHistory.value.length > 0)
  
  const getHistoryByLimit = (limit: number) => 
    searchHistory.value.slice(0, limit)

  // Actions
  const loadFromStorage = async () => {
    isLoading.value = true
    try {
      console.log('Loading search history from storage...')
      
      const result = await chrome.storage.local.get(STORAGE_KEY)
      
      if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
        searchHistory.value = result[STORAGE_KEY]
        console.log('Loaded search history:', searchHistory.value.length, 'items')
      } else {
        console.log('No search history found in storage')
        searchHistory.value = []
      }
    } catch (error) {
      console.error('Error loading search history:', error)
      searchHistory.value = []
    } finally {
      isLoading.value = false
    }
  }

  const saveToStorage = async () => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY]: searchHistory.value
      })
      console.log('Saved search history:', searchHistory.value.length, 'items')
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  const addToHistory = async (query: string) => {
    if (!query || query.trim().length === 0) return

    const cleanQuery = query.trim()
    
    // Remove existing entry if it exists (case insensitive)
    searchHistory.value = searchHistory.value.filter(
      item => item.toLowerCase() !== cleanQuery.toLowerCase()
    )

    // Add new item at the beginning
    searchHistory.value.unshift(cleanQuery)

    // Keep only the most recent items
    if (searchHistory.value.length > MAX_HISTORY_ITEMS) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_ITEMS)
    }

    await saveToStorage()
  }

  const removeFromHistory = async (query: string) => {
    searchHistory.value = searchHistory.value.filter(item => item !== query)
    await saveToStorage()
  }

  const clearHistory = async () => {
    searchHistory.value = []
    await saveToStorage()
  }

  const initialize = async () => {
    await loadFromStorage()
  }

  return {
    // State
    searchHistory,
    isLoading,
    
    // Getters
    hasHistory,
    getHistoryByLimit,
    
    // Actions
    loadFromStorage,
    saveToStorage,
    addToHistory,
    removeFromHistory,
    clearHistory,
    initialize
  }
})
