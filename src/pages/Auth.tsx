import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAzureLogin = async () => {
    // try {
    //   setIsLoading(true);

    //   // Get the auth URL from the edge function
    //   const { data, error } = await supabase.functions.invoke('azure-sso', {
    //     method: 'GET',
    //   });

    //   if (error) throw error;

    //   if (data?.authUrl) {
    //     // Redirect to Azure login
    //     window.location.href = data.authUrl;
    //   }
    // } catch (error) {
    //   console.error('Azure login error:', error);
    //   toast.error('Failed to initiate Azure login');
    //   setIsLoading(false);
    // }
    avigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">Sign in to access the Fleet Usage Dashboard</CardDescription>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
