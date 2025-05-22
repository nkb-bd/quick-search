<script setup lang="ts">
interface Props {
  isTyping: boolean
  isLoading: boolean
}

defineProps<Props>()
</script>

<template>
  <!-- Typing Indicator -->
  <div v-if="isTyping" class="typing-indicator">
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span class="typing-text">Typing...</span>
  </div>
  
  <!-- Loading Indicator -->
  <div v-else-if="isLoading" class="loading-indicator">
    Searching...
  </div>
</template>
