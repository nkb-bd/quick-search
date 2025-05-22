<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useTheme } from "../../../composables/useTheme"
import { useRecentSearchesStore } from "../../../stores/recentSearches"
import { useSearchHistoryStore } from "../../../stores/searchHistory"
import { useSettingsStore } from "../../../stores/settings"
import SearchInput from "../components/SearchInput.vue"
import LoadingStates from "../components/LoadingStates.vue"
import SearchResults from "../components/SearchResults.vue"
import RecentSearches from "../components/RecentSearches.vue"
import WelcomeMessage from "../components/WelcomeMessage.vue"
import SearchEngineOptions from "../components/SearchEngineOptions.vue"

// Theme
const { isDark, mode } = useTheme()

// Pinia Stores
const recentSearchesStore = useRecentSearchesStore()
const searchHistoryStore = useSearchHistoryStore()
const settingsStore = useSettingsStore()

// Search Engine State
const { currentEngine, searchEngines } = useSearchEngine()

// Local state for search functionality
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedResult = ref(0)
const isLoading = ref(false)
const showSuggestions = ref(false)
const isTyping = ref(false)
const hasSearched = ref(false)
const userHasNavigatedSuggestions = ref(false)

// Debounce timeout
let debounceTimeout: ReturnType<typeof setTimeout>

// UI state
const showEngineIndicator = ref(false)
const engineChanging = ref(false)
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

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

const setSearchEngine = (engineName: string) => {
  currentEngine.value = engineName
  showEngineChangeIndicator()
}

const cycleSearchEngine = () => {
  // Find current index
  const currentIndex = searchEngines.value.findIndex(engine => engine.name === currentEngine.value)
  const nextIndex = (currentIndex + 1) % searchEngines.value.length
  currentEngine.value = searchEngines.value[nextIndex].name
  showEngineChangeIndicator()
}

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
const getTabSuggestions = async (query: string): Promise<any[]> => {
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
const getSearchHistorySuggestions = (query: string): any[] => {
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
    url: `${settingsStore.currentEngineUrl}${encodeURIComponent(item.item)}`,
    source: 'history'
  }))
}

// Get suggestions from Google search
const getGoogleSuggestions = async (query: string): Promise<any[]> => {
  if (!query) return []

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSearchSuggestions',
      query: query
    })

    if (response && response.suggestions) {
      return response.suggestions.map((suggestion: string) => ({
        title: suggestion,
        url: `${settingsStore.currentEngineUrl}${encodeURIComponent(suggestion)}`,
        source: 'search'
      }))
    }
  } catch (error) {
    console.error('Error getting Google suggestions:', error)
  }

  return []
}

// Get all suggestions with debouncing
const getSuggestions = async (query: string) => {
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

    // Don't auto-select first suggestion - let user choose
    selectedResult.value = -1

    if (searchResults.value.length > 0) {
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
}

// Search functionality
const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  hasSearched.value = true
  const query = searchQuery.value.trim()

  try {
    // Add to recent searches and history using Pinia stores
    await recentSearchesStore.addRecentSearch(query)
    await searchHistoryStore.addToHistory(query)

    // Check if user has explicitly selected a suggestion
    // Only use suggestion if:
    // 1. Suggestions are shown
    // 2. There are results
    // 3. A specific result is selected (selectedResult >= 0)
    // 4. User pressed Enter while navigating suggestions (not just typing)
    if (showSuggestions.value &&
        searchResults.value.length > 0 &&
        selectedResult.value >= 0 &&
        userHasNavigatedSuggestions.value) {
      handleResultSelect(searchResults.value[selectedResult.value])
      return
    }

    // Otherwise, perform a regular search with the typed text
    const encodedQuery = encodeURIComponent(query)
    
    // Get the selected engine's URL from the composable
    const selectedEngine = searchEngines.value.find(engine => engine.name === currentEngine.value)
    const searchUrl = selectedEngine ? `${selectedEngine.url}${encodedQuery}` : `${searchEngines.value[0].url}${encodedQuery}`

    // Add the search with URL info
    await recentSearchesStore.addRecentSearch(query, searchUrl, `Search: ${query}`)

    handleResultSelect({
      title: query,
      url: searchUrl,
      source: 'search'
    })

  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  }
}

// Event handlers
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

const moveSelection = (direction: number) => {
  if (searchResults.value.length === 0) return

  // Mark that user has navigated suggestions
  userHasNavigatedSuggestions.value = true

  // Handle selection with -1 as "no selection"
  if (direction === 1) {
    // Moving down
    if (selectedResult.value === -1) {
      selectedResult.value = 0 // First item
    } else {
      selectedResult.value = (selectedResult.value + 1) % searchResults.value.length
    }
  } else {
    // Moving up
    if (selectedResult.value === -1) {
      selectedResult.value = searchResults.value.length - 1 // Last item
    } else if (selectedResult.value === 0) {
      selectedResult.value = -1 // Back to no selection
    } else {
      selectedResult.value = selectedResult.value - 1
    }
  }

  console.log('User navigated to suggestion:', selectedResult.value, searchResults.value[selectedResult.value]?.title)

  // Auto-scroll to keep selected item in view
  scrollToSelectedItem()
}

// Scroll to the selected item to keep it in view
const scrollToSelectedItem = () => {
  nextTick(() => {
    if (selectedResult.value === -1) return // No selection to scroll to

    const selectedElement = document.querySelector('.result-item.selected')
    const container = document.querySelector('.results-container')

    if (selectedElement && container) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = selectedElement.getBoundingClientRect()

      // Check if element is above or below visible area
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

const handleResultSelect = (result: any) => {
  // Open result logic here
  if (result.source === 'tab' && result.tabId) {
    chrome.tabs.update(result.tabId, { active: true })
  } else {
    chrome.tabs.create({ url: result.url })
  }

  // Add to recent searches if it's a search result
  if (result.source === 'search' || result.source === 'history') {
    recentSearchesStore.addRecentSearch(result.title, result.url)
  }

  showSuggestions.value = false
  if (result.source === 'tab') {
    searchQuery.value = ''
  }
}

const handleResultHover = (index: number) => {
  selectedResult.value = index
  // Mark that user has navigated suggestions (via mouse)
  userHasNavigatedSuggestions.value = true
}

const handleSearchSelect = (search: string) => {
  searchQuery.value = search
  performSearch()
}

// Initialize all stores
onMounted(async () => {
  // Initialize all stores
  await Promise.all([
    recentSearchesStore.initialize(),
    searchHistoryStore.initialize(),
    settingsStore.initialize()
  ])

  // Focus search input
  setTimeout(() => {
    searchInputRef.value?.focusInput()
  }, 100)

  // Add click outside listener
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.search-container') && !target.closest('.results-container')) {
      showSuggestions.value = false
    }
  })
})

// Watch for search query changes
watch(searchQuery, (newQuery, oldQuery) => {
  if (!newQuery.trim()) {
    isTyping.value = false
    isLoading.value = false
    searchResults.value = []
    showSuggestions.value = false
    hasSearched.value = false
    userHasNavigatedSuggestions.value = false
    selectedResult.value = -1
    return
  }

  if (newQuery.trim() !== oldQuery?.trim()) {
    // Reset navigation state when user types new content
    userHasNavigatedSuggestions.value = false
    selectedResult.value = -1 // No selection by default

    // Set typing indicator and debounce the search
    isTyping.value = true
    clearTimeout(debounceTimeout)

    debounceTimeout = setTimeout(() => {
      isTyping.value = false
      getSuggestions(newQuery)
    }, 500)
  }
})
</script>

<template>
  <div class="search-popup" :class="{ 'dark-theme': isDark }" :data-theme="mode">
    <!-- Search Input -->
    <SearchInput
      ref="searchInputRef"
      v-model="searchQuery"
      :current-engine="currentEngine"
      :show-engine-indicator="showEngineIndicator"
      :engine-changing="engineChanging"
      @search="performSearch"
      @keydown="handleKeyDown"
    />

    <!-- Loading States -->
    <LoadingStates
      :is-typing="isTyping"
      :is-loading="isLoading"
    />

    <!-- Search Results (in normal document flow) -->
    <SearchResults
      :results="searchResults"
      :selected-index="selectedResult"
      :show-suggestions="showSuggestions"
      @select-result="handleResultSelect"
      @hover-result="handleResultHover"
    />

    <!-- Recent Searches (Traditional List) -->
    <RecentSearches
      v-if="!showSuggestions && !isLoading && !isTyping && recentSearchesStore.hasRecentSearches && !searchQuery"
      :recent-searches="recentSearchesStore.recentSearchQueries"
      :show-as-cloud="false"
      @select-search="handleSearchSelect"
    />

    <!-- Search Engine Options -->
    <SearchEngineOptions
      v-if="!showSuggestions && !isLoading && !isTyping"
      :current-engine="currentEngine"
      :on-engine-change="setSearchEngine"
    />

    <!-- Welcome Message with Tags Cloud -->
    <WelcomeMessage
      v-else-if="!showSuggestions && !isLoading && !isTyping && !searchQuery"
      :recent-searches="recentSearchesStore.recentSearchQueries"
      @select-search="handleSearchSelect"
    />

   

    <!-- Debug Info -->
    <div v-if="recentSearchesStore.recentSearches.length > 0" class="debug-info" style="margin-top: 10px; font-size: 10px; color: #666;">
      <p>📊 Recent Searches: {{ recentSearchesStore.recentSearches.length }}</p>
      <p>🕒 Last Updated: {{ new Date(recentSearchesStore.lastUpdated).toLocaleTimeString() }}</p>
      <p>🔄 Cross-tab sync: {{ recentSearchesStore.lastUpdated > 0 ? 'Active' : 'Inactive' }}</p>
    </div>
  </div>
</template>

<style>
@import './index.css';

.debug-info {
  padding: 8px;
  background-color: var(--bg-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
</style>
