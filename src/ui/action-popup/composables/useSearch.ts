import { ref, computed, nextTick } from 'vue'

export interface SearchResult {
  title: string
  url: string
  source: string
  tabId?: number
}

export interface SearchEngine {
  name: string
  url: string
}

// Fuzzy search function
function fuzzyMatch(query: string, text: string): { score: number; matches: boolean } {
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

// Enhanced debounce function with typing indicator
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number, setTyping: (value: boolean) => void) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    // Set typing indicator
    setTyping(true)

    if (timeout !== null) {
      clearTimeout(timeout)
    }

    return new Promise(resolve => {
      timeout = setTimeout(() => {
        setTyping(false)
        resolve(func(...args))
      }, waitFor)
    })
  }
}

export function useSearch() {
  const searchQuery = ref("")
  const searchResults = ref<SearchResult[]>([])
  const recentSearches = ref<string[]>([])
  const searchHistory = ref<string[]>([])
  const selectedResult = ref(0)
  const isLoading = ref(false)
  const showSuggestions = ref(false)
  const isTyping = ref(false)

  // Search engines
  const searchEngines: SearchEngine[] = [
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' }
  ]

  const currentEngine = ref('Google')

  const currentEngineUrl = computed(() => {
    const engine = searchEngines.find(e => e.name === currentEngine.value)
    return engine ? engine.url : searchEngines[0].url
  })

  // Get suggestions from existing tabs with fuzzy search
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

  // Get suggestions from search history with fuzzy search
  const getSearchHistorySuggestions = (query: string): SearchResult[] => {
    if (!query || !Array.isArray(searchHistory.value) || searchHistory.value.length === 0) return []

    const scoredHistory = searchHistory.value
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

  // Get all suggestions with debouncing
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
  }, 500, (value: boolean) => { isTyping.value = value })

  return {
    // State
    searchQuery,
    searchResults,
    recentSearches,
    searchHistory,
    selectedResult,
    isLoading,
    showSuggestions,
    isTyping,
    searchEngines,
    currentEngine,
    currentEngineUrl,

    // Methods
    getSuggestions,
    fuzzyMatch
  }
}
