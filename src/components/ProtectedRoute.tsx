import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const azureUser = localStorage.getItem("azureUser");
      
      if (!azureUser) {
        navigate("/login");
        return;
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate]);

  return <>{children}</>;
}
