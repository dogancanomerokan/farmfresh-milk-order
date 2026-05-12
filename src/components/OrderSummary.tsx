import { ShoppingCart } from "lucide-react";
import type { CampaignEvaluationResult } from "@/lib/campaigns/types";

type SummaryItem = {
  id: string;
  name: string;
  Volume: string;
  unit: string;
  price: number;
  quantity: string;
};

interface OrderSummaryProps {
  items: SummaryItem[];
}

const OrderSummary = ({
  items,
  campaignResult,
  campaignLoading = false,
}: OrderSummaryProps) => {
  const normalizedItems = items.map((item) => {
    const unitPrice = Number(item.price || 0);
    const qty = parseInt(item.quantity, 10) || 1;
    const lineTotal = unitPrice * qty;

    const subtotal = items.reduce((total, item) => {
  return total + Number(item.price || 0) * Number(item.quantity || 0);
}, 0);

const campaignDiscount = campaignResult?.totalDiscount || 0;
const finalTotal = campaignResult?.finalTotal ?? subtotal;

const hasCampaign =
  campaignResult && campaignResult.appliedCampaigns.length > 0;

    return {
      ...item,
      unitPrice,
      qty,
      lineTotal,
    };
  });

  const grandTotal = normalizedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  return (
    <div
      className="bg-card rounded-2xl p-6 sticky top-28"
      style={{ boxShadow: "var(--shadow-elevated)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Sipariş Özeti
        </h3>
      </div>

      {normalizedItems.length > 0 ? (
        <div className="space-y-5">
          {normalizedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="space-y-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Ürün</span>
                <span className="font-medium text-foreground text-right">
                  {item.name} - {item.Volume} {item.unit}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Birim Fiyat</span>
                <span className="font-medium text-foreground">
                  {item.unitPrice} ₺
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adet</span>
                <span className="font-medium text-foreground">{item.qty}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="font-semibold text-foreground">
                  {item.lineTotal} ₺
                </span>
              </div>
            </div>
          ))}

          <div className="border-t border-border pt-4 flex justify-between">
            <span className="font-semibold text-foreground">Toplam</span>
            <span className="text-xl font-bold text-primary">
              {grandTotal} ₺
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Kapıda ödeme yapılır
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Ürün seçtiğinizde sipariş detayları burada görünecektir.
        </p>
      )}
    </div>
  );
};

export default OrderSummary;
