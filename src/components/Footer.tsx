import { Milk } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Milk className="h-6 w-6" />
            <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Sade Süt</span>
          </div>
          <p className="text-primary-foreground/70 text-sm text-center">
            © {new Date().getFullYear()} Sade Süt. Çiftlikten taze, her gün kapınızda.
          </p>
        </div>
      </div>


      <div>
  <h3 className="text-sm font-semibold text-foreground mb-3">
    İletişim
  </h3>

  <div className="space-y-2 text-sm text-muted-foreground">

    <p>
      <a
        href="https://maps.google.com/?q=Mimar Sinan Mahallesi, Özgürlük Caddesi, 7087. Sokak No7/A"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors"
      >
        Mimar Sinan Mahallesi, Özgürlük Caddesi, 7087. Sokak No7/A
      </a>
    </p>

    <p>
      <a
        href="tel:+905443074564"
        className="hover:text-primary transition-colors"
      >
        +90 544 307 45 64
      </a>
    </p>

    <p>
      <a
        href="mailto:Sutonline@sadesut.com"
        className="hover:text-primary transition-colors"
      >
        Sutonline@sadesut.com
      </a>
    </p>

  </div>
</div>
    </footer>
  );
};

export default Footer;
