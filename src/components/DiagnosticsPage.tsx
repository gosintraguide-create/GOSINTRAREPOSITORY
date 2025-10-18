import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ArrowLeft, TestTube, CheckCircle, XCircle, Loader2, Mail, Ticket, Copy, Users, CalendarDays } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ClearCacheButton } from './ClearCacheButton';
import { DatabaseDiagnostics } from './DatabaseDiagnostics';
import { EdgeFunctionHealthCheck } from './EdgeFunctionHealthCheck';

interface DiagnosticsPageProps {
  onNavigate: (page: string) => void;
}

export function DiagnosticsPage({ onNavigate }: DiagnosticsPageProps) {
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
    document.title = 'Diagnostics - Access Restricted';
  }, []);

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [mockBookingResult, setMockBookingResult] = useState<any>(null);
  const [passengerCount, setPassengerCount] = useState(2);
  const [daysFromNow, setDaysFromNow] = useState(7);

  const testPDFGeneration = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting PDF generation test...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/test-pdf`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      
      setResult({
        success: response.ok && data.success,
        status: response.status,
        ...data
      });
      
      console.log('🧪 Test result:', data);
    } catch (error) {
      console.error('🧪 Test failed:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: String(error)
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    
    try {
      console.log('📧 Sending test booking email to:', testEmail);
      
      // Create fake booking data
      const fakeBooking = {
        selectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        timeSlot: '9:00',
        passengers: [
          { name: 'John Smith', type: 'Adult' },
          { name: 'Jane Smith', type: 'Adult' }
        ],
        contactInfo: {
          name: 'John Smith',
          email: testEmail,
          phone: '+351 912 345 678'
        },
        guidedTour: null,
        selectedAttractions: [],
        totalPrice: 50.00,
        paymentIntentId: 'test_payment_intent',
        isTestBooking: true // Flag to bypass payment verification
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(fakeBooking),
        }
      );

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('✅ Test email sent! Check your inbox.');
        console.log('📧 Test email sent successfully:', data);
      } else {
        toast.error(`Failed to send email: ${data.error || 'Unknown error'}`);
        console.error('📧 Email send failed:', data);
      }
    } catch (error) {
      console.error('📧 Test email error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setSendingEmail(false);
    }
  };

  const createMockBooking = async () => {
    setCreatingBooking(true);
    setMockBookingResult(null);
    
    try {
      console.log('🎫 Creating mock booking...');
      
      // Generate passenger data
      const passengers = [];
      const names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Wilson', 'Frank Miller'];
      for (let i = 0; i < passengerCount; i++) {
        passengers.push({
          name: names[i % names.length],
          type: i < passengerCount - 1 ? 'Adult' : 'Child'
        });
      }

      // Create mock booking data
      // Use verified email for Resend API compliance
      const mockBooking = {
        selectedDate: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeSlot: '9:00',
        passengers: passengers,
        contactInfo: {
          name: passengers[0].name,
          email: 'gosintra.guide@gmail.com', // Must use verified email for Resend
          phone: '+351 912 000 000'
        },
        guidedTour: null,
        selectedAttractions: [],
        totalPrice: passengerCount * 25,
        paymentIntentId: `mock_${Date.now()}`,
        isTestBooking: true,
        skipEmail: true // Don't send confirmation email for mock bookings
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(mockBooking),
        }
      );

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMockBookingResult({
          success: true,
          bookingId: data.booking.bookingId,
          passengerCount: passengers.length,
          date: mockBooking.selectedDate,
          totalPrice: mockBooking.totalPrice
        });
        toast.success(`✅ Mock booking created! ID: ${data.booking.bookingId}`);
        console.log('🎫 Mock booking created:', data);
      } else {
        setMockBookingResult({
          success: false,
          error: data.error || 'Unknown error'
        });
        toast.error(`Failed to create booking: ${data.error || 'Unknown error'}`);
        console.error('🎫 Booking creation failed:', data);
      }
    } catch (error) {
      console.error('🎫 Mock booking error:', error);
      setMockBookingResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error(error instanceof Error ? error.message : 'Failed to create mock booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const copyBookingId = (bookingId: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(bookingId)
        .then(() => {
          toast.success('Booking ID copied to clipboard!');
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopyText(bookingId);
        });
    } else {
      // Use fallback method
      fallbackCopyText(bookingId);
    }
  };

  const fallbackCopyText = (text: string) => {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('Booking ID copied to clipboard!');
      } else {
        toast.error('Failed to copy. Please copy manually: ' + text);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl px-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate('admin')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Admin
        </Button>

        <div className="mb-8">
          <h1 className="mb-2">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Test and verify system components
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="size-5" />
              PDF Generation Test
            </CardTitle>
            <CardDescription>
              Verify that PDF ticket generation is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testPDFGeneration}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 size-4" />
                  Run PDF Test
                </>
              )}
            </Button>

            {result && (
              <div className={`rounded-lg border p-4 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="mb-3 flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="size-5 text-green-600" />
                      <span className="font-medium text-green-900">Test Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-5 text-red-600" />
                      <span className="font-medium text-red-900">Test Failed</span>
                    </>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Status Code:</span>
                    <span>{result.status}</span>
                    
                    {result.pdfSize && (
                      <>
                        <span className="font-medium">PDF Size (chars):</span>
                        <span>{result.pdfSize.toLocaleString()}</span>
                        
                        <span className="font-medium">Estimated Bytes:</span>
                        <span>{result.estimatedBytes?.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  
                  {result.message && (
                    <div className="mt-3">
                      <span className="font-medium">Message:</span>
                      <pre className="mt-1 overflow-auto rounded bg-white/50 p-2 text-xs">
                        {result.message}
                      </pre>
                    </div>
                  )}
                  
                  {result.stack && (
                    <div className="mt-3">
                      <span className="font-medium">Stack Trace:</span>
                      <pre className="mt-1 overflow-auto rounded bg-white/50 p-2 text-xs">
                        {result.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">How to Use</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Click "Run PDF Test" to test PDF generation</li>
                <li>Check the result for success/failure status</li>
                <li>Review server logs for detailed error information</li>
                <li>If test passes but emails don't have PDFs, check email logs</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Email Test Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Test Booking Email
            </CardTitle>
            <CardDescription>
              Send a fake booking confirmation email with PDF tickets to test the complete flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Your Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendTestEmail();
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                A fake booking will be created and sent to this email
              </p>
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={sendingEmail || !testEmail}
              className="w-full"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Send Test Booking Email
                </>
              )}
            </Button>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 font-medium text-amber-900">Test Booking Details</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• <strong>Passengers:</strong> John Smith (Adult), Jane Smith (Adult)</li>
                <li>• <strong>Date:</strong> 7 days from today</li>
                <li>• <strong>Time:</strong> 9:00 AM</li>
                <li>• <strong>Total Price:</strong> €50.00</li>
                <li>• <strong>Booking ID:</strong> Will be auto-generated (AA-####)</li>
                <li>• <strong>QR Codes:</strong> Will be generated for each passenger</li>
                <li>• <strong>PDF Attachment:</strong> Included in email</li>
                <li>• <strong>Payment:</strong> Test mode (bypasses Stripe verification)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">What to Check</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Email arrives in your inbox (check spam folder)</li>
                <li>Email displays the new ticket design correctly</li>
                <li>PDF is attached to the email</li>
                <li>PDF contains all tickets with QR codes</li>
                <li>QR codes are scannable</li>
                <li>Booking ID follows new AA-#### format</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Mock Booking Creation Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="size-5" />
              Create Mock Booking
            </CardTitle>
            <CardDescription>
              Quickly create a test booking in the database for testing QR scanning, booking management, and other features (no email sent)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="passengerCount" className="flex items-center gap-2">
                  <Users className="size-4" />
                  Number of Passengers
                </Label>
                <Input
                  id="passengerCount"
                  type="number"
                  min="1"
                  max="6"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="daysFromNow" className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  Days From Now
                </Label>
                <Input
                  id="daysFromNow"
                  type="number"
                  min="0"
                  max="365"
                  value={daysFromNow}
                  onChange={(e) => setDaysFromNow(Math.max(0, Math.min(365, parseInt(e.target.value) || 7)))}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={createMockBooking}
              disabled={creatingBooking}
              className="w-full"
            >
              {creatingBooking ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating Mock Booking...
                </>
              ) : (
                <>
                  <Ticket className="mr-2 size-4" />
                  Create Mock Booking
                </>
              )}
            </Button>

            {mockBookingResult && (
              <div className={`rounded-lg border p-4 ${mockBookingResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                {mockBookingResult.success ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle className="size-5 text-green-600" />
                      <span className="font-medium text-green-900">Booking Created Successfully!</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-white/60 p-3">
                        <div>
                          <p className="text-xs text-green-700">Booking ID</p>
                          <p className="font-mono text-lg font-bold text-green-900">{mockBookingResult.bookingId}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyBookingId(mockBookingResult.bookingId)}
                          className="gap-1"
                        >
                          <Copy className="size-3" />
                          Copy
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded bg-white/60 p-2">
                          <p className="text-xs text-green-700">Passengers</p>
                          <p className="font-semibold text-green-900">{mockBookingResult.passengerCount}</p>
                        </div>
                        <div className="rounded bg-white/60 p-2">
                          <p className="text-xs text-green-700">Date</p>
                          <p className="font-semibold text-green-900">{new Date(mockBookingResult.date).toLocaleDateString()}</p>
                        </div>
                        <div className="rounded bg-white/60 p-2">
                          <p className="text-xs text-green-700">Total</p>
                          <p className="font-semibold text-green-900">€{mockBookingResult.totalPrice}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-green-300 bg-green-100/50 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">✅ What You Can Test Now:</p>
                        <ul className="space-y-0.5 text-xs text-green-700">
                          <li>• Scan QR codes in Operations Portal</li>
                          <li>• View booking in Admin Dashboard</li>
                          <li>• Test booking management features</li>
                          <li>• Check analytics and reports</li>
                          <li>• Verify destination tracking</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <XCircle className="size-5 text-red-600" />
                      <span className="font-medium text-red-900">Failed to Create Booking</span>
                    </div>
                    <p className="text-sm text-red-800">{mockBookingResult.error}</p>
                  </>
                )}
              </div>
            )}

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h3 className="mb-2 font-medium text-purple-900">Mock Booking Details</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• <strong>Email:</strong> gosintra.guide@gmail.com (verified email - no email sent due to skipEmail flag)</li>
                <li>• <strong>Phone:</strong> +351 912 000 000</li>
                <li>• <strong>Time:</strong> 9:00 AM</li>
                <li>• <strong>Guided Tour:</strong> None</li>
                <li>• <strong>Attractions:</strong> None</li>
                <li>• <strong>Price:</strong> €25 per passenger</li>
                <li>• <strong>Payment:</strong> Mock (test_payment_intent)</li>
                <li>• <strong>QR Codes:</strong> Generated for each passenger</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">Quick Testing Guide</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
                <li>Create a mock booking with your desired parameters</li>
                <li>Copy the Booking ID to test booking management</li>
                <li>Go to Operations Portal to scan the QR codes</li>
                <li>Check Admin Dashboard to view booking details</li>
                <li>Test destination tracking and analytics</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Edge Function Health Check - MUST BE FIRST */}
        <div className="mt-6">
          <EdgeFunctionHealthCheck />
        </div>

        {/* Database Diagnostics */}
        <div className="mt-6">
          <DatabaseDiagnostics />
        </div>

        {/* Cache Clear Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧹 Clear All Caches
            </CardTitle>
            <CardDescription>
              Fix PWA icon issues and other cached data problems by clearing all caches and forcing a clean reload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClearCacheButton />
            
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 font-medium text-amber-900">When to Use This</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• Seeing "Invalid icon size parameter: undefined" errors</li>
                <li>• PWA icons not displaying correctly</li>
                <li>• Old content still showing after updates</li>
                <li>• Service worker issues</li>
                <li>• Need a completely fresh start</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">What Gets Cleared</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>✅ Service Worker caches</li>
                <li>✅ localStorage (except language preference)</li>
                <li>✅ sessionStorage</li>
                <li>✅ IndexedDB databases</li>
                <li>✅ Icon/manifest links from DOM</li>
                <li>✅ Service Worker registrations</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Debug Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🐛 Advanced Debug Tools
            </CardTitle>
            <CardDescription>
              Deep diagnostic tools for troubleshooting PWA icon issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onNavigate('debug-icons')}
              variant="outline"
              className="w-full"
            >
              🔍 Open PWA Icons Debugger
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              View all icon links in DOM, manifest content, and intercepted network requests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}