<script setup lang="ts">
import { computed } from 'vue'
import { faviconUrl } from '../../../lib/favicon'
import type { Result } from '../../../lib/types'

const props = defineProps<{ result: Result; selected: boolean }>()

const BADGES: Record<string, string> = {
  tab: 'Tab',
  bookmark: 'Saved',
  history: 'Visited',
  command: 'Action',
}

const ICONS: Record<string, string> = {
  action: '\u{1F50D}',
  tab: '\u{1F310}',
  bookmark: '\u{2605}',
  history: '\u{1F553}',
  suggest: '\u{1F50D}',
  command: '\u{2318}',
}

const icon = computed(() =>
  props.result.kind === 'tab' || props.result.kind === 'bookmark'
    ? faviconUrl(props.result.url)
    : null,
)

const badge = computed(() => BADGES[props.result.kind])

const segments = computed(() => {
  const indices = props.result.titleMatch
  const title = props.result.title
  if (!indices?.length) return [{ text: title, hit: false }]

  const hits = new Set(indices)
  const parts: { text: string; hit: boolean }[] = []

  for (let i = 0; i < title.length; i++) {
    const hit = hits.has(i)
    const last = parts[parts.length - 1]
    if (last && last.hit === hit) last.text += title[i]
    else parts.push({ text: title[i], hit })
  }

  return parts
})

function onIconError(event: Event) {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div
    class="row"
    :class="{ 'row--selected': selected }"
    role="option"
    :aria-selected="selected"
  >
    <span class="row__icon">
      <img
        v-if="icon"
        :src="icon"
        alt=""
        @error="onIconError"
      />
      <template v-else>{{ ICONS[result.kind] }}</template>
    </span>

    <span class="row__body">
      <span class="row__title">
        <template
          v-for="(segment, index) in segments"
          :key="index"
        >
          <mark v-if="segment.hit">{{ segment.text }}</mark>
          <template v-else>{{ segment.text }}</template>
        </template>
      </span>
      <span
        v-if="result.subtitle"
        class="row__subtitle"
      >{{ result.subtitle }}</span>
    </span>

    <span
      v-if="badge"
      class="row__badge"
    >{{ badge }}</span>
  </div>
</template>
