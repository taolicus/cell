// Player identification utility
// This creates a unique identifier for the browser that persists across refreshes

function generatePlayerId() {
  // Try to get existing player ID from localStorage
  let playerId = localStorage.getItem('playerId');

  if (!playerId) {
    console.log('No existing player ID found, generating new one...');
    // Generate a new player ID based on browser characteristics
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
      navigator.platform
    ];

    // Create a simple hash of the components
    const combined = components.join('|');
    playerId = btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);

    // Store it in localStorage for persistence
    localStorage.setItem('playerId', playerId);
    console.log('Generated new player ID:', playerId);
  } else {
    console.log('Using existing player ID:', playerId);
  }

  return playerId;
}

export { generatePlayerId };