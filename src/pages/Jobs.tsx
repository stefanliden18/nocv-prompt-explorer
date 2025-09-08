import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: "Bilmekaniker",
    location: "Stockholm",
    industry: "Fordon",
    company: "AutoService AB",
    description: "Erfaren bilmekaniker sökes till vårt team."
  },
  {
    id: 2,
    title: "Svetsare",
    location: "Göteborg", 
    industry: "Tillverkning",
    company: "MetallTeknik Sverige",
    description: "Kvalificerad svetsare för industriella projekt."
  },
  {
    id: 3,
    title: "Tekniker",
    location: "Malmö",
    industry: "Elektronik",
    company: "TechSolutions Nordic",
    description: "Elektroniktekniker med erfarenhet av reparationer."
  },
  {
    id: 4,
    title: "Maskinoperatör",
    location: "Stockholm",
    industry: "Tillverkning",
    company: "Industrial Works",
    description: "Operatör för CNC-maskiner och produktionsutrustning."
  },
  {
    id: 5,
    title: "Lacktekniker",
    location: "Uppsala",
    industry: "Fordon",
    company: "CarPaint Specialists",
    description: "Lacktekniker för bilar och industriella ändamål."
  },
  {
    id: 6,
    title: "Elektriker",
    location: "Göteborg",
    industry: "Elektro",
    company: "ElektroNord AB",
    description: "Behörig elektriker för installations- och servicearbeten."
  }
];

const Jobs = () => {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Get unique locations and industries for filters
  const locations = Array.from(new Set(mockJobs.map(job => job.location)));
  const industries = Array.from(new Set(mockJobs.map(job => job.industry)));

  // Filter jobs based on selected filters
  const filteredJobs = mockJobs.filter(job => {
    const locationMatch = locationFilter === "all" || job.location === locationFilter;
    const roleMatch = roleFilter === "all" || job.industry === roleFilter;
    return locationMatch && roleMatch;
  });

  const handleJobDetails = (jobId: number) => {
    window.location.href = `/jobs/${jobId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4">
              Lediga jobb
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hitta ditt nästa jobb baserat på vad du kan, inte vad du studerat
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 max-w-2xl mx-auto">
            <div className="flex-1">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Välj ort" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border shadow-lg z-50">
                  <SelectItem value="all">Alla orter</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Välj bransch" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border shadow-lg z-50">
                  <SelectItem value="all">Alla branscher</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results counter */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              Visar {filteredJobs.length} av {mockJobs.length} jobb
            </p>
          </div>
        </div>
      </section>

      {/* Job listings */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="bg-white border border-border hover:shadow-card transition-all duration-300 hover:transform hover:scale-[1.02] flex flex-col h-full"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-semibold text-foreground font-heading">
                      {job.title}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                      {job.industry}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-grow">
                  <p className="text-muted-foreground text-sm mb-3 font-medium">
                    {job.company}
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {job.description}
                  </p>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => handleJobDetails(job.id)}
                  >
                    Läs mer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* No results message */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Inga jobb hittades med de valda filtren. Prova att ändra dina sökkriterier.
              </p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Jobs;