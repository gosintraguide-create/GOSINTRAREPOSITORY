import { useEffect } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

/**
 * DynamicManifest Component
 * 
 * This component cleans up invalid icon links on page load.
 * Backend PWA icon loading is disabled to prevent 404 errors.
 */
export function DynamicManifest() {
  useEffect(() => {
    // IMMEDIATE CLEANUP: Run this synchronously before anything else
    const emergencyCleanup = () => {
      console.log('🚨 EMERGENCY CLEANUP: Scanning for invalid icon links...');
      const allLinks = document.querySelectorAll('link');
      let cleaned = 0;
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        const sizes = link.getAttribute('sizes');
        const rel = link.getAttribute('rel');
        
        // Remove any link with undefined/null in href
        if (href && (href.includes('undefined') || href.includes('null'))) {
          console.error(`🚨 REMOVING: ${rel} with href="${href}"`);
          link.remove();
          cleaned++;
        }
        // Remove icon/apple-touch-icon with invalid sizes
        else if ((rel === 'icon' || rel === 'apple-touch-icon') && 
                 sizes && (sizes === 'undefined' || sizes === 'null' || sizes === '')) {
          console.error(`🚨 REMOVING: ${rel} with invalid sizes="${sizes}"`);
          link.remove();
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        console.log(`🚨 EMERGENCY CLEANUP: Removed ${cleaned} invalid link(s)`);
      } else {
        console.log('✅ EMERGENCY CLEANUP: No invalid links found');
      }
    };
    
    // Run emergency cleanup immediately
    emergencyCleanup();
    
    // Backend PWA icon loading is disabled to prevent 404 errors
    // The static manifest.json in /public is used instead
    console.log('✅ No invalid icon links found');
  }, []);

  return null;
}