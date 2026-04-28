import { useOutletContext } from "react-router";
import { LiveChat } from "./LiveChat";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function LiveChatPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-16">
      <LiveChat onNavigate={onNavigate} language={language} />
    </div>
  );
}
