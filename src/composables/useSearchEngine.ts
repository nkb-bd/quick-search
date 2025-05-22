import { computed } from 'vue'
import { useOptionsStore } from '../stores/options.store'

export interface SearchEngine {
  name: string
  url: string
}

export const useSearchEngine = () => {
  const optionsStore = useOptionsStore()
  const storeLoading = ref(true)

  // Initialize store
  onMounted(async () => {
    try {
      await Promise.all([optionsStore.profile, optionsStore.others])
      storeLoading.value = false
    } catch (error) {
      storeLoading.value = false
    }
  })

  const searchEngines = computed(() => [
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { name: 'Brave', url: 'https://search.brave.com/search?q=' },
    { name: 'You.com', url: 'https://you.com/search?q=' }
  ])

  const currentEngine = computed({
    get: () => {
      if (storeLoading.value) return 'Google'
      return optionsStore.others?.searchEngine || 'Google'
    },
    set: (value: string) => {
      if (!storeLoading.value) {
        optionsStore.updateSearchEngine(value)
      }
    }
  })

  return {
    searchEngines,
    currentEngine,
    storeLoading,
  }
}
