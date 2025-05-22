# Chrome Extension Keyboard Shortcut Strategy

## How Pre-configured Shortcuts Work in Chrome Extensions

### 1. **Suggested vs. Forced Shortcuts**
Chrome extensions can only **suggest** keyboard shortcuts, never force them. Here's how it works:

- **Installation**: When a user installs the extension, Chrome attempts to assign the suggested shortcuts
- **Conflicts**: If a suggested shortcut conflicts with existing shortcuts, Chrome may:
  - Skip assigning that shortcut
  - Assign it anyway (overriding the conflicting one)
  - Leave it unassigned for manual configuration
- **User Control**: Users always have final control and can change any shortcut

### 2. **Our Shortcut Strategy**

We chose shortcuts that:
- **Follow common patterns** used by popular applications
- **Avoid browser conflicts** with built-in Chrome shortcuts
- **Are intuitive** and easy to remember
- **Work across platforms** (Windows, Mac, Linux)

#### **Our Chosen Shortcut:**

| Shortcut | Windows/Linux | macOS | Purpose | Pattern |
|----------|---------------|-------|---------|---------|
| **Primary** | `Ctrl+Shift+Space` | `Cmd+Shift+Space` | Open popup | Universal launcher (Spotlight, Alfred) |

### 3. **Why This Specific Shortcut?**

#### **Ctrl+Shift+Space / Cmd+Shift+Space**
- ✅ **Universal launcher pattern** - Used by Spotlight (macOS), Alfred, many productivity apps
- ✅ **Rarely conflicts** - Most browsers don't use this combination
- ✅ **Easy to remember** - Space = "open/launch"
- ✅ **Muscle memory** - Users familiar with other launcher apps
- ✅ **Single, focused action** - One shortcut for one clear purpose

### 4. **Shortcuts We Avoided and Why**

| Shortcut | Why Avoided | Used By |
|----------|-------------|---------|
| `Ctrl+K` | Browser address bar focus | Chrome, Firefox, Edge |
| `Ctrl+T` | New tab | All browsers |
| `Ctrl+Shift+T` | Reopen closed tab | All browsers |
| `Ctrl+L` | Address bar focus | All browsers |
| `Ctrl+F` | Find in page | All browsers |
| `Ctrl+Shift+N` | New incognito window | Chrome |
| `Ctrl+Shift+Delete` | Clear browsing data | Chrome |
| `F3` | Find next | Browsers |

### 5. **Popular Extension Examples**

#### **Successful Patterns:**
- **Vimium**: Uses single letters (`f`, `/`, etc.) - works because it's modal
- **LastPass**: `Ctrl+Shift+L` - "L" for LastPass, rarely conflicts
- **Grammarly**: `Ctrl+Shift+G` - "G" for Grammarly
- **uBlock Origin**: No default shortcuts - lets users configure

#### **Common Strategies:**
1. **Brand initial + modifiers**: `Ctrl+Shift+[FirstLetter]`
2. **Function-based**: `Ctrl+Shift+[FunctionKey]` (Space, K, etc.)
3. **No defaults**: Let users configure everything
4. **Alt combinations**: Less likely to conflict

### 6. **Best Practices for Extension Shortcuts**

#### **DO:**
- ✅ Use `Ctrl+Shift+` or `Cmd+Shift+` combinations
- ✅ Include Alt as an alternative modifier
- ✅ Choose mnemonics that make sense (`K` for search, `T` for tabs)
- ✅ Test on multiple platforms
- ✅ Provide clear descriptions
- ✅ Document shortcuts prominently

#### **DON'T:**
- ❌ Use single modifier keys (`Ctrl+K` alone)
- ❌ Conflict with common browser shortcuts
- ❌ Use function keys (F1-F12) as primary shortcuts
- ❌ Assume shortcuts will always be assigned
- ❌ Make functionality dependent on shortcuts

### 7. **Implementation Details**

#### **Manifest V3 Commands:**
```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Space",
        "mac": "Command+Shift+Space"
      },
      "description": "Open Quick Search popup"
    }
  }
}
```

#### **Background Script Handling:**
```javascript
// The _execute_action command is handled automatically by Chrome
// No additional handling needed for the main shortcut
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
});
```

### 8. **User Experience Considerations**

#### **Discoverability:**
- Show shortcuts in the UI (tooltips, settings page)
- Mention shortcuts in onboarding
- Provide easy access to Chrome's shortcut settings

#### **Fallbacks:**
- Always provide mouse/click alternatives
- Don't make shortcuts the only way to access features
- Handle cases where shortcuts aren't assigned

#### **Customization:**
- Link to `chrome://extensions/shortcuts`
- Explain how to change shortcuts
- Show current shortcuts in settings

### 9. **Testing Strategy**

1. **Fresh install testing**: Install on clean Chrome profile
2. **Conflict testing**: Install with other popular extensions
3. **Platform testing**: Test on Windows, Mac, Linux
4. **User testing**: Get feedback on intuitiveness
5. **Documentation**: Clear instructions for customization

This strategy ensures our shortcuts are likely to be assigned on installation while remaining user-friendly and avoiding conflicts.
