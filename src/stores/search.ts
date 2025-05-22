import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { useRecentSearchesStore } from './recentSearches'
import { useSearchHistoryStore } from './searchHistory'
import { useSettingsStore } from './settings'

export interface SearchResult {
  title: string
  url: string
  source: string
  tabId?: number
}

export const useSearchStore = defineStore('search', () => {
  // State
  const searchQuery = ref('')
  const searchResults = ref<SearchResult[]>([])
  const selectedResult = ref(0)
  const isLoading = ref(false)
  const showSuggestions = ref(false)
  const isTyping = ref(false)
  const hasSearched = ref(false)

  // UI State
  const showEngineIndicator = ref(false)
  const engineChanging = ref(false)

  // Store dependencies
  const recentSearchesStore = useRecentSearchesStore()
  const searchHistoryStore = useSearchHistoryStore()
  const settingsStore = useSettingsStore()

  // Getters
  const hasResults = computed(() => searchResults.value.length > 0)
  const currentEngine = computed(() => settingsStore.currentEngine)
  const currentEngineUrl = computed(() => settingsStore.currentEngineUrl)
  const searchEngines = computed(() => settingsStore.searchEngines)

  // Fuzzy search function
  const fuzzyMatch = (query: string, text: string): { score: number; matches: boolean } => {
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      return { score: 100, matches: true }
    }
    
    // Fuzzy matching
    let score = 0
    let queryIndex = 0
    let lastMatchIndex = -1
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        score += 1
        // Bonus for consecutive matches
        if (i === lastMatchIndex + 1) {
          score += 2
        }
        // Bonus for word boundary matches
        if (i === 0 || textLower[i - 1] === ' ' || textLower[i - 1] === '-' || textLower[i - 1] === '_') {
          score += 3
        }
        lastMatchIndex = i
        queryIndex++
      }
    }
    
    const matches = queryIndex === queryLower.length
    if (matches) {
      // Normalize score based on text length
      score = (score / textLower.length) * 100
    }
    
    return { score: matches ? score : 0, matches }
  }

  // Get suggestions from existing tabs
  const getTabSuggestions = async (query: string): Promise<SearchResult[]> => {
    if (!query) return []

    try {
      const tabs = await chrome.tabs.query({})

      const scoredTabs = tabs
        .map(tab => {
          const title = tab.title || 'Untitled Tab'
          const url = tab.url || ''
          
          const titleMatch = fuzzyMatch(query, title)
          const urlMatch = fuzzyMatch(query, url)
          
          const bestScore = Math.max(titleMatch.score, urlMatch.score)
          const matches = titleMatch.matches || urlMatch.matches
          
          return {
            tab,
            score: bestScore,
            matches
          }
        })
        .filter(item => item.matches)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      return scoredTabs.map(item => ({
        title: item.tab.title || 'Untitled Tab',
        url: item.tab.url || '',
        source: 'tab',
        tabId: item.tab.id
      }))
    } catch (error) {
      console.error('Error getting tab suggestions:', error)
      return []
    }
  }

  // Get suggestions from search history
  const getSearchHistorySuggestions = (query: string): SearchResult[] => {
    if (!query || !searchHistoryStore.hasHistory) return []

    const scoredHistory = searchHistoryStore.searchHistory
      .map(historyItem => {
        const match = fuzzyMatch(query, historyItem)
        return {
          item: historyItem,
          score: match.score,
          matches: match.matches
        }
      })
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return scoredHistory.map(item => ({
      title: item.item,
      url: `${currentEngineUrl.value}${encodeURIComponent(item.item)}`,
      source: 'history'
    }))
  }

  // Get suggestions from Google search
  const getGoogleSuggestions = async (query: string): Promise<SearchResult[]> => {
    if (!query) return []

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSearchSuggestions',
        query: query
      })

      if (response && response.suggestions) {
        return response.suggestions.map((suggestion: string) => ({
          title: suggestion,
          url: `${currentEngineUrl.value}${encodeURIComponent(suggestion)}`,
          source: 'search'
        }))
      }
    } catch (error) {
      console.error('Error getting Google suggestions:', error)
    }

    return []
  }

  // Debounce function
  let debounceTimeout: ReturnType<typeof setTimeout>
  const debounce = (func: Function, delay: number) => {
    return (...args: any[]) => {
      isTyping.value = true
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        isTyping.value = false
        func(...args)
      }, delay)
    }
  }

  // Get all suggestions
  const getSuggestions = debounce(async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      showSuggestions.value = false
      isLoading.value = false
      return
    }

    isLoading.value = true
    showSuggestions.value = true

    try {
      const [tabSuggestions, historySuggestions, searchSuggestions] = await Promise.all([
        getTabSuggestions(query),
        Promise.resolve(getSearchHistorySuggestions(query)),
        getGoogleSuggestions(query)
      ])

      searchResults.value = [...tabSuggestions, ...historySuggestions, ...searchSuggestions]

      if (searchResults.value.length > 0) {
        selectedResult.value = 0
        nextTick(() => {
          const container = document.querySelector('.results-container')
          if (container) {
            container.scrollTop = 0
          }
        })
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
      searchResults.value = []
    } finally {
      isLoading.value = false
    }
  }, 500)

  // Navigation
  const moveSelection = (direction: number) => {
    if (searchResults.value.length === 0) return

    selectedResult.value = (selectedResult.value + direction + searchResults.value.length) % searchResults.value.length
    
    // Auto-scroll to keep selected item in view
    nextTick(() => {
      const selectedElement = document.querySelector('.result-item.selected')
      const container = document.querySelector('.results-container')
      
      if (selectedElement && container) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          })
        }
      }
    })
  }

  // Open result
  const openResult = (result: SearchResult) => {
    if (result.source === 'tab' && result.tabId) {
      // Navigate to existing tab
      chrome.tabs.update(result.tabId, { active: true })
      chrome.tabs.get(result.tabId).then(tab => {
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true })
        }
      }).catch(error => {
        console.error('Error focusing tab window:', error)
        chrome.tabs.create({ url: result.url })
      })
    } else {
      // Open new tab
      chrome.tabs.create({ url: result.url })
    }
  }

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    hasSearched.value = true
    const query = searchQuery.value.trim()

    try {
      // Add to recent searches and history
      await recentSearchesStore.addRecentSearch(query)
      await searchHistoryStore.addToHistory(query)

      // If suggestions are shown and a suggestion is selected, use its URL
      if (showSuggestions.value && searchResults.value.length > 0 && selectedResult.value >= 0) {
        const selected = searchResults.value[selectedResult.value]
        openResult(selected)
        
        // Add to recent searches with URL info
        if (selected.source === 'search' || selected.source === 'history') {
          await recentSearchesStore.addRecentSearch(selected.title, selected.url)
        }
        
        // Hide suggestions and reset query for tab results
        showSuggestions.value = false
        if (selected.source === 'tab') {
          searchQuery.value = ''
        }
        return
      }

      // Otherwise, perform a regular search
      const encodedQuery = encodeURIComponent(query)
      const searchUrl = `${currentEngineUrl.value}${encodedQuery}`
      
      // Add the search with URL info
      await recentSearchesStore.addRecentSearch(query, searchUrl, `Search: ${query}`)
      
      openResult({
        title: query,
        url: searchUrl,
        source: 'search'
      })

    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    }
  }

  // Engine management
  const showEngineChangeIndicator = () => {
    showEngineIndicator.value = true
    engineChanging.value = true
    
    setTimeout(() => {
      engineChanging.value = false
    }, 300)
    
    setTimeout(() => {
      showEngineIndicator.value = false
    }, 2000)
  }

  const setSearchEngine = async (engineName: string) => {
    await settingsStore.setSearchEngine(engineName)
    showEngineChangeIndicator()
  }

  const cycleSearchEngine = async () => {
    await settingsStore.cycleSearchEngine()
    showEngineChangeIndicator()
  }

  // Keyboard handling
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (showSuggestions.value && searchResults.value.length > 0) {
          moveSelection(1)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (showSuggestions.value && searchResults.value.length > 0) {
          moveSelection(-1)
        }
        break
      case 'Tab':
        event.preventDefault()
        cycleSearchEngine()
        break
      case 'Enter':
        event.preventDefault()
        performSearch()
        break
      case 'Escape':
        event.preventDefault()
        if (showSuggestions.value) {
          showSuggestions.value = false
          selectedResult.value = 0
        } else {
          searchQuery.value = ''
        }
        break
    }
  }

  // Initialize all stores
  const initialize = async () => {
    console.log('Initializing search store...')
    
    await Promise.all([
      recentSearchesStore.initialize(),
      searchHistoryStore.initialize(),
      settingsStore.initialize()
    ])
    
    console.log('Search store initialized')
  }

  return {
    // State
    searchQuery,
    searchResults,
    selectedResult,
    isLoading,
    showSuggestions,
    isTyping,
    hasSearched,
    showEngineIndicator,
    engineChanging,
    
    // Getters
    hasResults,
    currentEngine,
    currentEngineUrl,
    searchEngines,
    
    // Actions
    getSuggestions,
    moveSelection,
    openResult,
    performSearch,
    setSearchEngine,
    cycleSearchEngine,
    handleKeyDown,
    initialize,
    
    // Store references
    recentSearchesStore,
    searchHistoryStore,
    settingsStore
  }
})
