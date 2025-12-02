import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("Azure auth error:", error);
        toast.error("Authentication failed");
        navigate("/login");
        return;
      }

      if (!code) {
        toast.error("No authorization code received");
        navigate("/login");
        return;
      }

      try {
        // Exchange code for user info
        const { data, error: functionError } = await supabase.functions.invoke("azure-sso", {
          method: "POST",
          body: { code },
        });

        if (functionError) throw functionError;

        if (data?.user && data?.hashedToken) {
          // Sign in to Supabase using the hashed token
          const { error: signInError } = await supabase.auth.verifyOtp({
            token_hash: data.hashedToken,
            type: 'magiclink',
          });

          if (signInError) {
            console.error("Supabase sign in error:", signInError);
            throw signInError;
          }

          // Store user info in localStorage
          localStorage.setItem("azureUser", JSON.stringify(data.user));
          localStorage.setItem("azureAccessToken", data.accessToken);
          localStorage.setItem("userRole", data.user.role);

          toast.success(`Welcome, ${data.user.name}!`);
          navigate("/");
        } else {
          throw new Error("No user data or session token received");
        }
      } catch (error) {
        console.error("Token exchange error:", error);
        toast.error("Failed to complete authentication");
        navigate("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">{isProcessing ? "Completing sign in..." : "Redirecting..."}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
