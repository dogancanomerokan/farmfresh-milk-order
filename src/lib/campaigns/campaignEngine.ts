import { supabase } from "@/lib/supabaseClient";
import type {
  AppliedCampaign,
  Campaign,
  CampaignEvaluationInput,
  CampaignEvaluationResult,
  CampaignReward,
} from "./types";

function isTodayWithinCampaignDates(campaign: Campaign) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (campaign.start_date) {
    const start = new Date(campaign.start_date);
    start.setHours(0, 0, 0, 0);

    if (today < start) return false;
  }

  if (campaign.end_date) {
    const end = new Date(campaign.end_date);
    end.setHours(0, 0, 0, 0);

    if (today > end) return false;
  }

  return true;
}

function getConditionValue(campaign: Campaign, key: string) {
  return campaign.campaign_conditions?.find(
    (condition) => condition.condition_key === key
  )?.condition_value;
}

function calculateRewardDiscount(
  reward: CampaignReward,
  subtotal: number
): number {
  if (reward.reward_type === "discount_amount") {
    return Math.min(Number(reward.reward_value || 0), subtotal);
  }

  if (reward.reward_type === "discount_percent") {
    return subtotal * (Number(reward.reward_value || 0) / 100);
  }

  return 0;
}

async function isFirstOrder(userId?: string | null, userEmail?: string | null) {
  if (!userId && !userEmail) return false;

  let query = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .neq("status", "cancelled");

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (userEmail) {
    query = query.eq("guest_email", userEmail);
  }

  const { count, error } = await query;

  if (error) {
    console.error("First order check failed:", error);
    return false;
  }

  return (count || 0) === 0;
}

function isWeekdayMatch(campaign: Campaign, deliveryDate: string) {
  const weekdayCondition = getConditionValue(campaign, "weekday");

  if (!weekdayCondition) return true;

  const date = new Date(deliveryDate);
  const day = date.getDay();

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    pazar: 0,
    pazartesi: 1,
    sali: 2,
    çarşamba: 3,
    carsamba: 3,
    perşembe: 4,
    persembe: 4,
    cuma: 5,
    cumartesi: 6,
  };

  return weekdayMap[weekdayCondition.toLowerCase()] === day;
}

function getOrderTotalVolume(input: CampaignEvaluationInput) {
  return input.items.reduce((total, item) => {
    const volume = Number(item.volume || 0);
    const quantity = Number(item.quantity || 0);
    return total + volume * quantity;
  }, 0);
}

async function getMonthlyDeliveredVolume(userId?: string | null) {
  if (!userId) return 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      quantity,
      volume_snapshot,
      orders!inner (
        user_id,
        status,
        delivery_date
      )
    `
    )
    .eq("orders.user_id", userId)
    .eq("orders.status", "delivered")
    .gte("orders.delivery_date", monthStart);

  if (error) {
    console.error("Monthly volume check failed:", error);
    return 0;
  }

  return (data || []).reduce((total: number, item: any) => {
    return total + Number(item.volume_snapshot || 0) * Number(item.quantity || 0);
  }, 0);
}

async function isCampaignEligible(
  campaign: Campaign,
  input: CampaignEvaluationInput
) {
  if (!campaign.is_active) return false;
  if (!isTodayWithinCampaignDates(campaign)) return false;

  const ruleCode = campaign.campaign_rule_types?.code;

  if (ruleCode === "first_order_discount" || ruleCode === "first_order_gift") {
    return await isFirstOrder(input.userId, input.userEmail);
  }

  if (ruleCode === "weekday_discount") {
    return isWeekdayMatch(campaign, input.deliveryDate);
  }

  if (ruleCode === "monthly_volume_reward") {
    const requiredVolume = Number(
      getConditionValue(campaign, "monthly_volume_gte") || 0
    );

    const currentVolume = await getMonthlyDeliveredVolume(input.userId);
    const orderVolume = getOrderTotalVolume(input);

    return currentVolume + orderVolume >= requiredVolume;
  }

  return true;
}

function applyCampaignReward(
  campaign: Campaign,
  reward: CampaignReward,
  input: CampaignEvaluationInput
): AppliedCampaign {
  const discountAmount = calculateRewardDiscount(reward, input.subtotal);

  let message = campaign.title;

  if (reward.reward_type === "discount_amount") {
    message = `${campaign.title}: ${discountAmount.toFixed(2)} TL indirim uygulandı.`;
  }

  if (reward.reward_type === "discount_percent") {
    message = `${campaign.title}: %${reward.reward_value} indirim uygulandı.`;
  }

  if (reward.reward_type === "free_liter") {
    message = `${campaign.title}: ${reward.reward_value} ${reward.reward_unit || "L"} hediye kazandınız.`;
  }

  return {
    campaignId: campaign.id,
    title: campaign.title,
    rewardType: reward.reward_type,
    rewardValue: Number(reward.reward_value || 0),
    rewardUnit: reward.reward_unit,
    discountAmount,
    message,
  };
}

export async function fetchActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      campaign_rule_types (
        id,
        code,
        name,
        description
      ),
      campaign_conditions (
        id,
        campaign_id,
        condition_key,
        condition_value
      ),
      campaign_rewards (
        id,
        campaign_id,
        reward_type,
        reward_value,
        reward_unit
      )
    `
    )
    .eq("is_active", true);

 if (error) {
  console.error("Active campaigns fetch failed:", error);
  return [];
}

console.log("ACTIVE CAMPAIGNS:", data);

return (data || []) as Campaign[];

export async function evaluateCampaigns(
  input: CampaignEvaluationInput
): Promise<CampaignEvaluationResult> {
  const campaigns = await fetchActiveCampaigns();

console.log("CAMPAIGNS COUNT:", campaigns.length);

const appliedCampaigns: AppliedCampaign[] = [];

  const eligible = await isCampaignEligible(campaign, input);

console.log("CAMPAIGN ELIGIBILITY:", {
  title: campaign.title,
  ruleCode: campaign.campaign_rule_types?.code,
  conditions: campaign.campaign_conditions,
  rewards: campaign.campaign_rewards,
  eligible,
});

if (!eligible) continue;

    for (const reward of campaign.campaign_rewards || []) {
      appliedCampaigns.push(applyCampaignReward(campaign, reward, input));
    }
  }

  const totalDiscount = appliedCampaigns.reduce(
    (total, campaign) => total + campaign.discountAmount,
    0
  );

  const finalTotal = Math.max(input.subtotal - totalDiscount, 0);

  return {
    appliedCampaigns,
    totalDiscount,
    finalTotal,
    messages: appliedCampaigns.map((campaign) => campaign.message),
  };
}
