<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

interface Props {
  modelValue: string
  currentEngine: string
  showEngineIndicator: boolean
  engineChanging: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
  (e: 'keydown', event: KeyboardEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchInput = ref<HTMLInputElement | null>(null)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleKeyDown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleSearch = () => {
  emit('search')
}

const focusInput = () => {
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
}

// Expose focus method
defineExpose({
  focusInput
})

onMounted(() => {
  focusInput()
})
</script>

<template>
  <div class="search-container">
    <input
      ref="searchInput"
      type="text"
      :value="modelValue"
      placeholder="Search..."
      class="search-input"
      @input="handleInput"
      @keydown="handleKeyDown"
    />
    <button @click="handleSearch" class="search-button">
      <span class="search-icon">🔍</span>
    </button>

    <!-- Engine Indicator -->
    <div
      class="engine-indicator"
      :class="{ show: showEngineIndicator, changing: engineChanging }"
    >
      {{ currentEngine }}
    </div>

    <!-- Keyboard Hint -->
    <div class="keyboard-hint">
      <small>Press Tab to change search engine</small>
    </div>
  </div>
</template>
