import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Bug } from 'lucide-react';

interface DebugIconsPageProps {
  onNavigate: (page: string) => void;
}

export function DebugIconsPage({ onNavigate }: DebugIconsPageProps) {
  const [iconLinks, setIconLinks] = useState<any[]>([]);
  const [manifestData, setManifestData] = useState<any>(null);
  const [networkRequests, setNetworkRequests] = useState<string[]>([]);

  useEffect(() => {
    // Scan all link elements
    const scanLinks = () => {
      const links = Array.from(document.querySelectorAll('link'));
      const iconLinksData = links
        .filter(link => 
          link.rel === 'icon' || 
          link.rel === 'apple-touch-icon' || 
          link.rel === 'manifest'
        )
        .map(link => ({
          rel: link.rel,
          href: link.getAttribute('href'),
          sizes: link.getAttribute('sizes'),
          type: link.getAttribute('type'),
          isValid: !link.getAttribute('href')?.includes('undefined') && 
                   !link.getAttribute('href')?.includes('null') &&
                   !link.getAttribute('sizes')?.includes('undefined') &&
                   !link.getAttribute('sizes')?.includes('null')
        }));
      
      setIconLinks(iconLinksData);
    };

    scanLinks();

    // Intercept fetch to track icon requests
    const originalFetch = window.fetch;
    const requests: string[] = [];
    
    (window as any).fetch = function(...args: any[]) {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      if (url.includes('pwa-icons') || url.includes('icon') || url.includes('.png')) {
        requests.push(url);
        setNetworkRequests([...requests]);
      }
      return originalFetch.apply(this, args);
    };

    // Load manifest
    const loadManifest = async () => {
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          const href = manifestLink.getAttribute('href');
          if (href) {
            const response = await fetch(href);
            const data = await response.json();
            setManifestData(data);
          }
        }
      } catch (error) {
        console.error('Error loading manifest:', error);
      }
    };

    loadManifest();

    // Cleanup
    return () => {
      (window as any).fetch = originalFetch;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl px-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('diagnostics')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Diagnostics
        </Button>

        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2">
            <Bug className="size-8" />
            PWA Icons Debug
          </h1>
          <p className="text-muted-foreground">
            Diagnostic information to track down the "undefined" icon error
          </p>
        </div>

        {/* Icon Links in DOM */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Icon Links in DOM</CardTitle>
            <CardDescription>
              All icon and manifest links currently in the HTML head
            </CardDescription>
          </CardHeader>
          <CardContent>
            {iconLinks.length === 0 ? (
              <p className="text-muted-foreground">No icon links found</p>
            ) : (
              <div className="space-y-3">
                {iconLinks.map((link, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg border p-3 ${
                      link.isValid 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">Rel:</span>
                      <span>{link.rel}</span>
                      
                      <span className="font-medium">Href:</span>
                      <span className="break-all font-mono text-xs">
                        {link.href}
                      </span>
                      
                      {link.sizes && (
                        <>
                          <span className="font-medium">Sizes:</span>
                          <span>{link.sizes}</span>
                        </>
                      )}
                      
                      {link.type && (
                        <>
                          <span className="font-medium">Type:</span>
                          <span>{link.type}</span>
                        </>
                      )}
                      
                      <span className="font-medium">Status:</span>
                      <span className={link.isValid ? 'text-green-600' : 'text-red-600'}>
                        {link.isValid ? '✅ Valid' : '❌ Invalid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manifest Data */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manifest.json Content</CardTitle>
            <CardDescription>
              Current manifest file being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {manifestData ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <p className="text-sm text-muted-foreground">{manifestData.name}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Icons ({manifestData.icons?.length || 0}):</span>
                  <div className="mt-2 space-y-2">
                    {manifestData.icons?.map((icon: any, index: number) => (
                      <div 
                        key={index}
                        className={`rounded border p-2 text-xs ${
                          icon.src?.includes('undefined') || icon.src?.includes('null') ||
                          icon.sizes?.includes('undefined') || icon.sizes?.includes('null')
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="font-mono">
                          {icon.sizes}: {icon.src}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading manifest...</p>
            )}
          </CardContent>
        </Card>

        {/* Network Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Intercepted Icon Requests</CardTitle>
            <CardDescription>
              fetch() calls related to icons (tracked since page load)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {networkRequests.length === 0 ? (
              <p className="text-muted-foreground">No icon requests intercepted yet</p>
            ) : (
              <div className="space-y-2">
                {networkRequests.map((url, index) => (
                  <div 
                    key={index}
                    className={`rounded border p-2 text-xs font-mono ${
                      url.includes('undefined') || url.includes('null')
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {url.includes('undefined') || url.includes('null') ? '❌' : '✅'} {url}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-900">How to Use This Debug Page</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
            <li>Open browser DevTools (F12) and go to Console tab</li>
            <li>Look for any red ❌ items above - these are problematic</li>
            <li>Check the Network tab for requests to `/pwa-icons/undefined.png`</li>
            <li>If you see invalid links, check where they're coming from</li>
            <li>The error should be caught by our protection layers now</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
