export const useOptionsStore = defineStore("options", () => {
  const { isDark, toggleDark } = useTheme()

  const { data: profile, promise: profilePromise } = useBrowserSyncStorage<{
    name: string
    age: number
  }>("profile", {
    name: "Mario",
    age: 24,
  })

  const { data: others, promise: othersPromise } = useBrowserLocalStorage<{
    awesome: boolean
    counter: number
    searchEngine: string
  }>("options", {
    awesome: true,
    counter: 0,
    searchEngine: 'Google'
  })

  // Initialize stores
  onMounted(async () => {
    try {
      await Promise.all([profilePromise, othersPromise])
      console.log('Options store initialized successfully')
    } catch (error) {
      console.error('Error initializing options store:', error)
    }
  })

  // Actions
  const actions = {
    updateSearchEngine(engine: string) {
      if (others.value) {
        others.value.searchEngine = engine
      }
    }
  }

  return {
    isDark,
    toggleDark,
    profile,
    others,
    ...actions
  }
})
