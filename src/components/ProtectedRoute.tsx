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
    // const checkAuth = () => {
    //   const azureUser = localStorage.getItem("azureUser");
    //   const userRole = localStorage.getItem("userRole");
    //   const currentPath = window.location.pathname;

    //   if (!azureUser) {
    //     navigate("/login");
    //     return;
    //   }

    //   // Employee restricted pages
    //   const employeeRestrictedPages = [
    //     "/vehicle-fleet",
    //     "/employees",
    //     "/roles",
    //     "/form-templates",
    //   ];

    //   // Check if employee is trying to access restricted page
    //   if (userRole === "employee" && employeeRestrictedPages.includes(currentPath)) {
    //     navigate("/");
    //     return;
    //   }

    //   setIsChecking(false);
    // };

    // checkAuth();
    setIsChecking(false);
    navigate("/");
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
