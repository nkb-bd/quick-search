import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SearchEngine {
  name: string
  url: string
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const currentEngine = ref('Google')
  const isLoading = ref(false)

  // Constants
  const STORAGE_KEY = 'quick-search-settings'
  
  const searchEngines: SearchEngine[] = [
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' }
  ]

  // Getters
  const currentEngineUrl = computed(() => {
    const engine = searchEngines.find(e => e.name === currentEngine.value)
    return engine ? engine.url : searchEngines[0].url
  })

  const currentEngineData = computed(() => {
    return searchEngines.find(e => e.name === currentEngine.value) || searchEngines[0]
  })

  // Actions
  const loadFromStorage = async () => {
    isLoading.value = true
    try {
      console.log('Loading settings from storage...')
      
      const result = await chrome.storage.local.get(STORAGE_KEY)
      
      if (result[STORAGE_KEY]) {
        const settings = result[STORAGE_KEY]
        if (settings.currentEngine) {
          currentEngine.value = settings.currentEngine
        }
        console.log('Loaded settings:', settings)
      } else {
        console.log('No settings found in storage, using defaults')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  const saveToStorage = async () => {
    try {
      const settings = {
        currentEngine: currentEngine.value
      }
      
      await chrome.storage.local.set({
        [STORAGE_KEY]: settings
      })
      
      console.log('Saved settings:', settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const setSearchEngine = async (engineName: string) => {
    if (searchEngines.find(e => e.name === engineName)) {
      currentEngine.value = engineName
      await saveToStorage()
      console.log('Search engine changed to:', engineName)
    } else {
      console.error('Invalid search engine:', engineName)
    }
  }

  const cycleSearchEngine = async () => {
    const currentIndex = searchEngines.findIndex(e => e.name === currentEngine.value)
    const nextIndex = (currentIndex + 1) % searchEngines.length
    await setSearchEngine(searchEngines[nextIndex].name)
  }

  const initialize = async () => {
    await loadFromStorage()
  }

  return {
    // State
    currentEngine,
    isLoading,
    searchEngines,
    
    // Getters
    currentEngineUrl,
    currentEngineData,
    
    // Actions
    loadFromStorage,
    saveToStorage,
    setSearchEngine,
    cycleSearchEngine,
    initialize
  }
})
