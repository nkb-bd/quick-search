export function useStorage() {
  // Load recent searches from background script
  const loadRecentSearches = async (): Promise<string[]> => {
    try {
      console.log('Loading recent searches...');

      // Get recent searches from background script
      const response = await chrome.runtime.sendMessage({
        action: 'getRecentSearches'
      })

      console.log('Background response:', response);

      if (response && response.searches && Array.isArray(response.searches)) {
        console.log('Got searches from background:', response.searches);
        return response.searches
      }

      // Fallback to storage if background script doesn't respond
      console.log('Falling back to storage...');
      const result = await chrome.storage.local.get('quick-search-recent-searches')
      if (result['quick-search-recent-searches'] && Array.isArray(result['quick-search-recent-searches'])) {
        console.log('Got searches from storage:', result['quick-search-recent-searches']);
        return result['quick-search-recent-searches']
      }

      console.log('No recent searches found, returning empty array');
      return []
    } catch (error) {
      console.error('Error loading recent searches:', error)
      return []
    }
  }

  // Add recent search via background script
  const addRecentSearch = async (query: string, url?: string, title?: string): Promise<void> => {
    try {
      console.log('Adding recent search:', { query, url, title });

      const response = await chrome.runtime.sendMessage({
        action: 'addRecentSearch',
        query,
        url,
        title
      })

      console.log('Add recent search response:', response);
    } catch (error) {
      console.error('Error adding recent search:', error)
    }
  }

  // Save recent searches to storage (legacy support)
  const saveRecentSearches = async (searches: string[]): Promise<void> => {
    try {
      await chrome.storage.local.set({
        'quick-search-recent-searches': searches
      })
    } catch (error) {
      console.error('Error saving recent searches:', error)
    }
  }

  // Load search history from storage
  const loadSearchHistory = async (): Promise<string[]> => {
    try {
      const result = await chrome.storage.local.get('quick-search-history')
      if (result['quick-search-history'] && Array.isArray(result['quick-search-history'])) {
        return result['quick-search-history']
      }
      return []
    } catch (error) {
      console.error('Error loading search history:', error)
      return []
    }
  }

  // Save search history to storage
  const saveSearchHistory = async (history: string[]): Promise<void> => {
    try {
      await chrome.storage.local.set({
        'quick-search-history': history
      })
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  // Load settings from storage
  const loadSettings = async (): Promise<{ engine?: string }> => {
    try {
      const result = await chrome.storage.local.get('quick-search-engine')
      return {
        engine: result['quick-search-engine']
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      return {}
    }
  }

  // Save settings to storage
  const saveSettings = async (engine: string): Promise<void> => {
    try {
      await chrome.storage.local.set({
        'quick-search-engine': engine
      })
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Add sample recent searches for testing
  const addSampleRecentSearches = async (): Promise<string[]> => {
    const sampleSearches = [
      'Vue.js tutorial',
      'JavaScript async await',
      'Chrome extension development',
      'CSS grid layout',
      'TypeScript interfaces'
    ]
    await saveRecentSearches(sampleSearches)
    return sampleSearches
  }

  return {
    loadRecentSearches,
    addRecentSearch,
    saveRecentSearches,
    loadSearchHistory,
    saveSearchHistory,
    loadSettings,
    saveSettings,
    addSampleRecentSearches
  }
}
