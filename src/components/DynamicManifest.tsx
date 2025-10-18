import { useEffect } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

/**
 * DynamicManifest Component
 * 
 * This component dynamically updates the PWA manifest link to use the backend-served manifest
 * which includes the deployed PWA icons. It runs on app load and updates the manifest reference.
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
    
    const updateManifest = async () => {
      try {
        // FIRST: Clean up any existing icon links with undefined/invalid sizes
        const cleanupBadIconLinks = () => {
          const allIconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
          let cleaned = 0;
          
          allIconLinks.forEach(link => {
            const sizes = link.getAttribute('sizes');
            const href = link.getAttribute('href');
            
            // Remove if sizes is undefined, null, or href contains undefined
            if (!sizes || sizes === 'undefined' || sizes === 'null' || 
                href?.includes('undefined') || href?.includes('null')) {
              console.log(`🧹 Removing invalid icon link: sizes=${sizes}, href=${href}`);
              link.remove();
              cleaned++;
            }
          });
          
          if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} invalid icon link(s)`);
          } else {
            console.log('✅ No invalid icon links found');
          }
        };
        
        cleanupBadIconLinks();
        
        // Check if icons are deployed on the backend
        const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;
        
        console.log('🔍 Checking for deployed PWA icons...');
        
        const response = await fetch(`${serverUrl}/pwa-icons/status`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        });
        
        if (!response.ok) {
          console.log('ℹ️ PWA icons check: Using default manifest (backend not accessible or icons not uploaded)');
          return;
        }
        
        const data = await response.json();
        
        console.log('📊 PWA icons status:', data);
        
        if (data.deployed && data.count > 0 && data.icons && data.icons.length > 0) {
          console.log(`📱 Found ${data.count} deployed PWA icons, using dynamic manifest`);
          
          // Verify icons are actually accessible before updating links
          const firstIcon = data.icons[0];
          
          // Additional safety check before constructing test URL
          if (!firstIcon || !firstIcon.size || firstIcon.size === 'undefined' || firstIcon.size === 'null') {
            console.log('📱 First icon has invalid size, using default manifest');
            return;
          }
          
          const testUrl = `${serverUrl}/pwa-icons/${firstIcon.size}.png`;
          
          try {
            const testResponse = await fetch(testUrl, { 
              method: 'HEAD',
              headers: { 'Authorization': `Bearer ${publicAnonKey}` }
            });
            
            if (!testResponse.ok) {
              console.log('📱 Icons deployed but not accessible yet, using default manifest');
              return;
            }
          } catch (e) {
            console.log('📱 Error testing icon accessibility, using default manifest');
            return;
          }
          
          // Remove existing manifest link if any
          const existingLink = document.querySelector('link[rel="manifest"]');
          if (existingLink) {
            existingLink.remove();
          }
          
          // Add new dynamic manifest link
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = `${serverUrl}/pwa-icons/manifest.json`;
          document.head.appendChild(manifestLink);
          
          console.log('✅ Dynamic manifest loaded successfully');
          
          // Remove ALL existing icon links (not just the ones we're replacing)
          const allIconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
          allIconLinks.forEach(link => {
            console.log(`🧹 Removing existing icon link: ${link.getAttribute('href')}`);
            link.remove();
          });
          
          // Update icon links using deployed icon sizes
          const deployedSizes = data.icons.map((icon: any) => icon.size);
          
          // Validate all sizes before creating links (ENHANCED VALIDATION)
          const validSizes = deployedSizes.filter((size: any) => {
            // Check if size exists and is a string
            if (!size || typeof size !== 'string') {
              console.warn(`⚠️ Skipping invalid size (not a string): ${size} (type: ${typeof size})`);
              return false;
            }
            // Check if size is literally the string "undefined" or "null"
            if (size === 'undefined' || size === 'null') {
              console.warn(`⚠️ Skipping invalid size string: ${size}`);
              return false;
            }
            // Check if size has proper format (e.g., "192x192")
            if (!/^\d+x\d+$/.test(size)) {
              console.warn(`⚠️ Skipping size with invalid format: ${size} (expected: 192x192)`);
              return false;
            }
            return true;
          });
          
          validSizes.forEach((size: string) => {
            // Triple-check size is valid before creating link
            if (!size || size === 'undefined' || size === 'null') {
              console.error(`🚨 CRITICAL: Invalid size escaped validation: ${size}`);
              return;
            }
            
            // Add new icon link from backend
            const iconLink = document.createElement('link');
            iconLink.rel = 'icon';
            iconLink.type = 'image/png';
            iconLink.sizes = size;
            iconLink.href = `${serverUrl}/pwa-icons/${size}.png`;
            
            // Final verification before adding to DOM
            if (iconLink.href.includes('undefined') || iconLink.href.includes('null')) {
              console.error(`🚨 CRITICAL: Generated URL contains undefined: ${iconLink.href}`);
              return;
            }
            
            document.head.appendChild(iconLink);
            console.log(`➕ Added icon link: ${size} → ${iconLink.href}`);
          });
          
          // Add apple-touch-icon for iOS (use 192x192 if available)
          if (validSizes.includes('192x192')) {
            const appleIconLink = document.createElement('link');
            appleIconLink.rel = 'apple-touch-icon';
            appleIconLink.href = `${serverUrl}/pwa-icons/192x192.png`;
            
            // Verify URL is valid before adding
            if (!appleIconLink.href.includes('undefined') && !appleIconLink.href.includes('null')) {
              document.head.appendChild(appleIconLink);
              console.log(`➕ Added apple-touch-icon → ${appleIconLink.href}`);
            } else {
              console.error(`🚨 CRITICAL: Apple icon URL contains undefined: ${appleIconLink.href}`);
            }
          }
          
          console.log(`✅ Updated ${validSizes.length} PWA icon links`);
        } else {
          console.log('📱 No PWA icons deployed yet, using default manifest');
        }
        
        // FINAL: Do one more cleanup pass to ensure no bad links were created
        const finalCleanup = () => {
          const allIconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
          let cleaned = 0;
          
          allIconLinks.forEach(link => {
            const sizes = link.getAttribute('sizes');
            const href = link.getAttribute('href');
            
            // Remove if sizes is undefined, null, or href contains undefined
            if (sizes === 'undefined' || sizes === 'null' || 
                href?.includes('undefined') || href?.includes('null')) {
              console.log(`🧹 Final cleanup: Removing invalid icon link: sizes=${sizes}, href=${href}`);
              link.remove();
              cleaned++;
            }
          });
          
          if (cleaned > 0) {
            console.log(`🧹 Final cleanup removed ${cleaned} invalid icon link(s)`);
          }
        };
        
        finalCleanup();
        
      } catch (error) {
        console.log('ℹ️ Using default manifest (dynamic manifest not available)');
        // This is expected if PWA icons haven't been uploaded yet or if CORS hasn't been configured
        // The app will work fine with the default manifest from /public/manifest.json
      }
    };
    
    updateManifest();
  }, []);
  
  // This component doesn't render anything
  return null;
}
