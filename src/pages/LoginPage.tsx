import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/member", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const getNormalizedEmail = () => String(email || "").trim().toLowerCase();

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleForgotPassword = async () => {
    setError("");

    const normalizedEmail = getNormalizedEmail();

    if (!isValidEmail(normalizedEmail)) {
      setError("Lütfen geçerli bir e-posta adresi girin");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: "https://www.sadesut.com/reset-password",
    });

    if (error) {
      setError(error.message || "Şifre sıfırlama bağlantısı gönderilemedi");
      return;
    }

    toast.success("Şifre sıfırlama linki e-posta adresinize gönderildi");
  };

  const handleResendVerification = async () => {
    setError("");

    const normalizedEmail = getNormalizedEmail();

    if (!isValidEmail(normalizedEmail)) {
      setError("Lütfen geçerli bir e-posta adresi girin");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: "https://www.sadesut.com/auth/callback",
      },
    });

    if (error) {
      setError(error.message || "Doğrulama e-postası tekrar gönderilemedi");
      return;
    }

    toast.success("Doğrulama e-postası tekrar gönderildi");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = getNormalizedEmail();

    if (!isValidEmail(normalizedEmail)) {
      setError("Geçerli bir e-posta adresi giriniz");
      return;
    }

    if (!password.trim()) {
      setError("Şifre alanı boş bırakılamaz");
      return;
    }

    setLoading(true);

    try {
      await login(normalizedEmail, password);
      navigate("/member", { replace: true });
    } catch (err: any) {
      setError(err.message || "Giriş sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center min-h-[80vh] px-4">
          <p>Yükleniyor...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 flex items-center justify-center min-h-[80vh] px-4">
        <div
          className="w-full max-w-md bg-card rounded-2xl p-6 sm:p-8"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-7 w-7 text-primary" />
            </div>

            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Giriş Yap
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Şifre</Label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs sm:text-sm text-primary font-medium hover:underline"
                >
                  Şifremi unuttum
                </button>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleResendVerification}
                className="text-xs sm:text-sm text-primary font-medium hover:underline text-left"
              >
                Doğrulama mailini tekrar gönder
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hesabınız yok mu?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
