export type CampaignRuleCode =
  | "first_order_discount"
  | "first_order_gift"
  | "monthly_volume_reward"
  | "weekday_discount"
  | "vip_pricing"
  | string;

export type CampaignRewardType =
  | "discount_amount"
  | "discount_percent"
  | "free_liter"
  | "free_product"
  | "vip_price"
  | string;

export interface CampaignRuleType {
  id: string;
  code: CampaignRuleCode;
  name: string;
  description?: string | null;
}

export interface CampaignCondition {
  id: string;
  campaign_id: string;
  condition_key: string;
  condition_value: string;
}

export interface CampaignReward {
  id: string;
  campaign_id: string;
  reward_type: CampaignRewardType;
  reward_value: number;
  reward_unit?: string | null;
}

export interface Campaign {
  id: string;
  rule_type_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  homepage_text?: string | null;
  campaign_rule_types: CampaignRuleType;
  campaign_conditions: CampaignCondition[];
  campaign_rewards: CampaignReward[];
}

export interface OrderItemInput {
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  volume?: number | null;
  unit?: string | null;
}

export interface CampaignEvaluationInput {
  userId?: string | null;
  userEmail?: string | null;
  deliveryDate: string;
  subtotal: number;
  items: OrderItemInput[];
}

export interface AppliedCampaign {
  campaignId: string;
  title: string;
  rewardType: CampaignRewardType;
  rewardValue: number;
  rewardUnit?: string | null;
  discountAmount: number;
  message: string;
}

export interface CampaignEvaluationResult {
  appliedCampaigns: AppliedCampaign[];
  totalDiscount: number;
  finalTotal: number;
  messages: string[];
}
