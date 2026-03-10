import { Milk } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo + İletişim */}
          <div className="flex items-start gap-8">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Milk className="h-6 w-6" />
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Sade Süt
              </span>
            </div>

            {/* İletişim */}
            <div className="text-xs text-primary-foreground/80 grid grid-cols-[70px_1fr] gap-x-2 gap-y-1">

              <span className="font-medium">Adres</span>
              <span>
                : Mimar Sinan Mahallesi, Özgürlük Caddesi
                <br />
                7087. Sokak No7/A
              </span>

              <span className="font-medium">Telefon</span>
              <span>
                : <a href="tel:+905443074564" className="hover:underline">
                    +90 544 307 45 64
                  </a>
              </span>

              <span className="font-medium">E-Posta</span>
              <span>
                : <a href="mailto:Sutonline@sadesut.com" className="hover:underline">
                    Sutonline@sadesut.com
                  </a>
              </span>

            </div>

          </div>

          {/* Copyright */}
          <p className="text-primary-foreground/70 text-sm text-center">
            © {new Date().getFullYear()} Sade Süt. Çiftlikten taze, her gün kapınızda.
          </p>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
