<script setup lang="ts">
interface Props {
  recentSearches: string[]
  showAsCloud?: boolean
}

interface Emits {
  (e: 'select-search', search: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showAsCloud: false
})

const emit = defineEmits<Emits>()

// Get tag size based on position (more recent = larger)
const getTagSize = (index: number): string => {
  if (index === 0) return 'large'      // Most recent
  if (index <= 2) return 'medium'      // 2nd and 3rd most recent
  if (index <= 4) return 'normal'      // 4th and 5th
  return 'small'                       // Older searches
}

const handleSearchClick = (search: string) => {
  emit('select-search', search)
}
</script>

<template>
  <!-- Recent Search Tags Cloud -->
  <div v-if="showAsCloud && Array.isArray(recentSearches) && recentSearches.length > 0" class="search-tags-cloud">
    <div class="tags-title">Recent Searches</div>
    <div class="tags-container">
      <button
        v-for="(search, index) in recentSearches.slice(0, 8)"
        :key="index"
        class="search-tag"
        :class="`tag-size-${getTagSize(index)}`"
        @click="handleSearchClick(search)"
        :title="`Search for: ${search}`"
      >
        {{ search }}
      </button>
    </div>
  </div>
  
  <!-- Traditional Recent Searches List -->
  <div v-else-if="!showAsCloud && Array.isArray(recentSearches) && recentSearches.length > 0" class="recent-searches">
    <div class="section-title">Recent Searches</div>
    <div
      v-for="(search, index) in recentSearches"
      :key="index"
      class="recent-item"
      @click="handleSearchClick(search)"
    >
      <span class="recent-icon">🕒</span>
      <span class="recent-text">{{ search }}</span>
    </div>
  </div>
  
  <!-- Debug info (remove in production) -->
  <!-- <div v-else-if="recentSearches.length === 0" class="debug-info">
    <p style="font-size: 10px; color: #666; margin-top: 10px;">
      No recent searches yet. Try searching for something first!
    </p>
    <p style="font-size: 10px; color: #666;">
      Recent searches: {{ recentSearches.length }}
    </p>
  </div> -->
</template>
