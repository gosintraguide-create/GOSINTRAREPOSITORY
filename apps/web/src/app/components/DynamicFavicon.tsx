import { useEffect } from 'react';
import iconImage from 'figma:asset/e199cf49993f01cc569ec13ba6e57ba6c35fc3e2.png';

export function DynamicFavicon() {
  useEffect(() => {
    // Update favicon dynamically
    const updateFavicon = () => {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(favicon => {
        if (favicon.getAttribute('href') !== iconImage) {
          favicon.remove();
        }
      });

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = iconImage;
      document.head.appendChild(link);

      // Add apple touch icon
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = iconImage;
      document.head.appendChild(appleLink);

      console.log('✅ Favicon updated with custom HOP ON icon');
    };

    updateFavicon();
  }, []);

  return null; // This component doesn't render anything
}
