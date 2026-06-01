import { useEffect, useState } from "react";
import { Megaphone, Gift, Plus } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

type RuleType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

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
  campaign_rule_types?: { name: string; code: string } | null;
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

const weekdayOptions = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" },
];

const emptyCreateForm = {
  title: "",
  description: "",
  ruleTypeId: "",
  homepageText: "",
  startDate: "",
  endDate: "",
  weekday: "",
  discountPercent: "",
  targetVolume: "",
  rewardValue: "",
};

const CampaignAdminPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ruleTypes, setRuleTypes] = useState<RuleType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null
  );

  const [editForm, setEditForm] = useState({
    homepageText: "",
    startDate: "",
    endDate: "",
    weekday: "",
    discountPercent: "",
    targetVolume: "",
    rewardValue: "",
  });

  const formatDate = (value: string | null) => {
    if (!value) return "Süresiz";
    return new Date(value).toLocaleDateString("tr-TR");
  };

  const getCondition = (campaign: Campaign, key: string) =>
    campaign.campaign_conditions?.find(
      (condition) => condition.condition_key === key
    );

  const getFirstReward = (campaign: Campaign) => campaign.campaign_rewards?.[0];

  const selectedCreateRule = ruleTypes.find(
    (rule) => rule.id === createForm.ruleTypeId
  );

  const loadData = async () => {
    setLoading(true);

    try {
      const { data: ruleTypeData, error: ruleTypeError } = await supabase
        .from("campaign_rule_types")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (ruleTypeError) throw ruleTypeError;

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

      setRuleTypes((ruleTypeData || []) as RuleType[]);
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

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
    setShowCreateForm(false);
  };

 const createCampaign = async () => {
  if (creatingCampaign) return;

  setCreatingCampaign(true);

  try {
      const selectedRule = ruleTypes.find(
        (rule) => rule.id === createForm.ruleTypeId
      );

      if (!createForm.title.trim()) {
        toast.error("Kampanya adı zorunludur");
        return;
      }

      if (!selectedRule) {
        toast.error("Kampanya tipi seçilmelidir");
        return;
      }

      if (!createForm.startDate || !createForm.endDate) {
        toast.error("Başlangıç ve bitiş tarihi zorunludur");
        return;
      }

      if (selectedRule.code === "weekday_discount") {
        if (!createForm.weekday) {
          toast.error("Geçerli gün seçilmelidir");
          return;
        }

        if (
          !createForm.discountPercent ||
          Number(createForm.discountPercent) <= 0
        ) {
          toast.error("İndirim oranı geçerli olmalıdır");
          return;
        }
      }

      if (
        selectedRule.code === "monthly_volume_gift" ||
        selectedRule.code === "monthly_volume_reward" ||
        selectedRule.code === "monthly_volume_discount"
      ) {
        if (!createForm.targetVolume || Number(createForm.targetVolume) <= 0) {
          toast.error("Hedef litre geçerli olmalıdır");
          return;
        }

        if (!createForm.rewardValue || Number(createForm.rewardValue) <= 0) {
          toast.error("Ödül değeri geçerli olmalıdır");
          return;
        }
      }

      const { data: createdCampaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          title: createForm.title.trim(),
          description: createForm.description || null,
          rule_type_id: createForm.ruleTypeId,
          start_date: createForm.startDate,
          end_date: createForm.endDate,
          homepage_text: createForm.homepageText || null,
          is_active: true,
          show_on_homepage: false,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      if (selectedRule.code === "weekday_discount") {
        const { error: conditionError } = await supabase
          .from("campaign_conditions")
          .insert({
            campaign_id: createdCampaign.id,
            condition_key: "weekday",
            condition_value: createForm.weekday,
          });

        if (conditionError) throw conditionError;

        const { error: rewardError } = await supabase
          .from("campaign_rewards")
          .insert({
            campaign_id: createdCampaign.id,
            reward_type: "discount_percent",
            reward_value: Number(createForm.discountPercent),
            reward_unit: "percent",
          });

        if (rewardError) throw rewardError;
      }

      if (
        selectedRule.code === "monthly_volume_gift" ||
        selectedRule.code === "monthly_volume_reward"
      ) {
        const { error: conditionError } = await supabase
          .from("campaign_conditions")
          .insert({
            campaign_id: createdCampaign.id,
            condition_key: "monthly_volume_gte",
            condition_value: createForm.targetVolume,
          });

        if (conditionError) throw conditionError;

        const { error: rewardError } = await supabase
          .from("campaign_rewards")
          .insert({
            campaign_id: createdCampaign.id,
            reward_type: "free_liter",
            reward_value: Number(createForm.rewardValue),
            reward_unit: "L",
          });

        if (rewardError) throw rewardError;
      }

      if (selectedRule.code === "monthly_volume_discount") {
        const { error: conditionError } = await supabase
          .from("campaign_conditions")
          .insert({
            campaign_id: createdCampaign.id,
            condition_key: "monthly_volume_gte",
            condition_value: createForm.targetVolume,
          });

        if (conditionError) throw conditionError;

        const { error: rewardError } = await supabase
          .from("campaign_rewards")
          .insert({
            campaign_id: createdCampaign.id,
            reward_type: "discount_amount",
            reward_value: Number(createForm.rewardValue),
            reward_unit: "TRY",
          });

        if (rewardError) throw rewardError;
      }

      toast.success("Kampanya oluşturuldu");
      resetCreateForm();
      await loadData();
    } catch (error: any) {
  console.error("Kampanya oluşturulamadı:", error);
  toast.error(error.message || "Kampanya oluşturulamadı");
} finally {
  setCreatingCampaign(false);
}
  };

  const startEditCampaign = (campaign: Campaign) => {
    const weekdayCondition = getCondition(campaign, "weekday");
    const targetCondition = getCondition(campaign, "monthly_volume_gte");
    const reward = getFirstReward(campaign);

    setEditingCampaignId(campaign.id);
    setEditForm({
      homepageText: campaign.homepage_text || "",
      startDate: campaign.start_date || "",
      endDate: campaign.end_date || "",
      weekday: weekdayCondition?.condition_value || "",
      discountPercent:
        reward?.reward_type === "discount_percent"
          ? String(reward.reward_value)
          : "",
      targetVolume: targetCondition?.condition_value || "",
      rewardValue: reward?.reward_value ? String(reward.reward_value) : "",
    });
  };

  const cancelEditCampaign = () => {
    setEditingCampaignId(null);
    setEditForm({
      homepageText: "",
      startDate: "",
      endDate: "",
      weekday: "",
      discountPercent: "",
      targetVolume: "",
      rewardValue: "",
    });
  };

  const upsertCondition = async (
    campaign: Campaign,
    key: string,
    value: string
  ) => {
    const existingCondition = getCondition(campaign, key);

    if (existingCondition) {
      const { error } = await supabase
        .from("campaign_conditions")
        .update({ condition_value: value })
        .eq("id", existingCondition.id);

      if (error) throw error;
      return;
    }

    const { error } = await supabase.from("campaign_conditions").insert({
      campaign_id: campaign.id,
      condition_key: key,
      condition_value: value,
    });

    if (error) throw error;
  };

  const saveCampaignEdit = async (campaign: Campaign) => {
    try {
      const ruleCode = campaign.campaign_rule_types?.code;
      const reward = getFirstReward(campaign);

      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({
          homepage_text: editForm.homepageText || null,
          start_date: editForm.startDate || null,
          end_date: editForm.endDate || null,
        })
        .eq("id", campaign.id);

      if (campaignError) throw campaignError;

      if (ruleCode === "weekday_discount") {
        const discountPercent = Number(editForm.discountPercent);

        if (!editForm.weekday) {
          toast.error("Geçerli gün seçilmelidir");
          return;
        }

        if (!discountPercent || discountPercent <= 0) {
          toast.error("İndirim oranı geçerli olmalıdır");
          return;
        }

        await upsertCondition(campaign, "weekday", editForm.weekday);

        if (reward) {
          const { error } = await supabase
            .from("campaign_rewards")
            .update({
              reward_type: "discount_percent",
              reward_value: discountPercent,
              reward_unit: "percent",
            })
            .eq("id", reward.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("campaign_rewards").insert({
            campaign_id: campaign.id,
            reward_type: "discount_percent",
            reward_value: discountPercent,
            reward_unit: "percent",
          });

          if (error) throw error;
        }
      }

      if (
        ruleCode === "monthly_volume_gift" ||
        ruleCode === "monthly_volume_reward"
      ) {
        const targetVolume = Number(editForm.targetVolume);
        const rewardValue = Number(editForm.rewardValue);

        if (!targetVolume || targetVolume <= 0) {
          toast.error("Hedef litre geçerli olmalıdır");
          return;
        }

        if (!rewardValue || rewardValue <= 0) {
          toast.error("Hediye litre geçerli olmalıdır");
          return;
        }

        await upsertCondition(
          campaign,
          "monthly_volume_gte",
          String(targetVolume)
        );

        if (reward) {
          const { error } = await supabase
            .from("campaign_rewards")
            .update({
              reward_type: "free_liter",
              reward_value: rewardValue,
              reward_unit: "L",
            })
            .eq("id", reward.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("campaign_rewards").insert({
            campaign_id: campaign.id,
            reward_type: "free_liter",
            reward_value: rewardValue,
            reward_unit: "L",
          });

          if (error) throw error;
        }
      }

      toast.success("Kampanya güncellendi");
      cancelEditCampaign();
      await loadData();
    } catch (error: any) {
      console.error("Kampanya güncellenemedi:", error);
      toast.error(error.message || "Kampanya güncellenemedi");
    }
  };

  const toggleCampaignActive = async (id: string, currentValue: boolean) => {
    const nextActiveValue = !currentValue;

    const updatePayload: {
      is_active: boolean;
      show_on_homepage?: boolean;
    } = {
      is_active: nextActiveValue,
    };

    if (!nextActiveValue) {
      updatePayload.show_on_homepage = false;
    }

    const { error } = await supabase
      .from("campaigns")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      toast.error(error.message || "Kampanya durumu güncellenemedi");
      return;
    }

    toast.success(
      nextActiveValue ? "Kampanya aktif edildi" : "Kampanya pasif yapıldı"
    );

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
    const nextActiveValue = !currentValue;

    const updatePayload: {
      is_active: boolean;
      show_on_homepage?: boolean;
    } = {
      is_active: nextActiveValue,
    };

    if (!nextActiveValue) {
      updatePayload.show_on_homepage = false;
    }

    const { error } = await supabase
      .from("announcements")
      .update(updatePayload)
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
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
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

                <button
                  type="button"
                  onClick={() => setShowCreateForm((prev) => !prev)}
                  className="rounded-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Kampanya
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-5 rounded-xl border border-border bg-background p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Yeni Kampanya Oluştur
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Kampanya Adı
                      </label>
                      <input
                        value={createForm.title}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Kampanya Tipi
                      </label>
                      <select
                        value={createForm.ruleTypeId}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            ruleTypeId: e.target.value,
                            weekday: "",
                            discountPercent: "",
                            targetVolume: "",
                            rewardValue: "",
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Tip seçin</option>
                        {ruleTypes.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        value={createForm.startDate}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={createForm.endDate}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {selectedCreateRule?.code === "weekday_discount" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Geçerli Gün
                          </label>
                          <select
                            value={createForm.weekday}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                weekday: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Gün seçin</option>
                            {weekdayOptions.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            İndirim Oranı (%)
                          </label>
                          <input
                            type="number"
                            value={createForm.discountPercent}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                discountPercent: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </>
                    )}

                    {(selectedCreateRule?.code === "monthly_volume_gift" ||
                      selectedCreateRule?.code === "monthly_volume_reward" ||
                      selectedCreateRule?.code ===
                        "monthly_volume_discount") && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Hedef Litre
                          </label>
                          <input
                            type="number"
                            value={createForm.targetVolume}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                targetVolume: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {selectedCreateRule?.code ===
                            "monthly_volume_discount"
                              ? "İndirim Tutarı (TL)"
                              : "Hediye Litre"}
                          </label>
                          <input
                            type="number"
                            value={createForm.rewardValue}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                rewardValue: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1 md:col-span-3">
                      <label className="text-xs font-medium text-muted-foreground">
                        Açıklama
                      </label>
                      <input
                        value={createForm.description}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label className="text-xs font-medium text-muted-foreground">
                        Ana Sayfa Metni
                      </label>
                      <input
                        value={createForm.homepageText}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            homepageText: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={resetCreateForm}
                      className="rounded-full px-4 py-2 text-xs font-medium bg-muted text-foreground"
                    >
                      Vazgeç
                    </button>

                    <button
                      type="button"
                      onClick={createCampaign}
                      className="rounded-full px-4 py-2 text-xs font-medium bg-primary text-primary-foreground"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}

              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz kampanya bulunmuyor.
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => {
                    const ruleCode = campaign.campaign_rule_types?.code;
                    const weekdayCondition = getCondition(campaign, "weekday");
                    const targetCondition = getCondition(
                      campaign,
                      "monthly_volume_gte"
                    );
                    const reward = getFirstReward(campaign);

                    return (
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

                            {ruleCode === "weekday_discount" && (
                              <>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Gün:{" "}
                                  {weekdayOptions.find(
                                    (day) =>
                                      day.value ===
                                      weekdayCondition?.condition_value
                                  )?.label || "Tanımsız"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  İndirim: %{reward?.reward_value || 0}
                                </p>
                              </>
                            )}

                            {(ruleCode === "monthly_volume_gift" ||
                              ruleCode === "monthly_volume_reward") && (
                              <>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Hedef litre:{" "}
                                  {targetCondition?.condition_value || "-"} L
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Hediye: {reward?.reward_value || 0}{" "}
                                  {reward?.reward_unit || "L"}
                                </p>
                              </>
                            )}

                            {ruleCode === "monthly_volume_discount" && (
                              <>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Hedef litre:{" "}
                                  {targetCondition?.condition_value || "-"} L
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  İndirim: {reward?.reward_value || 0} TL
                                </p>
                              </>
                            )}

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
                              disabled={!campaign.is_active}
                              onClick={() =>
                                toggleCampaignHomepage(
                                  campaign.id,
                                  campaign.show_on_homepage
                                )
                              }
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                !campaign.is_active
                                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                  : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"
                              }`}
                            >
                              {campaign.show_on_homepage
                                ? "Ana Sayfadan Kaldır"
                                : "Ana Sayfada Göster"}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditCampaign(campaign)}
                              className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              Düzenle
                            </button>
                          </div>
                        </div>

                        {editingCampaignId === campaign.id && (
                          <div className="mt-4 rounded-xl border border-border bg-background p-4 space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              {ruleCode === "weekday_discount" && (
                                <>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Geçerli Gün
                                    </label>
                                    <select
                                      value={editForm.weekday}
                                      onChange={(e) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          weekday: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    >
                                      <option value="">Gün seçin</option>
                                      {weekdayOptions.map((day) => (
                                        <option
                                          key={day.value}
                                          value={day.value}
                                        >
                                          {day.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      İndirim Oranı (%)
                                    </label>
                                    <input
                                      type="number"
                                      value={editForm.discountPercent}
                                      onChange={(e) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          discountPercent: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                  </div>
                                </>
                              )}

                              {(ruleCode === "monthly_volume_gift" ||
                                ruleCode === "monthly_volume_reward") && (
                                <>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Hedef Litre
                                    </label>
                                    <input
                                      type="number"
                                      value={editForm.targetVolume}
                                      onChange={(e) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          targetVolume: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Hediye Litre
                                    </label>
                                    <input
                                      type="number"
                                      value={editForm.rewardValue}
                                      onChange={(e) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          rewardValue: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                  </div>
                                </>
                              )}

                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Başlangıç Tarihi
                                </label>
                                <input
                                  type="date"
                                  value={editForm.startDate}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      startDate: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Bitiş Tarihi
                                </label>
                                <input
                                  type="date"
                                  value={editForm.endDate}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      endDate: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Ana Sayfa Metni
                                </label>
                                <input
                                  value={editForm.homepageText}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      homepageText: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={cancelEditCampaign}
                                className="rounded-full px-4 py-2 text-xs font-medium bg-muted text-foreground"
                              >
                                Vazgeç
                              </button>

                              <button
  type="button"
  onClick={createCampaign}
  disabled={creatingCampaign}
  className="rounded-full px-4 py-2 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
>
  {creatingCampaign ? "Kaydediliyor..." : "Kaydet"}
</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                            disabled={!announcement.is_active}
                            onClick={() =>
                              toggleAnnouncementHomepage(
                                announcement.id,
                                announcement.show_on_homepage
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              !announcement.is_active
                                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"
                            }`}
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
