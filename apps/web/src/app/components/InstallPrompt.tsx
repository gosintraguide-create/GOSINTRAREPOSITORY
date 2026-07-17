import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[InstallPrompt] App already installed');
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        console.log('[InstallPrompt] User dismissed prompt recently, not showing again');
        // Don't show again for 7 days
        return;
      }
    }

    console.log('[InstallPrompt] Registering beforeinstallprompt listener');

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[InstallPrompt] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 10 seconds
      console.log('[InstallPrompt] Will show prompt in 10 seconds');
      setTimeout(() => {
        console.log('[InstallPrompt] Showing prompt now');
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[InstallPrompt] App installed successfully!');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Log current state
    console.log('[InstallPrompt] Listeners registered. Current state:', {
      isInstalled,
      showPrompt,
      hasDeferredPrompt: !!deferredPrompt
    });

    return () => {
      console.log('[InstallPrompt] Removing event listeners');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      console.log('[InstallPrompt] Showing install prompt...');
      
      // Show the install prompt
      await deferredPrompt.prompt();
      
      console.log('[InstallPrompt] Prompt shown, waiting for user choice...');

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[InstallPrompt] User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[InstallPrompt] User accepted the install prompt');
      } else {
        console.log('[InstallPrompt] User dismissed the install prompt');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[InstallPrompt] Error during installation:', error);
      // Don't clear the prompt if there was an error - user can try again
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <Card className="border-2 border-primary/20 bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-5">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-foreground mb-1">Install Hop On Sintra</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get quick access and work offline. Perfect for drivers!
            </p>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">✓</span>
            <span className="text-foreground">Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">✓</span>
            <span className="text-foreground">Home screen icon</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">✓</span>
            <span className="text-foreground">Faster loading</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
          >
            Later
          </Button>
        </div>
      </Card>
    </div>
  );
}