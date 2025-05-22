// Quick Search Extension Background Script
import "./recentSearchTracker"

chrome.runtime.onInstalled.addListener(async (opt) => {
  console.info('Quick Search extension installed/updated');
})

// Add error handler through addEventListener instead of using inline assignment
self.addEventListener('error', function(event) {
  console.info("Error: " + event.message)
  console.info("Source: " + event.filename)
  console.info("Line: " + event.lineno)
  console.info("Column: " + event.colno)
  console.info("Error object: " + event.error)
})

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  // The _execute_action command is handled automatically by Chrome
  // No additional handling needed for the main shortcut
  console.log('Command received:', command);
});

// Handle message from popup to get search suggestions
// Handle search engine configuration
chrome.storage.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
  if (areaName === 'local' && changes.searchEngine) {
    console.log('Search engine changed:', changes.searchEngine.newValue)
    // You can broadcast this change to other extension pages if needed
  }
})

// Handle message from popup to get search suggestions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.action);

  if (message.action === 'getSearchSuggestions') {
    const query = message.query;

    // Fetch suggestions from Google
    fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        // Google's response format is an array where the second item contains the suggestions
        const suggestions = data[1] || [];
        sendResponse({ success: true, suggestions });
      })
      .catch(error => {
        console.error('Error fetching search suggestions:', error);
        // Fallback to mock suggestions if the API fails
        const fallbackSuggestions = [
          `${query} search`,
          `${query} online`,
          `${query} tutorial`,
          `${query} examples`,
          `${query} documentation`
        ];
        sendResponse({ success: false, suggestions: fallbackSuggestions, error: error.message });
      });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

console.info("hello world from background")

export {}
