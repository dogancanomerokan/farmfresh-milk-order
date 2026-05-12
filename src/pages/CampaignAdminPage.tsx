import { useEffect, useState } from "react";
import { Megaphone, Gift } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  homepage_text: string | null;
  created_at: string;
  campaign_rule_types?: {
    name: string;
    code: string;
  } | null;
  campaign_conditions?: {
    id: string;
    condition_key: string;
    condition_value: string;
  }[];
  campaign_rewards?: {
    id: string;
    reward_type: string;
    reward_value: number;
    reward_unit: string | null;
  }[];
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  show_on_homepage: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const CampaignAdminPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

const [editForm, setEditForm] = useState({
  targetVolume: "",
  rewardValue: "",
  homepageText: "",
});

  const formatDate = (value: string | null) => {
    if (!value) return "Süresiz";
    return new Date(value).toLocaleDateString("tr-TR");
  };

  const loadData = async () => {
    setLoading(true);

    try {
     const { data: campaignData, error: campaignError } = await supabase
  .from("campaigns")
  .select(
    `
    *,
    campaign_rule_types (
      name,
      code
    ),
    campaign_conditions (
      id,
      condition_key,
      condition_value
    ),
    campaign_rewards (
      id,
      reward_type,
      reward_value,
      reward_unit
    )
  `
  )
  .order("created_at", { ascending: false });

      if (campaignError) throw campaignError;

      const { data: announcementData, error: announcementError } =
        await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });

      if (announcementError) throw announcementError;

      setCampaigns((campaignData || []) as Campaign[]);
      setAnnouncements((announcementData || []) as Announcement[]);
    } catch (error: any) {
      console.error("Kampanya yönetimi verileri alınamadı:", error);
      toast.error(error.message || "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCampaignActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("campaigns")
      .update({ is_active: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Kampanya durumu güncellenemedi");
      return;
    }

    toast.success("Kampanya durumu güncellendi");
    await loadData();
  };

  const toggleCampaignHomepage = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("campaigns")
      .update({ show_on_homepage: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Ana sayfa görünürlüğü güncellenemedi");
      return;
    }

    toast.success("Ana sayfa görünürlüğü güncellendi");
    await loadData();
  };

  const toggleAnnouncementActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Duyuru durumu güncellenemedi");
      return;
    }

    toast.success("Duyuru durumu güncellendi");
    await loadData();
  };

  const toggleAnnouncementHomepage = async (
    id: string,
    currentValue: boolean
  ) => {
    const { error } = await supabase
      .from("announcements")
      .update({ show_on_homepage: !currentValue })
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Ana sayfa görünürlüğü güncellenemedi");
      return;
    }

    toast.success("Ana sayfa görünürlüğü güncellendi");
    await loadData();
  };

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

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-muted-foreground">Veriler yükleniyor...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Kampanyalar
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tanımlı kampanyaların durumlarını görüntüleyin ve yönetin.
                  </p>
                </div>
              </div>

              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz kampanya bulunmuyor.
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {campaign.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-1">
                            {campaign.description || "Açıklama yok"}
                          </p>

                          <p className="text-xs text-muted-foreground mt-2">
                            Kural:{" "}
                            {campaign.campaign_rule_types?.name ||
                              "Kural tipi bulunamadı"}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            Tarih: {formatDate(campaign.start_date)} -{" "}
                            {formatDate(campaign.end_date)}
                          </p>

                          {campaign.homepage_text && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ana sayfa metni: {campaign.homepage_text}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              campaign.is_active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {campaign.is_active ? "Aktif" : "Pasif"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              campaign.show_on_homepage
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {campaign.show_on_homepage
                              ? "Ana sayfada"
                              : "Ana sayfada değil"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleCampaignActive(
                                campaign.id,
                                campaign.is_active
                              )
                            }
                            className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {campaign.is_active ? "Pasif Yap" : "Aktif Yap"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleCampaignHomepage(
                                campaign.id,
                                campaign.show_on_homepage
                              )
                            }
                            className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {campaign.show_on_homepage
                              ? "Ana Sayfadan Kaldır"
                              : "Ana Sayfada Göster"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Duyurular
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ana sayfada gösterilecek duyuruları görüntüleyin ve yönetin.
                  </p>
                </div>
              </div>

              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz duyuru bulunmuyor.
                </p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {announcement.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-1">
                            {announcement.content}
                          </p>

                          <p className="text-xs text-muted-foreground mt-2">
                            Tarih: {formatDate(announcement.start_date)} -{" "}
                            {formatDate(announcement.end_date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              announcement.is_active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {announcement.is_active ? "Aktif" : "Pasif"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              announcement.show_on_homepage
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {announcement.show_on_homepage
                              ? "Ana sayfada"
                              : "Ana sayfada değil"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAnnouncementActive(
                                announcement.id,
                                announcement.is_active
                              )
                            }
                            className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {announcement.is_active ? "Pasif Yap" : "Aktif Yap"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAnnouncementHomepage(
                                announcement.id,
                                announcement.show_on_homepage
                              )
                            }
                            className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {announcement.show_on_homepage
                              ? "Ana Sayfadan Kaldır"
                              : "Ana Sayfada Göster"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CampaignAdminPage;
