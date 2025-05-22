<script setup lang="ts">
import { useSearchEngine } from '../../../composables/useSearchEngine'

const { searchEngines } = useSearchEngine()

const props = defineProps<{
  currentEngine: string
  onEngineChange: (engineName: string) => void
}>()

const handleEngineSelect = (engineName: string) => {
  props.onEngineChange(engineName)
}
</script>

<template>
  <div class="search-options">
    <div class="search-engines">
      <button
        v-for="engine in searchEngines"
        :key="engine.name"
        class="engine-button"
        :class="{ active: props.currentEngine === engine.name }"
        @click="handleEngineSelect(engine.name)"
      >
        {{ engine.name }}
      </button>
    </div>
  </div>
</template>
