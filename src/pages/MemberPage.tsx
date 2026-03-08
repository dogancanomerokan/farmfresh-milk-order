import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Lock, Gift, ClipboardList } from "lucide-react";

const MemberPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 container mx-auto px-4 min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Member Area
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Sign up to become a member and enjoy exclusive benefits like special offers, order tracking, and more.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-10 text-left">
            <div className="bg-card rounded-xl p-5 flex gap-4 items-start" style={{ boxShadow: 'var(--shadow-card)' }}>
              <Gift className="h-6 w-6 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Special Offers</h3>
                <p className="text-muted-foreground text-xs mt-1">Exclusive discounts for members only.</p>
              </div>
            </div>
            <div className="bg-card rounded-xl p-5 flex gap-4 items-start" style={{ boxShadow: 'var(--shadow-card)' }}>
              <ClipboardList className="h-6 w-6 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Order History</h3>
                <p className="text-muted-foreground text-xs mt-1">View and track all your past orders.</p>
              </div>
            </div>
          </div>
          <Button size="lg" className="px-10 py-6 text-base font-semibold" disabled>
            Coming Soon
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Member login will be available soon.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberPage;
