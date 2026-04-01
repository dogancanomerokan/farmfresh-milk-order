import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPwRepeat, setShowPwRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedPassword = String(password || "").trim();
    const normalizedPasswordRepeat = String(passwordRepeat || "").trim();

    if (!normalizedPassword || !normalizedPasswordRepeat) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (normalizedPassword !== normalizedPasswordRepeat) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: normalizedPassword,
      });

      if (error) {
        throw error;
      }

      toast.success("Şifreniz başarıyla güncellendi");
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.message || "Şifre güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 px-4">
        <div className="mx-auto w-full max-w-md">
          <div
            className="w-full rounded-2xl bg-card p-6 sm:p-8"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>

              <h1
                className="text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Yeni Şifre Belirle
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Yeni şifrenizi girin ve hesabınıza tekrar giriş yapın
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="new-password-repeat">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="new-password-repeat"
                    type={showPwRepeat ? "text" : "password"}
                    placeholder="Şifrenizi tekrar girin"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwRepeat(!showPwRepeat)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwRepeat ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Şifre güncelleniyor..." : "Şifreyi Güncelle"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
