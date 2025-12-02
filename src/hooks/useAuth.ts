import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const azureUserStr = localStorage.getItem("azureUser");
    const userRole = localStorage.getItem("userRole");
    
    if (azureUserStr && userRole) {
      const azureUser = JSON.parse(azureUserStr);
      setUser({
        id: azureUser.id,
        email: azureUser.email,
        full_name: azureUser.full_name,
        role: userRole,
      });
    }
    
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("azureUser");
    localStorage.removeItem("azureAccessToken");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";
  const isCoordinator = user?.role === "coordinator";
  const isEmployee = user?.role === "employee";
  const hasAdminAccess = isAdmin || isCoordinator;

  return {
    user,
    isLoading,
    logout,
    isAdmin,
    isCoordinator,
    isEmployee,
    hasAdminAccess,
  };
}
