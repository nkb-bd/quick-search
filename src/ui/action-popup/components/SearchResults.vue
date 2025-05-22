<script setup lang="ts">
interface SearchResult {
  title: string
  url: string
  source: string
  tabId?: number
}

interface Props {
  results: SearchResult[]
  selectedIndex: number
  showSuggestions: boolean
}

interface Emits {
  (e: 'select-result', result: SearchResult): void
  (e: 'hover-result', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Get favicon URL for a given URL
const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
  } catch {
    return ''
  }
}

// Get appropriate icon for result type
const getResultIcon = (result: SearchResult) => {
  if (result.source === 'tab' && result.url) {
    const faviconUrl = getFaviconUrl(result.url)
    if (faviconUrl) {
      return { type: 'favicon', url: faviconUrl }
    }
  }
  
  // Fallback icons
  const iconMap = {
    'tab': { type: 'emoji', icon: '🌐' },
    'history': { type: 'emoji', icon: '⏱️' },
    'search': { type: 'emoji', icon: '🔍' }
  }
  
  return iconMap[result.source] || iconMap['search']
}

// Handle favicon load error
const handleFaviconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const parent = img.parentElement
  if (parent) {
    const source = parent.getAttribute('data-source')
    const fallbackMap = {
      'tab': '🌐',
      'history': '⏱️',
      'search': '🔍'
    }
    parent.innerHTML = `<span class="fallback-icon">${fallbackMap[source] || '🔍'}</span>`
  }
}

const handleResultClick = (result: SearchResult) => {
  emit('select-result', result)
}

const handleResultHover = (index: number) => {
  emit('hover-result', index)
}
</script>

<template>
  <div v-if="showSuggestions && results.length > 0" class="results-container">
    <div
      v-for="(result, index) in results"
      :key="index"
      class="result-item"
      :class="{
        'selected': index === selectedIndex,
        'tab-suggestion': result.source === 'tab',
        'search-suggestion': result.source === 'search',
        'history-suggestion': result.source === 'history'
      }"
      @click="handleResultClick(result)"
      @mouseenter="handleResultHover(index)"
    >
      <div class="result-icon" :data-source="result.source">
        <img 
          v-if="getResultIcon(result).type === 'favicon'"
          :src="getResultIcon(result).url"
          :alt="result.title"
          class="favicon-icon"
          @error="handleFaviconError"
        />
        <span 
          v-else
          class="emoji-icon"
        >
          {{ getResultIcon(result).icon }}
        </span>
      </div>
      <div class="result-content">
        <div class="result-title">{{ result.title }}</div>
        <div v-if="result.source === 'tab'" class="result-url">{{ result.url }}</div>
      </div>
    </div>
  </div>
</template>
