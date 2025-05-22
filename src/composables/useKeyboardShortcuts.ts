import { ref, onMounted } from 'vue'

export interface KeyboardShortcut {
  name: string
  description: string
  shortcut: string
}

export function useKeyboardShortcuts() {
  const shortcuts = ref<KeyboardShortcut[]>([])
  const isLoading = ref(false)

  // Get all keyboard shortcuts from Chrome
  const getShortcuts = async () => {
    try {
      isLoading.value = true
      const commands = await chrome.commands.getAll()
      
      shortcuts.value = commands.map(command => ({
        name: command.name || '',
        description: command.description || '',
        shortcut: command.shortcut || 'Not set'
      }))
    } catch (error) {
      console.error('Error getting keyboard shortcuts:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Open Chrome's keyboard shortcuts settings
  const openShortcutSettings = () => {
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    })
  }

  // Check if shortcuts are supported
  const isSupported = () => {
    return typeof chrome !== 'undefined' && chrome.commands
  }

  onMounted(() => {
    if (isSupported()) {
      getShortcuts()
    }
  })

  return {
    shortcuts,
    isLoading,
    getShortcuts,
    openShortcutSettings,
    isSupported
  }
}
