import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ArrowLeft, TestTube, CheckCircle, XCircle, Loader2, Mail, Ticket, Copy, Users, CalendarDays, Database } from 'lucide-react';
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
  const [bookingQueryResult, setBookingQueryResult] = useState<any>(null);
  const [queryingBookings, setQueryingBookings] = useState(false);
  const [bookingIdLookup, setBookingIdLookup] = useState('');

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

  const testBookingRetrieval = async () => {
    setQueryingBookings(true);
    setBookingQueryResult(null);
    
    try {
      console.log('🔍 Testing booking retrieval...');
      
      // Query all bookings
      const bookingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      const bookingsData = await bookingsResponse.json();
      console.log('📊 All bookings response:', bookingsData);
      
      // If we have a specific booking ID to look up, try to fetch it
      let specificBooking = null;
      if (bookingIdLookup) {
        console.log(`🔍 Looking up specific booking: ${bookingIdLookup}`);
        const specificResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${bookingIdLookup}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const specificData = await specificResponse.json();
        console.log('📋 Specific booking response:', specificData);
        specificBooking = specificData;
      }
      
      setBookingQueryResult({
        success: bookingsData.success,
        totalBookings: bookingsData.bookings?.length || 0,
        bookings: bookingsData.bookings || [],
        error: bookingsData.error,
        specificBooking: specificBooking,
        rawResponse: bookingsData
      });
      
      if (bookingsData.success) {
        toast.success(`Found ${bookingsData.bookings?.length || 0} bookings`);
      } else {
        toast.error(`Failed to retrieve bookings: ${bookingsData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🔍 Booking query error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setBookingQueryResult({
        success: false,
        error: errorMsg
      });
      toast.error(`Failed to query bookings: ${errorMsg}`);
    } finally {
      setQueryingBookings(false);
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

      console.log('📤 Sending mock booking request:', {
        date: mockBooking.selectedDate,
        passengers: mockBooking.passengers.length,
        price: mockBooking.totalPrice
      });

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
      
      console.log('📥 Server response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
        hasBooking: !!data.booking,
        bookingId: data.booking?.id,
        error: data.error,
        fullResponse: data
      });
      
      if (response.ok && data.success && data.booking && data.booking.id) {
        const createdBookingId = data.booking.id;
        
        // VERIFICATION STEP: Query the booking immediately to confirm it was saved
        console.log(`🔍 Verifying booking ${createdBookingId} was saved to database...`);
        
        try {
          const verifyResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${createdBookingId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          const verifyData = await verifyResponse.json();
          console.log('🔍 Verification result:', verifyData);
          
          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error('Booking was created but cannot be retrieved from database');
          }
          
          console.log('✅ Booking verified in database!');
        } catch (verifyError) {
          console.error('❌ Verification failed:', verifyError);
          setMockBookingResult({
            success: false,
            error: `Booking created but verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}. Check server logs.`
          });
          toast.error('⚠️ Booking created but cannot be verified!');
          return;
        }
        
        setMockBookingResult({
          success: true,
          bookingId: createdBookingId,
          passengerCount: passengers.length,
          date: mockBooking.selectedDate,
          totalPrice: mockBooking.totalPrice
        });
        toast.success(`✅ Mock booking created & verified! ID: ${createdBookingId}`);
        console.log('🎫 Mock booking created successfully:', {
          id: createdBookingId,
          passengers: data.booking.passengers?.length,
          qrCodes: data.booking.qrCodes?.length,
          emailSkipped: data.emailSkipped
        });
      } else {
        const errorMsg = data.error || 'Unknown error - check server response in console';
        setMockBookingResult({
          success: false,
          error: errorMsg
        });
        toast.error(`Failed to create booking: ${errorMsg}`);
        console.error('🎫 Booking creation failed:', {
          response: data,
          status: response.status,
          responseText: JSON.stringify(data, null, 2)
        });
      }
    } catch (error) {
      console.error('🎫 Mock booking error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error - check console for details';
      setMockBookingResult({
        success: false,
        error: errorMsg
      });
      toast.error(`Failed to create mock booking: ${errorMsg}`);
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
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h3 className="mb-2 font-medium text-yellow-900">⚠️ Troubleshooting</h3>
              <p className="text-sm text-yellow-800 mb-2">
                If mock bookings show "success" but don't appear in Analytics → All Bookings:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-800 mb-3">
                <li>Scroll down and run "Edge Function Health Check" below</li>
                <li>Check browser console (F12) for detailed logs</li>
                <li>Verify booking ID is being returned in console</li>
                <li>The server must be deployed to Supabase for persistence</li>
              </ul>
            </div>
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
                        <Button
                          onClick={() => {
                            setBookingIdLookup(mockBookingResult.bookingId);
                            setTimeout(() => testBookingRetrieval(), 500);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 bg-white hover:bg-green-50 border-green-400"
                        >
                          <Database className="mr-2 size-3" />
                          Verify This Booking Was Saved
                        </Button>
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

        {/* Booking Retrieval Test Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Test Booking Retrieval
            </CardTitle>
            <CardDescription>
              Query the database to see all bookings and verify that created bookings are being saved correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">ℹ️ What This Tests</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                <li>Queries the GET /bookings endpoint (same as Analytics page)</li>
                <li>Shows total number of bookings found</li>
                <li>Lists all booking IDs and details</li>
                <li>Can lookup a specific booking by ID</li>
                <li>Reveals if bookings are being saved but not retrieved</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="bookingIdLookup">Specific Booking ID (optional)</Label>
              <Input
                id="bookingIdLookup"
                type="text"
                placeholder="e.g., AA-1234"
                value={bookingIdLookup}
                onChange={(e) => setBookingIdLookup(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a booking ID to look it up specifically, or leave blank to query all bookings
              </p>
            </div>

            <Button
              onClick={testBookingRetrieval}
              disabled={queryingBookings}
              className="w-full"
            >
              {queryingBookings ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Querying Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 size-4" />
                  Query All Bookings
                </>
              )}
            </Button>

            {bookingQueryResult && (
              <div className={`rounded-lg border p-4 ${bookingQueryResult.success ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'}`}>
                {bookingQueryResult.success ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle className="size-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Found {bookingQueryResult.totalBookings} Booking{bookingQueryResult.totalBookings !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {bookingQueryResult.totalBookings === 0 ? (
                      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 mb-3">
                        <p className="text-sm text-yellow-900 font-medium mb-2">⚠️ No bookings found in database!</p>
                        <p className="text-sm text-yellow-800">This means:</p>
                        <ul className="list-disc pl-5 mt-1 text-sm text-yellow-800 space-y-1">
                          <li>Mock bookings are NOT being saved to the database</li>
                          <li>The server may be deployed but kv.set() is failing silently</li>
                          <li>Check Edge Function logs in Supabase Dashboard</li>
                          <li>Look for errors in the browser console (F12)</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-white/60 p-3">
                          <p className="text-xs text-blue-700 mb-2 font-semibold">All Bookings:</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {bookingQueryResult.bookings.slice(0, 10).map((booking: any, idx: number) => (
                              <div key={idx} className="text-sm border-b border-blue-200 pb-2">
                                <div className="font-mono font-bold text-blue-900">{booking.id}</div>
                                <div className="text-xs text-blue-700 grid grid-cols-2 gap-1 mt-1">
                                  <div>Date: {booking.selectedDate}</div>
                                  <div>Passengers: {booking.passengers?.length || 0}</div>
                                  <div>Email: {booking.contactInfo?.email}</div>
                                  <div>Status: {booking.status}</div>
                                </div>
                              </div>
                            ))}
                            {bookingQueryResult.totalBookings > 10 && (
                              <p className="text-xs text-blue-600 italic">
                                ... and {bookingQueryResult.totalBookings - 10} more
                              </p>
                            )}
                          </div>
                        </div>

                        {bookingIdLookup && bookingQueryResult.specificBooking && (
                          <div className="rounded-lg bg-green-50 border border-green-300 p-3">
                            <p className="text-xs text-green-800 mb-2 font-semibold">
                              Specific Booking Lookup ({bookingIdLookup}):
                            </p>
                            {bookingQueryResult.specificBooking.success ? (
                              <div className="text-sm text-green-900">
                                <div className="font-mono font-bold">{bookingQueryResult.specificBooking.booking.id}</div>
                                <div className="text-xs mt-1">
                                  ✅ Found! This booking exists in the database.
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-900">
                                ❌ Not found: {bookingQueryResult.specificBooking.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-blue-800 hover:text-blue-900">
                        Show Raw Response (Debug)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto p-3 bg-blue-100 rounded max-h-60">
                        {JSON.stringify(bookingQueryResult.rawResponse, null, 2)}
                      </pre>
                    </details>
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <XCircle className="size-5 text-red-600" />
                      <span className="font-medium text-red-900">Query Failed</span>
                    </div>
                    <p className="text-sm text-red-800">{bookingQueryResult.error}</p>
                    <p className="text-xs text-red-700 mt-2">
                      Make sure the Edge Function is deployed and accessible. Run the Health Check below.
                    </p>
                  </>
                )}
              </div>
            )}
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