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
    </footer>
  );
};

export default Footer;