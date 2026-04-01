import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Supabase URL'den session'ı alır
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error.message);
        navigate("/login");
        return;
      }

      if (data?.session) {
        // kullanıcı giriş yaptıysa
        navigate("/member", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Yönlendiriliyorsunuz...</p>
    </div>
  );
};

export default AuthCallbackPage;
