import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { DriverLoginPage } from "./DriverLoginPage";
import { DriverDashboard } from "./DriverDashboard";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function DriverPortalPage() {
  const context = useOutletContext<OutletContext>();
  const [driver, setDriver] = useState<any>(null);
  const [token, setToken] = useState<string>("");

  // Check for existing session - using localStorage to persist between sessions
  useEffect(() => {
    const savedDriver = localStorage.getItem("driver");
    const savedToken = localStorage.getItem("driverToken");
    
    if (savedDriver && savedToken) {
      setDriver(JSON.parse(savedDriver));
      setToken(savedToken);
    }
  }, []);

  const handleLoginSuccess = (driverData: any, authToken: string) => {
    setDriver(driverData);
    setToken(authToken);
    localStorage.setItem("driver", JSON.stringify(driverData));
    localStorage.setItem("driverToken", authToken);
  };

  const handleLogout = () => {
    setDriver(null);
    setToken("");
    localStorage.removeItem("driver");
    localStorage.removeItem("driverToken");
  };

  if (!driver || !token) {
    return <DriverLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DriverDashboard
      driver={driver}
      token={token}
      onLogout={handleLogout}
    />
  );
}