import { Milk } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo + İletişim */}
          <div className="flex flex-col md:flex-row items-center gap-4">

            <div className="flex items-center gap-2">
              <Milk className="h-6 w-6" />
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Sade Süt
              </span>
            </div>

            <div className="text-xs text-primary-foreground/80 text-center md:text-left leading-relaxed">
              <p>
                Mimar Sinan Mahallesi, Özgürlük Caddesi, 7087. Sokak No7/A
              </p>

              <p>
                <a href="tel:+905443074564" className="hover:underline">
                  +90 544 307 45 64
                </a>
                {" · "}
                <a
                  href="mailto:Sutonline@sadesut.com"
                  className="hover:underline"
                >
                  Sutonline@sadesut.com
                </a>
              </p>
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
