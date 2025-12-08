import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Car, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { getSession } from "../lib/sessionManager";

interface LiveChatProps {
  onNavigate: (page: string) => void;
}

interface Message {
  id: string;
  sender: "customer" | "admin";
  senderName: string;
  message: string;
  timestamp: string;
}

export function LiveChat({ onNavigate }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('LiveChat component mounted');
    console.log('Supabase project ID:', projectId);
    console.log('WhatsApp number:', loadContent().company.whatsappNumber);
    
    setContent(loadContent());
    
    // Check for logged-in user session
    const session = getSession();
    if (session) {
      setCustomerName(session.customerName);
      setCustomerEmail(session.customerEmail);
      
      // Always check for existing conversation when user is logged in
      // This will either resume an existing chat or create a new one
      autoStartChatForLoggedInUser(session.customerName, session.customerEmail);
    } else {
      // For non-logged-in users, check localStorage
      const savedConvId = localStorage.getItem("chatConversationId");
      if (savedConvId) {
        setConversationId(savedConvId);
        setHasStartedChat(true);
        loadMessages(savedConvId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const autoStartChatForLoggedInUser = async (name: string, email: string) => {
    try {
      console.log(`🔍 Checking for existing conversation for ${email}...`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: name,
            customerEmail: email,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.conversationId) {
          console.log(
            result.resumed 
              ? `✅ Resumed existing conversation: ${result.conversationId}` 
              : `✅ Started new conversation: ${result.conversationId}`
          );
          setConversationId(result.conversationId);
          setHasStartedChat(true);
          localStorage.setItem("chatConversationId", result.conversationId);
          
          // Load existing messages if conversation was resumed
          if (result.resumed) {
            loadMessages(result.conversationId);
          }
        }
      }
    } catch (error) {
      console.error("Error auto-starting chat:", error);
      // Silently fail - user can still manually start chat
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up realtime subscription for instant message updates
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_3bd0ade8',
        },
        (payload) => {
          // Filter for this specific chat conversation
          const key = payload.new?.key;
          if (key !== `live_chat_${conversationId}`) {
            return;
          }
          
          console.log('💬 Realtime chat message change detected:', payload);
          // Reload messages when conversation changes
          loadMessages(conversationId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Chat subscription active for conversation:', conversationId);
        }
        // Silently handle errors - realtime will handle message updates
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/${convId}/messages`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to load messages: ${response.status}`);
        return;
      }

      const result = await response.json();
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      // Don't show error to user, just log it
    }
  };

  const startConversation = async () => {
    // Check if we already have a conversation ID (user went back and is resuming)
    if (conversationId) {
      // Just show the existing chat
      setHasStartedChat(true);
      loadMessages(conversationId);
      toast.success("Welcome back! Resuming your conversation.");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Please enter your name and email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName,
            customerEmail,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.conversationId) {
        setConversationId(result.conversationId);
        setHasStartedChat(true);
        localStorage.setItem("chatConversationId", result.conversationId);
        
        // Load messages if resuming existing conversation
        if (result.resumed) {
          loadMessages(result.conversationId);
          toast.success("Welcome back! Resuming your conversation.");
        } else {
          toast.success("Chat started! We'll respond shortly.");
        }
      } else {
        throw new Error(result.error || "Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Chat unavailable. Please use WhatsApp instead.");
      // Automatically show WhatsApp as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    // Remove all non-digit characters from the WhatsApp number
    const whatsappNumber = content.company.whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent("Hi! I'd like to know more about Hop On Sintra day passes.");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    console.log('Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, "_blank");
  };

  const handleRequestPickup = () => {
    onNavigate("request-pickup");
    setIsOpen(false);
  };

  const handleGoBack = () => {
    // Go back to contact options screen without erasing the conversation
    // The conversation is saved and will resume when they click "Start Web Chat" again
    setHasStartedChat(false);
    toast.info("Your conversation is saved.");
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    const messageText = message.trim();
    setMessage(""); // Clear input immediately

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            sender: "customer",
            senderName: customerName,
            message: messageText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.message) {
        setMessages(prev => [...prev, result.message]);
      } else {
        throw new Error(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try WhatsApp instead.");
      setMessage(messageText); // Restore the message
    }
  };

  // When chat opens, check for logged-in user and ensure conversation is loaded
  useEffect(() => {
    if (!isOpen) return;

    const session = getSession();
    if (session && !conversationId) {
      // User is logged in but no conversation loaded - fetch it
      console.log('Chat opened for logged-in user, loading conversation...');
      autoStartChatForLoggedInUser(session.customerName, session.customerEmail);
    } else if (!session && conversationId) {
      // User logged out while chat was open - check if localStorage was cleared
      const savedConvId = localStorage.getItem("chatConversationId");
      if (!savedConvId) {
        // Session and conversation were cleared (user logged out) - reset chat
        console.log('User logged out, resetting chat state...');
        setConversationId(null);
        setHasStartedChat(false);
        setMessages([]);
        setCustomerName("");
        setCustomerEmail("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conversationId]);

  // Handle click outside to close chat
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[aria-label="Toggle live chat"]')
      ) {
        setIsOpen(false);
      }
    };

    // Add a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        aria-label="Toggle live chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        ) : (
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card ref={chatWindowRef} className="fixed bottom-20 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden border-border bg-card shadow-2xl sm:bottom-24 sm:right-6 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-accent p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {hasStartedChat && (
                <button
                  onClick={handleGoBack}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-accent-foreground transition-colors hover:bg-accent-foreground/10"
                  aria-label="Go back to contact options"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-foreground/10">
                <MessageCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-accent-foreground">Live Support</h3>
                <p className="text-accent-foreground/80">We're here to help!</p>
              </div>
            </div>
          </div>

          {/* Messages or Start Form */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ maxHeight: "min(400px, 50vh)" }}>
            {!hasStartedChat ? (
              /* Start Chat Form */
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-foreground">
                    Hi! 👋 Welcome to Hop On Sintra. How can we help you today?
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Primary action: WhatsApp */}
                  <Button
                    onClick={handleWhatsApp}
                    size="lg"
                    className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A]"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Chat on WhatsApp
                  </Button>

                  <Button
                    onClick={handleRequestPickup}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <Car className="mr-2 h-5 w-5" />
                    Request Pickup
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-muted-foreground">or start web chat</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-foreground">Your Name</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Smith"
                      className="mt-1 border-border"
                      readOnly={!!getSession()}
                    />
                    {getSession() && (
                      <p className="mt-1 text-xs text-primary">✓ Auto-filled from your profile</p>
                    )}
                  </div>

                  <div>
                    <label className="text-foreground">Email</label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1 border-border"
                      readOnly={!!getSession()}
                    />
                    {getSession() && (
                      <p className="mt-1 text-xs text-primary">✓ Auto-filled from your profile</p>
                    )}
                  </div>

                  <Button
                    onClick={startConversation}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? "Starting..." : "Start Web Chat"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    For fastest response, use WhatsApp
                  </p>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Alternative Contact:</strong><br />
                      Email: {content.company.email}<br />
                      Phone: {content.company.phone}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === "customer" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.sender === "customer" ? "bg-accent/20" : "bg-primary/10"
                    }`}>
                      <MessageCircle className={`h-4 w-4 ${
                        msg.sender === "customer" ? "text-accent" : "text-primary"
                      }`} />
                    </div>
                    <div className={`flex-1 rounded-lg p-3 ${
                      msg.sender === "customer" 
                        ? "bg-accent/10 text-foreground" 
                        : "bg-secondary text-foreground"
                    }`}>
                      <p className="break-words">{msg.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input (only show if chat started) */}
          {hasStartedChat && (
            <div className="border-t border-border p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border-border"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={!message.trim()}
                  className="flex-shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-muted-foreground">
                We typically respond within a few minutes
              </p>
            </div>
          )}
        </Card>
      )}
    </>
  );
}