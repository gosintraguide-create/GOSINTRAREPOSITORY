import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, XCircle, Clock, Users, Calendar, Ticket, MapPin } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ScanResult {
  success: boolean;
  booking?: {
    bookingId: string;
    customerName: string;
    customerEmail: string;
    passType: string;
    numPasses: number;
    passDate: string;
    totalPrice: number;
    guidedTour: boolean;
    checkIns?: {
      timestamp: string;
      location?: string;
    }[];
    alreadyCheckedIn: boolean;
    isExpired: boolean;
  };
  message: string;
}

interface QRScannerPageProps {
  onNavigate: (page: string) => void;
}

// List of destinations in Sintra
const DESTINATIONS = [
  "Palácio da Pena",
  "Castelo dos Mouros",
  "Palácio Nacional de Sintra",
  "Quinta da Regaleira",
  "Palácio de Monserrate",
  "Cabo da Roca",
  "Centro Histórico",
  "Other"
];

export function QRScannerPage({ onNavigate }: QRScannerPageProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Block search engines from indexing this page
  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
    document.title = 'QR Scanner - Access Restricted';
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setScanResult(null);
        
        // Show tip for first-time users
        const hasSeenCameraTip = localStorage.getItem('camera-permission-tip-seen');
        if (!hasSeenCameraTip) {
          toast.success("Camera activated! Permission saved for future use.", { duration: 3000 });
          localStorage.setItem('camera-permission-tip-seen', 'true');
        }
        
        // Start scanning loop
        scanIntervalRef.current = window.setInterval(() => {
          captureAndDecodeQR();
        }, 500);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Unable to access camera. Please grant camera permissions and ensure HTTPS is enabled.");
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const captureAndDecodeQR = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use jsQR library via dynamic import
      const { default: jsQR } = await import('jsqr');
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        setIsProcessing(true);
        // Pause scanning but keep camera alive
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        await verifyQRCode(code.data);
      }
    } catch (error) {
      // jsQR not available or decode error - continue scanning
    }
  };

  const verifyQRCode = async (qrData: string) => {
    try {
      // Pause scanning while verifying
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-qr`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrData }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setScanResult(result);
        
        // Record scan for driver if logged in
        try {
          const driverSession = localStorage.getItem('driver_session');
          if (driverSession) {
            const { driver } = JSON.parse(driverSession);
            
            // Parse QR data to get booking ID and passenger index
            const [bookingId, passengerIndex] = qrData.split('|');
            
            // Record the scan
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/record-scan`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  driverId: driver.id,
                  bookingId,
                  passengerIndex: parseInt(passengerIndex) || 0
                }),
              }
            );
          }
        } catch (error) {
          // Don't fail the scan if driver recording fails
          console.error('Failed to record driver scan:', error);
        }
        
        if (!result.booking.alreadyCheckedIn && !result.booking.isExpired) {
          toast.success("Valid pass scanned!");
          // Show quick destination selector
          setShowDestinationDialog(true);
        } else if (result.booking.alreadyCheckedIn) {
          toast.warning("Pass already checked in today");
        } else if (result.booking.isExpired) {
          toast.error("Pass is expired");
        }
      } else {
        setScanResult(result);
        toast.error(result.message || "Invalid QR code");
      }
    } catch (error) {
      console.error("QR verification error:", error);
      toast.error("Failed to verify QR code");
      setScanResult({
        success: false,
        message: "Network error - please try again"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkInPassenger = async () => {
    if (!scanResult?.booking || !selectedDestination) {
      toast.error("Please select a destination");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/checkin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bookingId: scanResult.booking.bookingId,
            passengerIndex: scanResult.booking.passengerIndex || 0,
            location: "Vehicle Pickup",
            destination: selectedDestination
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Passenger checked in to ${selectedDestination}!`);
        
        // Auto-reset to scan next passenger after successful check-in
        setTimeout(() => {
          resetScanner();
        }, 1500);
      } else {
        toast.error(result.message || "Check-in failed");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in passenger");
    } finally {
      setIsProcessing(false);
    }
  };

  const quickCheckIn = async (destination: string) => {
    if (!scanResult?.booking) return;

    setIsProcessing(true);
    setShowDestinationDialog(false);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/checkin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bookingId: scanResult.booking.bookingId,
            passengerIndex: scanResult.booking.passengerIndex || 0,
            location: "Vehicle Pickup",
            destination: destination
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ Checked in to ${destination}!`);
        
        // Auto-reset to scan next passenger after successful check-in
        setTimeout(() => {
          resetScanner();
        }, 1000);
      } else {
        toast.error(result.message || "Check-in failed");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in passenger");
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsProcessing(false);
    setSelectedDestination("");
    setShowDestinationDialog(false);
    
    // Resume scanning if camera stream is still active
    if (streamRef.current && !scanIntervalRef.current && videoRef.current) {
      scanIntervalRef.current = window.setInterval(() => {
        captureAndDecodeQR();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 pb-20">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onNavigate("admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Scan passenger QR codes to verify passes and check in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full ${scanning ? 'block' : 'hidden'}`}
                style={{ maxHeight: '400px' }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {!scanning && !scanResult && (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <CameraOff className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Camera is off. Click the button below to start scanning.
                  </p>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-lg border-4 border-accent shadow-lg" 
                       style={{ 
                         boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                       }}
                  />
                </div>
              )}
            </div>

            {/* Scan Controls */}
            {!scanResult && (
              <div className="flex gap-2">
                {!scanning ? (
                  <Button
                    onClick={startScanning}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Camera className="h-5 w-5" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <CameraOff className="h-5 w-5" />
                    Stop Scanning
                  </Button>
                )}
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="space-y-4">
                {scanResult.success && scanResult.booking ? (
                  <>
                    {/* Status Badge */}
                    <Alert className={
                      scanResult.booking.isExpired 
                        ? "border-destructive bg-destructive/10" 
                        : scanResult.booking.alreadyCheckedIn
                          ? "border-accent bg-accent/10"
                          : "border-green-500 bg-green-50"
                    }>
                      <div className="flex items-center gap-2">
                        {scanResult.booking.isExpired ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : scanResult.booking.alreadyCheckedIn ? (
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <AlertDescription className="flex-1">
                          {scanResult.booking.isExpired 
                            ? "This pass has expired"
                            : scanResult.booking.alreadyCheckedIn
                              ? "Already checked in today"
                              : "Valid pass - ready to check in"
                          }
                        </AlertDescription>
                      </div>
                    </Alert>

                    {/* Booking Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Passenger Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{scanResult.booking.customerName}</p>
                            <p className="text-muted-foreground">{scanResult.booking.customerEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Ticket className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{scanResult.booking.passType}</p>
                            <p className="text-muted-foreground">
                              {scanResult.booking.numPasses} {scanResult.booking.numPasses === 1 ? 'pass' : 'passes'}
                              {scanResult.booking.guidedTour && " • Guided Tour"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">
                              {new Date(scanResult.booking.passDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {scanResult.booking.checkIns && scanResult.booking.checkIns.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="mb-2 flex items-center gap-2 font-medium">
                              <Clock className="h-4 w-4" />
                              Check-in History
                            </p>
                            <div className="space-y-1">
                              {scanResult.booking.checkIns.map((checkin, index) => (
                                <p key={index} className="text-muted-foreground">
                                  {new Date(checkin.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {checkin.location && ` - ${checkin.location}`}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Destination Selector */}
                    {!scanResult.booking.isExpired && !scanResult.booking.alreadyCheckedIn && (
                      <Card className="border-accent/50 bg-accent/5">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <Label htmlFor="destination" className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-accent" />
                              Select Destination
                            </Label>
                            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                              <SelectTrigger id="destination" className="w-full">
                                <SelectValue placeholder="Where is the passenger going?" />
                              </SelectTrigger>
                              <SelectContent>
                                {DESTINATIONS.map((dest) => (
                                  <SelectItem key={dest} value={dest}>
                                    {dest}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!scanResult.booking.isExpired && !scanResult.booking.alreadyCheckedIn && (
                        <Button
                          onClick={checkInPassenger}
                          disabled={isProcessing || !selectedDestination}
                          className="flex-1 gap-2"
                          size="lg"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Check In to {selectedDestination || "Destination"}
                        </Button>
                      )}
                      <Button
                        onClick={resetScanner}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        Scan Another
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Error State */}
                    <Alert className="border-destructive bg-destructive/10">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <AlertDescription>
                        {scanResult.message || "Invalid QR code"}
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={resetScanner}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Processing...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Destination Selector Dialog */}
        <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Select Destination
              </DialogTitle>
              <DialogDescription>
                {scanResult?.booking?.customerName} - Where are they going?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {DESTINATIONS.map((dest) => (
                <Button
                  key={dest}
                  onClick={() => quickCheckIn(dest)}
                  disabled={isProcessing}
                  size="lg"
                  variant="outline"
                  className="h-20 text-base hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {dest}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDestinationDialog(false);
                setTimeout(resetScanner, 300);
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}