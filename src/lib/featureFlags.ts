/**
 * Feature Flags Configuration
 * Toggle features on/off easily by changing these values
 * 
 * HOW TO ENABLE PRIVATE TOURS:
 * 1. Open this file: /lib/featureFlags.ts
 * 2. Change privateToursEnabled from false to true
 * 3. Save the file - the page will automatically update
 */

export const featureFlags = {
  // Set to true to enable the full Private Tours page
  // Set to false to show "Coming Soon" message
  privateToursEnabled: false,
  
  // Add more feature flags here as needed
  // example: newFeatureEnabled: false,
};
