import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Milk className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Sade Süt
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Ana Sayfa
          </Link>
          <Link to="/order" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Sipariş Ver
          </Link>
          <Link to="/member" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Üyeler
          </Link>
          <Link to="/order">
            <Button variant="default" size="sm">Süt Rezerve Et</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-foreground py-2">
            Ana Sayfa
          </Link>
          <Link to="/order" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-foreground py-2">
            Sipariş Ver
          </Link>
          <Link to="/member" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-foreground py-2">
            Üyeler
          </Link>
          <Link to="/order" onClick={() => setIsOpen(false)}>
            <Button variant="default" size="sm" className="w-full">Süt Rezerve Et</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;