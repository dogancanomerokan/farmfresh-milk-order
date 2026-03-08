import { ClipboardList, Truck, SmilePlus } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Siparişinizi Verin",
    description: "Ürününüzü seçin, bilgilerinizi girin ve teslimat tarih & saatinizi belirleyin.",
  },
  {
    icon: Truck,
    title: "Biz Teslim Edelim",
    description: "Siparişleri her gün topluyoruz ve taze sütü kapınıza kadar getiriyoruz.",
  },
  {
    icon: SmilePlus,
    title: "Taze Sütün Keyfini Çıkarın",
    description: "Saf, doğal çiftlik sütü — katkı maddesi yok, koruyucu yok.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-3">Basit Süreç</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Nasıl Çalışır?
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;