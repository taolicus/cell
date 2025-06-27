// Player identification utility
// This creates a unique identifier for each browser tab that persists across refreshes

function generatePlayerId() {
  // Generate a browser fingerprint that's consistent across tabs
  const browserComponents = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
    navigator.platform
  ];

  const browserFingerprint = btoa(browserComponents.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);

  // Try to get existing session ID for this tab from sessionStorage
  let sessionId = sessionStorage.getItem('tabSessionId');

  if (!sessionId) {
    console.log('No existing session ID found, generating new one...');
    // Generate a unique session ID for this tab
    sessionId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('tabSessionId', sessionId);
    console.log('Generated new session ID:', sessionId);
  } else {
    console.log('Using existing session ID:', sessionId);
  }

  // Combine browser fingerprint with session ID to create unique player ID per tab
  const playerId = browserFingerprint + '_' + sessionId;
  console.log('Generated player ID for this tab:', playerId);

  return playerId;
}

export { generatePlayerId };