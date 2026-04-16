import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, Upload, Download, FileJson, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface IconData {
  filename: string;
  size: string;
  dataUrl: string;
}

interface PWAIconsData {
  icons: IconData[];
  timestamp: string;
}

interface PWAIconInstallerProps {
  onNavigate: (page: string) => void;
}

export function PWAIconInstaller({ onNavigate }: PWAIconInstallerProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<PWAIconsData | null>(null);
  const [installedIcons, setInstalledIcons] = useState<Set<string>>(new Set());
  const [isInstalling, setIsInstalling] = useState(false);

  const handleParseJson = () => {
    try {
      console.log('🔍 Attempting to parse JSON...');
      console.log('📝 Input length:', jsonInput.length);
      console.log('📝 First 100 chars:', jsonInput.substring(0, 100));
      
      const data = JSON.parse(jsonInput) as PWAIconsData;
      console.log('✅ JSON parsed successfully');
      console.log('📦 Data structure:', {
        hasIcons: !!data.icons,
        isArray: Array.isArray(data.icons),
        length: data.icons?.length || 0
      });
      
      if (!data.icons || !Array.isArray(data.icons)) {
        throw new Error("Invalid JSON format: missing 'icons' array. Make sure you copied the complete JSON file from the uploader.");
      }

      if (data.icons.length === 0) {
        throw new Error("No icons found in the JSON data.");
      }

      // Validate each icon has required fields
      for (const icon of data.icons) {
        if (!icon.filename || !icon.dataUrl) {
          throw new Error(`Invalid icon data: missing filename or dataUrl`);
        }
      }

      console.log('✅ All validation passed!');
      setParsedData(data);
      toast.success(`Successfully parsed ${data.icons.length} icons!`);
    } catch (error) {
      console.error('❌ Parse error:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format. Please copy the entire contents of the pwa-icons-data.json file.');
      } else {
        toast.error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid format'}`);
      }
    }
  };

  const loadTestData = () => {
    const testData = {
      "icons": [
        {
          "filename": "icon-72x72.png",
          "size": "72x72",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-96x96.png",
          "size": "96x96",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-128x128.png",
          "size": "128x128",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-144x144.png",
          "size": "144x144",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-152x152.png",
          "size": "152x152",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-192x192.png",
          "size": "192x192",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-384x384.png",
          "size": "384x384",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        },
        {
          "filename": "icon-512x512.png",
          "size": "512x512",
          "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
      ],
      "timestamp": "2025-10-14T12:00:00.000Z"
    };
    
    setJsonInput(JSON.stringify(testData, null, 2));
    toast.info('Test data loaded! Click "Parse JSON Data" to continue.');
  };

  const base64ToBlob = (base64: string): Blob => {
    const base64Data = base64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  };

  const downloadIcon = (icon: IconData) => {
    const blob = base64ToBlob(icon.dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = icon.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setInstalledIcons(prev => new Set([...prev, icon.filename]));
    toast.success(`Downloaded ${icon.filename}`);
  };

  const downloadAllIcons = () => {
    if (!parsedData) return;
    
    parsedData.icons.forEach((icon, index) => {
      setTimeout(() => {
        downloadIcon(icon);
      }, index * 200); // Stagger downloads
    });
  };

  const generateManifestJson = () => {
    if (!parsedData) return null;

    const iconEntries = parsedData.icons.map(icon => {
      const size = icon.size.replace('.png', '').replace('icon-', '');
      return {
        src: `/${icon.filename}`,
        sizes: size,
        type: "image/png",
        purpose: size === "512x512" ? "any maskable" : "any"
      };
    });

    return {
      name: "Go Sintra - Hop-On Hop-Off Day Pass",
      short_name: "Go Sintra",
      description: "Explore Sintra's stunning attractions with unlimited hop-on hop-off service. Book your day pass now!",
      start_url: "/",
      display: "standalone",
      background_color: "#0A4D5C",
      theme_color: "#0A4D5C",
      orientation: "portrait-primary",
      icons: iconEntries,
      categories: ["travel", "tourism", "transportation"],
      screenshots: []
    };
  };

  const downloadManifest = () => {
    const manifest = generateManifestJson();
    if (!manifest) return;

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded updated manifest.json!');
  };

  const deployToBackend = async () => {
    if (!parsedData) return;
    
    setIsInstalling(true);
    
    try {
      console.log('🚀 Deploying icons to backend...');
      console.log('📦 Icons to deploy:', parsedData.icons.map(i => ({ 
        filename: i.filename, 
        size: i.size,
        dataUrl: i.dataUrl ? `${i.dataUrl.substring(0, 50)}...` : 'missing'
      })));
      
      // Get Supabase credentials
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;
      
      console.log('🌐 Server URL:', serverUrl);
      
      // Deploy icons to backend
      const response = await fetch(`${serverUrl}/pwa-icons/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icons: parsedData.icons
        })
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Server error:', error);
        throw new Error(error.error || 'Deployment failed');
      }
      
      const result = await response.json();
      console.log('✅ Deployment result:', result);
      
      // Mark all icons as installed
      const newInstalled = new Set<string>();
      parsedData.icons.forEach(icon => newInstalled.add(icon.filename));
      setInstalledIcons(newInstalled);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ Some icons had errors:', result.errors);
        toast.warning(`Deployed ${result.deployed.length} icons with ${result.errors.length} errors. Check console.`, {
          duration: 7000
        });
      } else {
        toast.success(`🎉 Successfully deployed ${result.deployed.length} icons to the server!`, {
          duration: 5000
        });
      }
      
      // Show next steps
      toast.info('Icons are now live! Refresh to see them in action.', {
        duration: 7000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
      
    } catch (error) {
      console.error('❌ Deployment error:', error);
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallAll = async () => {
    await deployToBackend();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onNavigate("admin")}
            >
              ← Back to Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate("pwa-icons")}
            >
              Go to Uploader
            </Button>
          </div>
          <h1 className="mb-2">PWA Icon Installer</h1>
          <p className="text-muted-foreground">
            Install your PWA icons by pasting the JSON data from the uploader
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Need help? See <code className="rounded bg-muted px-1">PWA_ICONS_TROUBLESHOOTING.md</code> for detailed troubleshooting
          </p>
        </div>

        {/* Step 1: Paste JSON */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h3>Step 1: Paste Icon Data</h3>
          </div>

          <Alert className="mb-4">
            <AlertDescription>
              <p className="mb-2">
                <strong>Instructions:</strong>
              </p>
              <ol className="ml-4 list-decimal space-y-1 text-sm">
                <li>Open the downloaded <code className="rounded bg-muted px-1">pwa-icons-data.json</code> file with a text editor</li>
                <li>Select all text (Ctrl+A or Cmd+A) and copy it</li>
                <li>Paste the complete JSON content into the box below</li>
                <li>Click "Parse JSON Data" to continue</li>
              </ol>
              <p className="mt-3 text-sm">
                <strong>💡 Tip:</strong> Having trouble? Click <strong>"🧪 Load Test Data"</strong> to verify the installer works, then check <code className="rounded bg-muted px-1">PWA_ICONS_TROUBLESHOOTING.md</code>
              </p>
            </AlertDescription>
          </Alert>
          
          <Textarea
            placeholder='{"icons":[{"filename":"icon-72x72.png","size":"72x72","dataUrl":"data:image/png;base64,..."}...],"timestamp":"..."}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="mb-4 min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleParseJson} disabled={!jsonInput.trim()} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Parse JSON Data
            </Button>
            
            <Button onClick={loadTestData} variant="outline">
              🧪 Load Test Data
            </Button>
          </div>
        </Card>

        {/* Step 2: Review & Install */}
        {parsedData && (
          <>
            <Card className="mb-6 p-6">
              <div className="mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h3>Step 2: Review Icons ({parsedData.icons.length})</h3>
              </div>
              
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {parsedData.icons.map((icon) => (
                  <div
                    key={icon.filename}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <img
                      src={icon.dataUrl}
                      alt={icon.filename}
                      className="h-12 w-12 rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">
                        {icon.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {icon.size}
                      </div>
                    </div>
                    {installedIcons.has(icon.filename) && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleInstallAll} disabled={isInstalling} size="lg">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isInstalling ? 'Deploying...' : 'Deploy Icons to Server'}
                </Button>
              </div>
            </Card>

            {/* Step 3: Deployment Instructions */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3>Step 3: Deploy to Server</h3>
              </div>
              
              <Alert className="mb-4">
                <AlertDescription>
                  <p className="mb-3 font-medium">How automatic deployment works:</p>
                  <ol className="ml-4 list-decimal space-y-2 text-sm">
                    <li><strong>Click "Deploy Icons to Server"</strong> - Icons will be uploaded to your Supabase backend</li>
                    <li><strong>Icons are stored securely</strong> - Each icon is saved in the KV store and served dynamically</li>
                    <li><strong>No manual file moving needed</strong> - Everything happens automatically in the cloud</li>
                    <li><strong>PWA updates instantly</strong> - Your manifest.json will point to the new icons automatically</li>
                    <li><strong>Test on device</strong> - Clear cache and reinstall PWA to see new icons</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {installedIcons.size > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="mb-2 text-sm font-medium text-green-900">✅ Deployment Status:</p>
                  <div className="grid gap-1 text-xs font-mono text-green-700">
                    {parsedData.icons.map(icon => (
                      <div key={icon.filename} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        {icon.filename} → Deployed to server
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Preview of manifest.json */}
            <Card className="mt-6 p-6">
              <div className="mb-4">
                <h4>Manifest.json Preview</h4>
              </div>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(generateManifestJson(), null, 2)}
              </pre>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
