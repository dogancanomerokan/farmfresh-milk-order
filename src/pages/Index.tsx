import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HomepageNoticeBanner />
      <ProductShowcase />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
