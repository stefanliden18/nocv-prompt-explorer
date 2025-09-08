import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import WhyNOCV from "@/components/WhyNOCV";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <WhyNOCV />
      <Footer />
    </div>
  );
};

export default Index;
