import { nextTick, type Ref } from 'vue'
import type { SearchResult } from './useSearch'

export function useNavigation() {
  // Move selection up or down
  const moveSelection = (direction: number, selectedResult: Ref<number>, searchResults: Ref<SearchResult[]>) => {
    if (searchResults.value.length === 0) return

    selectedResult.value = (selectedResult.value + direction + searchResults.value.length) % searchResults.value.length

    // Auto-scroll to keep selected item in view
    scrollToSelectedItem()
  }

  // Scroll to the selected item to keep it in view
  const scrollToSelectedItem = () => {
    nextTick(() => {
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

  // Open result (tab navigation or new tab)
  const openResult = (result: SearchResult) => {
    if (result.source === 'tab' && result.tabId) {
      // Navigate to existing tab instead of opening new one
      chrome.tabs.update(result.tabId, { active: true })
      chrome.tabs.get(result.tabId).then(tab => {
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true })
        }
      }).catch(error => {
        console.error('Error focusing tab window:', error)
        // Fallback: open URL in new tab if tab no longer exists
        chrome.tabs.create({ url: result.url })
      })
    } else {
      // Open the URL in a new tab for search results and history
      chrome.tabs.create({ url: result.url })
    }
  }

  return {
    moveSelection,
    scrollToSelectedItem,
    openResult
  }
}
