import { useState, useEffect } from "react";
import { DriverLoginPage } from "./DriverLoginPage";
import { DriverDashboard } from "./DriverDashboard";

export function DriverPortalPage() {
  const [driver, setDriver] = useState<any>(null);
  const [token, setToken] = useState<string>("");

  // Check for existing session
  useEffect(() => {
    const savedDriver = sessionStorage.getItem("driver");
    const savedToken = sessionStorage.getItem("driverToken");
    
    if (savedDriver && savedToken) {
      setDriver(JSON.parse(savedDriver));
      setToken(savedToken);
    }
  }, []);

  const handleLoginSuccess = (driverData: any, authToken: string) => {
    setDriver(driverData);
    setToken(authToken);
    sessionStorage.setItem("driver", JSON.stringify(driverData));
    sessionStorage.setItem("driverToken", authToken);
  };

  const handleLogout = () => {
    setDriver(null);
    setToken("");
    sessionStorage.removeItem("driver");
    sessionStorage.removeItem("driverToken");
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