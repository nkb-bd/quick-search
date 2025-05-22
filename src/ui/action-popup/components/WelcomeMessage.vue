<script setup lang="ts">
import RecentSearches from './RecentSearches.vue'

interface Props {
  recentSearches: string[]
}

interface Emits {
  (e: 'select-search', search: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSearchSelect = (search: string) => {
  emit('select-search', search)
}
</script>

<template>
  <div class="welcome-message">
    <div class="welcome-icon">🔍</div>
    <div class="welcome-text">Quick Search</div>
    <div class="welcome-subtitle">Press Ctrl+Shift+Space to open this popup</div>

    <!-- Recent Search Tags Cloud -->
    <RecentSearches
      :recent-searches="recentSearches"
      :show-as-cloud="true"
      @select-search="handleSearchSelect"
    />
  </div>
</template>
