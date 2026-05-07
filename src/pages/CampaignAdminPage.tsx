import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CampaignAdminPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Kampanya Yönetimi
          </h1>

          <p className="text-muted-foreground mt-2">
            Kampanya, duyuru, VIP segment ve sadakat sistemi yönetimi
          </p>
        </div>

        {/* Şimdilik boş alan */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <p className="text-muted-foreground">
            Kampanya yönetim modülü hazırlanıyor...
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CampaignAdminPage;
