import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import milkGlass from "@/assets/milk-glass-1l.png";
import milkPet3 from "@/assets/milk-pet-3l.png";
import milkPet5 from "@/assets/milk-pet-5l.png";

const products = [
  {
    name: "Glass Bottle",
    size: "1 Liter",
    description: "Classic glass bottle — perfect for daily freshness. Eco-friendly and reusable.",
    image: milkGlass,
  },
  {
    name: "PET Bottle",
    size: "3 Liters",
    description: "Great for families. Convenient PET packaging keeps milk fresh longer.",
    image: milkPet3,
  },
  {
    name: "PET Bottle",
    size: "5 Liters",
    description: "Best value for large families or weekly supply. Fresh farm milk in bulk.",
    image: milkPet5,
  },
];

const ProductShowcase = () => {
  return (
    <section id="products" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-3">Our Products</p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Choose Your Fresh Milk
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {products.map((product) => (
            <div
              key={product.size}
              className="bg-background rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="h-48 flex items-center justify-center mb-6">
                <img src={product.image} alt={`${product.name} ${product.size}`} className="h-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {product.name}
              </h3>
              <p className="text-2xl font-bold text-primary mb-3">{product.size}</p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{product.description}</p>
              <Link to="/order">
                <Button variant="default" className="w-full">Reserve</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
