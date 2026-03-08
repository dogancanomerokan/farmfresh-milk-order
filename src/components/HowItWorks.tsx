import { ClipboardList, Truck, SmilePlus } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Place Your Order",
    description: "Choose your product, enter your details, and pick a delivery date & time.",
  },
  {
    icon: Truck,
    title: "We Deliver",
    description: "We collect orders daily and deliver fresh milk right to your doorstep.",
  },
  {
    icon: SmilePlus,
    title: "Enjoy Fresh Milk",
    description: "Enjoy pure, natural farm milk — no preservatives, no additives.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-3">Simple Process</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            How It Works
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
