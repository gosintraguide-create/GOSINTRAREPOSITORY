import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  MessageCircle, 
  Package, 
  UserCog, 
  DollarSign, 
  Users, 
  Settings 
} from 'lucide-react';

interface AdminTabsMobileProps {
  children: React.ReactNode;
  conversations: any[];
}

export function AdminTabsMobile({ children, conversations }: AdminTabsMobileProps) {
  const [activeTab, setActiveTab] = useState("metrics");

  const tabs = [
    { value: "metrics", icon: BarChart3, label: "Analytics" },
    { value: "messages", icon: MessageCircle, label: "Messages", unread: conversations.filter(c => c.unreadByAdmin > 0).length },
    { value: "bookings", icon: Package, label: "Bookings" },
    { value: "drivers", icon: UserCog, label: "Drivers" },
    { value: "pricing", icon: DollarSign, label: "Pricing" },
    { value: "availability", icon: Users, label: "Availability" },
    { value: "settings", icon: Settings, label: "Settings" },
    { value: "content", icon: Settings, label: "Content" },
    { value: "blog", icon: Package, label: "Blog" },
    { value: "seo", icon: Settings, label: "SEO" },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="overflow-x-auto mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-10">
          {tabs.map(({ value, icon: Icon, label, unread }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2 relative">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className={activeTab === value ? "" : "hidden sm:inline"}>{label}</span>
              {unread && unread > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unread}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
