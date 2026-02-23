import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import WhyNoCV from "@/components/WhyNOCV";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NoCV",
  "url": "https://nocv.se",
  "logo": "https://nocv.se/favicon.ico",
  "description": "Rekrytering utan CV – vi matchar kandidater med rätt jobb baserat på kompetens, inte papper.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://nocv.se/contact",
    "availableLanguage": "Swedish"
  },
  "sameAs": []
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "NoCV",
  "url": "https://nocv.se",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://nocv.se/jobs?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>NoCV – Sök jobb utan CV | Hitta personal baserat på kompetens</title>
        <meta name="description" content="NoCV revolutionerar rekrytering inom fordon och industri. Sök jobb på 10 minuter utan CV eller hitta rätt kandidat med AI-intervjuer." />
        <link rel="canonical" href="https://nocv.se/" />
        <meta property="og:title" content="NoCV – Sök jobb utan CV | Hitta personal baserat på kompetens" />
        <meta property="og:description" content="Rekrytering utan CV – vi matchar kandidater med rätt jobb baserat på kompetens, inte papper." />
        <meta property="og:url" content="https://nocv.se/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nocv.se/images/og-default.jpg" />
        <meta property="og:locale" content="sv_SE" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>
      <Navigation />
      <Hero />
      <WhyNoCV />
      <Footer />
    </div>
  );
};

export default Index;
