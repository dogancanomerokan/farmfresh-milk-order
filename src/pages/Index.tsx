import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import HomepageNoticeBanner from "@/components/HomepageNoticeBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProductShowcase />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
