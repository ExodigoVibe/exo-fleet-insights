import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import fleetBackground from "@/assets/fleet-background.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleAzureLogin = async () => {
    try {
      setIsLoading(true);

      // Get the auth URL from the edge function
      const { data, error } = await supabase.functions.invoke("azure-sso", {
        method: "GET",
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Azure login
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Azure login error:", error);
      toast.error("Failed to initiate Azure login");
      setIsLoading(false);
    }
  };

  const handleBasicLogin = async () => {
    if (!email) {
      toast.error("Please enter an email");
      return;
    }

    setIsLoading(true);
    
    // Determine role based on email
    let role = "employee";
    if (email === "admin@admin.com") {
      role = "admin";
    } else if (email === "user@user.com") {
      role = "employee";
    }

    // Create mock user object
    const mockUser = {
      id: email === "admin@admin.com" ? "admin-id" : "user-id",
      email: email,
      full_name: email === "admin@admin.com" ? "Admin User" : "Test User"
    };

    // Store in localStorage
    localStorage.setItem("azureUser", JSON.stringify(mockUser));
    localStorage.setItem("userRole", role);

    toast.success(`Logged in as ${role}`);
    navigate("/");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${fleetBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/95" style={{ background: 'transparent' }}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Fleet Usage Analytics</CardTitle>
          <CardDescription className="text-center text-white">Sign in to access the project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleAzureLogin} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              "Connecting..."
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="none">
                  <path d="M0 0h10.931v10.931H0z" fill="#f35325" />
                  <path d="M12.069 0H23v10.931H12.069z" fill="#81bc06" />
                  <path d="M0 12.069h10.931V23H0z" fill="#05a6f0" />
                  <path d="M12.069 12.069H23V23H12.069z" fill="#ffba08" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/95 px-2 text-white">Or for testing</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter email (admin@admin.com or user@user.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              disabled={isLoading}
            />
            <Button onClick={handleBasicLogin} disabled={isLoading} variant="outline" className="w-full" size="lg">
              Sign in with Basic Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
