import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ArrowLeft, TestTube, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ClearCacheButton } from './ClearCacheButton';

interface DiagnosticsPageProps {
  onNavigate: (page: string) => void;
}

export function DiagnosticsPage({ onNavigate }: DiagnosticsPageProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');

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