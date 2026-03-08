import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-farm.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <p className="text-primary-foreground/80 text-sm uppercase tracking-widest mb-4 font-medium">
            Farm Fresh • Daily Delivery
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Pure Milk,{" "}
            <span className="italic">Straight from Our Farm</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/85 mb-8 max-w-lg leading-relaxed">
            Reserve your fresh, natural milk today. No preservatives, no additives — just pure goodness delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/order">
              <Button size="lg" variant="secondary" className="text-base px-8 py-6 font-semibold shadow-lg">
                Reserve Now
              </Button>
            </Link>
            <a href="#products">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Our Products
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
