import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const HomepageNoticeBanner = () => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [hideBanner, setHideBanner] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadBannerData = async () => {
    try {
      const { data: announcementData, error: announcementError } = await supabase
  .from("announcements")
  .select("*")
  .eq("is_active", true)
  .eq("show_on_homepage", true)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

      if (announcementError) {
        console.error("Duyuru banner hatası:", announcementError);
      }

      const { data: campaignData, error: campaignError } = await supabase
  .from("campaigns")
  .select("*")
  .eq("is_active", true)
  .eq("show_on_homepage", true)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

      if (campaignError) {
        console.error("Kampanya banner hatası:", campaignError);
      }

      setAnnouncement(announcementData || null);
      setCampaign(campaignData || null);

      console.log("HOMEPAGE BANNER DATA:", {
        announcement: announcementData,
        campaign: campaignData,
      });
    } catch (err) {
      console.error("Banner verileri yüklenemedi:", err);
      setAnnouncement(null);
      setCampaign(null);
    }
  };

  useEffect(() => {
    loadBannerData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBannerData();
      }
    };

    window.addEventListener("focus", loadBannerData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", loadBannerData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  if (hideBanner) return null;
  if (!announcement && !campaign) return null;

  return (
    <>
      <div className="block lg:hidden fixed left-4 right-4 top-[72vh] z-50 [@media(orientation:landscape)]:hidden">
        <div className="rounded-2xl border border-white/20 bg-background/50 backdrop-blur-md shadow-md p-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🥛</span>

            <div className="space-y-1">
              {campaign && (
                <>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Bu Ay
                  </p>

                  <p className="text-sm font-medium text-foreground">
                    {campaign.homepage_text || campaign.title}
                  </p>
                </>
              )}

              {announcement && (
                <p className="text-xs text-muted-foreground">
                  {announcement.content}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <div className="w-[260px] rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
          {announcement && (
            <div className={campaign ? "mb-4" : ""}>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Duyuru
              </p>

              <p className="text-sm text-foreground">
                {announcement.content}
              </p>
            </div>
          )}

          {campaign && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Bu Ay
              </p>

              <p className="text-sm font-medium text-foreground">
                {campaign.homepage_text || campaign.title}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Detaylar üye panelinde
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomepageNoticeBanner;
