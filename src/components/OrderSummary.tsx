import { ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  active: boolean;
};

interface OrderSummaryProps {
  product?: Product;
  quantity: string;
}

const OrderSummary = ({ product, quantity }: OrderSummaryProps) => {
  const unitPrice = Number(product?.price || 0);
  const qty = parseInt(quantity, 10) || 1;
  const total = unitPrice * qty;

  return (
    <div className="bg-card rounded-2xl p-6 sticky top-28" style={{ boxShadow: 'var(--shadow-elevated)' }}>
      <div className="flex items-center gap-2 mb-5">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Sipariş Özeti
        </h3>
      </div>

      {product ? (
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ürün</span>
            <span className="font-medium text-foreground">
              {product.name} - {product.unit}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Birim Fiyat</span>
            <span className="font-medium text-foreground">{unitPrice} ₺</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adet</span>
            <span className="font-medium text-foreground">{qty}</span>
          </div>
          <div className="border-t border-border pt-4 flex justify-between">
            <span className="font-semibold text-foreground">Toplam</span>
            <span className="text-xl font-bold text-primary">{total} ₺</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">Kapıda ödeme yapılır</p>
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
