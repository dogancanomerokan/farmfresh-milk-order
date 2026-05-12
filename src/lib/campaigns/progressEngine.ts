
import { supabase } from "@/lib/supabaseClient";

export type LoyaltyProgressResult = {
  campaignId: string;
  campaignTitle: string;
  currentVolume: number;
  orderVolume: number;
  totalAfterOrder: number;
  targetVolume: number;
  remainingVolume: number;
  rewardValue: number;
  rewardUnit: string;
  isUnlocked: boolean;
  message: string;
};

type ProgressInput = {
  userId?: string | null;
  campaignId: string;
  campaignTitle: string;
  orderVolume: number;
  targetVolume: number;
  rewardValue: number;
  rewardUnit?: string | null;
};

export async function getMonthlyDeliveredVolume(userId?: string | null) {
  if (!userId) return 0;

  const now = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      quantity,
      volume_snapshot,
      orders!inner (
        user_id,
        status,
        delivery_date
      )
    `)
    .eq("orders.user_id", userId)
    .eq("orders.status", "delivered")
    .gte("orders.delivery_date", monthStart);

  if (error) {
    console.error("Monthly delivered volume failed:", error);
    return 0;
  }

  return (data || []).reduce((total: number, item: any) => {
    return (
      total +
      Number(item.volume_snapshot || 0) *
        Number(item.quantity || 0)
    );
  }, 0);
}

export function calculateLoyaltyProgress({
  userId,
  campaignId,
  campaignTitle,
  orderVolume,
  targetVolume,
  rewardValue,
  rewardUnit,
}: ProgressInput): LoyaltyProgressResult {
  const currentVolume = 0;

  const totalAfterOrder = currentVolume + orderVolume;
  const remainingVolume = Math.max(targetVolume - totalAfterOrder, 0);
  const isUnlocked = totalAfterOrder >= targetVolume;

  const message = isUnlocked
    ? `${campaignTitle}: ${rewardValue} ${rewardUnit || "L"} hediye kazandınız.`
    : `${campaignTitle}: Bu sipariş sonrası ${totalAfterOrder} / ${targetVolume} L tamamlandı. ${remainingVolume} L sonra ${rewardValue} ${
        rewardUnit || "L"
      } hediye kazanacaksınız.`;

  return {
    campaignId,
    campaignTitle,
    currentVolume,
    orderVolume,
    totalAfterOrder,
    targetVolume,
    remainingVolume,
    rewardValue,
    rewardUnit: rewardUnit || "L",
    isUnlocked,
    message,
  };
}

export async function calculateMonthlyLoyaltyProgress({
  userId,
  campaignId,
  campaignTitle,
  orderVolume,
  targetVolume,
  rewardValue,
  rewardUnit,
}: ProgressInput): Promise<LoyaltyProgressResult> {
  const currentVolume = await getMonthlyDeliveredVolume(userId);

  const totalAfterOrder = currentVolume + orderVolume;
  const remainingVolume = Math.max(targetVolume - totalAfterOrder, 0);
  const isUnlocked = totalAfterOrder >= targetVolume;

  const message = isUnlocked
    ? `${campaignTitle}: ${rewardValue} ${rewardUnit || "L"} hediye kazandınız.`
    : `${campaignTitle}: Bu sipariş sonrası ${totalAfterOrder} / ${targetVolume} L tamamlandı. ${remainingVolume} L sonra ${rewardValue} ${
        rewardUnit || "L"
      } hediye kazanacaksınız.`;

  return {
    campaignId,
    campaignTitle,
    currentVolume,
    orderVolume,
    totalAfterOrder,
    targetVolume,
    remainingVolume,
    rewardValue,
    rewardUnit: rewardUnit || "L",
    isUnlocked,
    message,
  };
}
