import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const HomepageNoticeBanner = () => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [hideBanner, setHideBanner] = useState(false);

  // Banner verilerini yükle
  useEffect(() => {
    const loadBannerData = async () => {
      try {
        // Aktif duyuru
        const { data: announcementData } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .eq("show_on_homepage", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Aktif kampanya
        const { data: campaignData } = await supabase
          .from("campaigns")
          .select("*")
          .eq("is_active", true)
          .eq("show_on_homepage", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setAnnouncement(announcementData || null);
        setCampaign(campaignData || null);
      } catch (err) {
        console.error("Banner verileri yüklenemedi:", err);
      }
    };

    loadBannerData();
  }, []);

  // Mobilde footer yaklaşınca banner gizle
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;

      const footerTop = footer.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (window.innerWidth < 1024) {
        setHideBanner(footerTop < windowHeight + 80);
      } else {
        setHideBanner(false);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);



  // Mobilde footer üstüne çıkmasın
  if (hideBanner) return null;

  return (
    <>
      {/* Mobil */}
      <div className="block lg:hidden fixed left-4 right-4 top-[64vh] z-50 [@media(orientation:landscape)]:hidden">
        <div className="rounded-2xl border border-white/20 bg-background/50 backdrop-blur-md shadow-md p-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🥛</span>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Bu Ay
              </p>

              <p className="text-sm font-medium text-foreground">
                {campaign?.homepage_text ||
                  "Aktif kampanya bulunmamaktadır."}
              </p>

              <p className="text-xs text-muted-foreground">
                {announcement?.content ||
                  "Detaylar üye panelinde görüntülenebilir."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <div className="w-[260px] rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Duyuru
            </p>

            <p className="text-sm text-foreground">
              {announcement?.content ||
                "Duyuru bulunmamaktadır."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Bu Ay
            </p>

            <p className="text-sm font-medium text-foreground">
              {campaign?.homepage_text ||
                "Aktif kampanya bulunmamaktadır."}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Detaylar üye panelinde
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomepageNoticeBanner;
