import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";

const formSchema = z.object({
  name: z.string().min(1, "Ange ditt namn"),
  email: z.string().min(1, "Ange en e-postadress").email("Ange en giltig e-postadress"),
  company: z.string().optional(),
  message: z.string().min(1, "Skriv ett meddelande"),
});

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch content from database
  const { data: contentSections } = useQuery({
    queryKey: ['page-content', 'contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', 'contact')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });

  const heroSection = contentSections?.find(s => s.section_key === 'hero');
  const formIntroSection = contentSections?.find(s => s.section_key === 'form_intro');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.name,
          email: values.email,
          company: values.company,
          message: values.message,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Meddelande skickat!",
        description: "Vi återkommer till dig inom kort.",
      });
      
      form.reset();
      setIsSubmitted(true);
      
    } catch (error: any) {
      console.error('Error sending contact email:', error);
      
      toast({
        title: "Kunde inte skicka meddelandet",
        description: error.message || "Ett fel uppstod. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            {heroSection ? (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-white prose-p:text-white prose-p:opacity-90 animate-fade-in"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(heroSection.content_html) 
                }}
              />
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 leading-tight animate-fade-in">
                  Kontakta oss
                </h1>
                <p className="text-xl md:text-2xl leading-relaxed opacity-90 animate-fade-in">
                  Har du frågor? Vi hjälper gärna till.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            {formIntroSection && (
              <div 
                className="prose prose-base max-w-none dark:prose-invert mb-8 text-center"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(formIntroSection.content_html) 
                }}
              />
            )}
            <Card className="bg-white border border-border shadow-card">
              <CardContent className="p-8">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <h3 className="text-2xl font-bold font-heading text-foreground mb-4">
                      Tack! Vi återkommer till dig inom kort.
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Ditt meddelande har skickats till noreply@nocv.se
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Skicka nytt meddelande
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Namn *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ditt namn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-post *</FormLabel>
                              <FormControl>
                                <Input placeholder="din@epost.se" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Företag</FormLabel>
                            <FormControl>
                              <Input placeholder="Ditt företag (valfritt)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meddelande *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Berätta vad vi kan hjälpa dig med..." 
                                className="min-h-[120px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4 space-y-4">
                        <Button 
                          type="submit"
                          variant="cta-primary" 
                          size="lg"
                          className="w-full hover-scale"
                          disabled={isLoading}
                        >
                          {isLoading ? "Skickar..." : "Skicka"}
                        </Button>
                        
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Contact;