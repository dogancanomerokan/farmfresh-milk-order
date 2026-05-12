import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Campaign = {
  id: string;
  title: string;
  homepage_text: string | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
};

const HomepageNoticeBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hideBanner, setHideBanner] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);

  const loadBannerData = async () => {
    try {
      const { data: announcementData, error: announcementError } =
        await supabase
          .from("announcements")
          .select("id, title, content")
          .eq("is_active", true)
          .eq("show_on_homepage", true)
          .order("created_at", { ascending: false })
          .limit(2);

      if (announcementError) {
        console.error("Duyuru banner hatası:", announcementError);
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, title, homepage_text")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (campaignError) {
        console.error("Kampanya banner hatası:", campaignError);
      }

      setAnnouncements((announcementData || []) as Announcement[]);
      setCampaigns((campaignData || []) as Campaign[]);

      console.log("HOMEPAGE BANNER DATA:", {
        announcements: announcementData,
        campaigns: campaignData,
      });
    } catch (err) {
      console.error("Banner verileri yüklenemedi:", err);
      setAnnouncements([]);
      setCampaigns([]);
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

  const mobileItems = [
    ...campaigns.map((campaign) => ({
      type: "campaign",
      text: campaign.homepage_text || campaign.title,
    })),
    ...announcements.map((announcement) => ({
      type: "announcement",
      text: announcement.content,
    })),
  ];

  useEffect(() => {
    if (mobileItems.length <= 1) return;

    const interval = window.setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % mobileItems.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [mobileItems.length]);

  if (hideBanner) return null;
  if (campaigns.length === 0 && announcements.length === 0) return null;

  const activeMobileItem = mobileItems[mobileIndex];

  return (
    <>
      {/* Mobil */}
      {activeMobileItem && (
        <div className="block lg:hidden fixed left-4 right-4 top-[72vh] z-50 [@media(orientation:landscape)]:hidden">
         <div
  key={`${activeMobileItem.type}-${mobileIndex}`}
  className="rounded-2xl border border-white/20 bg-background/60 backdrop-blur-md shadow-md p-3 animate-in fade-in duration-700"
>
            <div className="flex items-start gap-3">
              <span className="text-lg">
                {activeMobileItem.type === "campaign" ? "🎁" : "📢"}
              </span>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {activeMobileItem.type === "campaign" ? "Bu Ay" : "Duyuru"}
                </p>

                <p className="text-sm font-medium text-foreground">
                  {activeMobileItem.text}
                </p>

                {mobileItems.length > 1 && (
                  <p className="text-[11px] text-muted-foreground">
                    {mobileIndex + 1} / {mobileItems.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <div className="w-[280px] rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm space-y-4">
          {announcements.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Duyurular
              </p>

              <div className="space-y-2">
                {announcements.map((announcement) => (
                  <p key={announcement.id} className="text-sm text-foreground">
                    • {announcement.content}
                  </p>
                ))}
              </div>
            </div>
          )}

          {campaigns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Bu Ay
              </p>

              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <p
                    key={campaign.id}
                    className="text-sm font-medium text-foreground"
                  >
                    • {campaign.homepage_text || campaign.title}
                  </p>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
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
