import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { toast } from "sonner@2.0.3";
import { getSession } from "../lib/sessionManager";
import { getComponentTranslation } from "../lib/translations/component-translations";

interface LiveChatWidgetProps {
  language?: string;
}

interface Message {
  id: string;
  sender: "customer" | "admin";
  senderName: string;
  message: string;
  timestamp: string;
}

export function LiveChatWidget({ language = "en" }: LiveChatWidgetProps) {
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
  const t = getComponentTranslation(language);

  useEffect(() => {
    setContent(loadContent());
    
    // Check for logged-in user session
    const session = getSession();
    if (session) {
      setCustomerName(session.customerName);
      setCustomerEmail(session.customerEmail);
      
      // Auto-start chat for logged-in users
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
          setConversationId(result.conversationId);
          setHasStartedChat(true);
          localStorage.setItem("chatConversationId", result.conversationId);
          
          if (result.resumed) {
            loadMessages(result.conversationId);
          }
        }
      }
    } catch (error) {
      console.error("Error starting chat for logged-in user:", error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/messages?conversationId=${convId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.messages) {
          setMessages(result.messages);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient(projectId, publicAnonKey);
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_3bd0ade8',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMessage: Message = {
            id: payload.new.id,
            sender: payload.new.sender,
            senderName: payload.new.sender_name,
            message: payload.new.message,
            timestamp: payload.new.created_at,
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const startChat = async () => {
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
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.conversationId) {
          setConversationId(result.conversationId);
          setHasStartedChat(true);
          localStorage.setItem("chatConversationId", result.conversationId);
          
          if (result.resumed && result.messages) {
            setMessages(result.messages);
          }
        }
      } else {
        toast.error("Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    const messageToSend = message.trim();
    setMessage("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/chat/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            message: messageToSend,
            senderName: customerName,
          }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to send message");
        setMessage(messageToSend);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setMessage(messageToSend);
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = content.company?.whatsappNumber || "351924120161";
    const message = encodeURIComponent("Hello! I'd like to inquire about your services.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleGoBack = () => {
    setHasStartedChat(false);
    toast.info(t.liveChat.conversationSaved);
  };

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
        <Card ref={chatWindowRef} className="fixed bottom-20 right-4 z-40 flex w-full max-w-[calc(100vw-2rem)] sm:max-w-sm flex-col overflow-hidden border-border bg-card shadow-2xl sm:bottom-24 sm:right-6 sm:w-96">
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
                <h3 className="text-accent-foreground">{t.liveChat.liveSupport}</h3>
                <p className="text-xs text-accent-foreground/80">{t.liveChat.hereToHelp}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-accent-foreground transition-colors hover:bg-accent-foreground/10"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages or Start Form */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ maxHeight: "min(400px, 50vh)" }}>
            {!hasStartedChat ? (
              /* Start Chat Form */
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-sm text-foreground">
                    {t.liveChat.welcomeMessage}
                  </p>
                </div>

                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851]"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {t.liveChat.chatOnWhatsApp}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">{t.liveChat.orStartWebChat}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.liveChat.enterName}
                    className="border-border"
                    readOnly={!!getSession()}
                  />

                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={t.liveChat.enterEmail}
                    className="border-border"
                    readOnly={!!getSession()}
                  />

                  <Button
                    onClick={startChat}
                    disabled={loading || !customerName.trim() || !customerEmail.trim()}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? t.liveChat.starting : t.liveChat.startWebChat}
                  </Button>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.sender === "customer"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input (only when chat is started) */}
          {hasStartedChat && (
            <div className="border-t border-border p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.liveChat.enterMessage}
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
              <p className="mt-2 text-center text-xs text-muted-foreground">
                We typically respond within a few minutes
              </p>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
