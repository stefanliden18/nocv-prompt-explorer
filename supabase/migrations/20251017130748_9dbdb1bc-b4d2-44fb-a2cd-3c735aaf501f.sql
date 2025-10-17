-- Add GDPR consent columns to applications table
ALTER TABLE public.applications 
ADD COLUMN gdpr_consent boolean NOT NULL DEFAULT false,
ADD COLUMN gdpr_consent_timestamp timestamp with time zone;

-- Create gdpr_policies table for managing GDPR policy text
CREATE TABLE public.gdpr_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gdpr_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gdpr_policies
CREATE POLICY "Anyone can view active GDPR policy"
ON public.gdpr_policies
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage GDPR policies"
ON public.gdpr_policies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_gdpr_policies_updated_at
BEFORE UPDATE ON public.gdpr_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_page_content_updated_at();

-- Insert default GDPR policy text in Swedish
INSERT INTO public.gdpr_policies (policy_text, is_active) VALUES (
'<h3>Behandling av personuppgifter</h3>
<p>När du skickar in din ansökan kommer vi att behandla dina personuppgifter i enlighet med GDPR (General Data Protection Regulation).</p>

<h4>Personuppgiftsansvarig</h4>
<p>Det företag som publicerat jobbannonsen är personuppgiftsansvarig för behandlingen av dina personuppgifter.</p>

<h4>Vilka uppgifter samlar vi in?</h4>
<ul>
  <li>Namn</li>
  <li>E-postadress</li>
  <li>Telefonnummer</li>
  <li>Information du lämnar i ditt meddelande</li>
  <li>CV och andra dokument du eventuellt bifogar</li>
</ul>

<h4>Ändamål och rättslig grund</h4>
<p>Dina personuppgifter behandlas för att:</p>
<ul>
  <li>Hantera din jobbansökan</li>
  <li>Bedöma din lämplighet för tjänsten</li>
  <li>Kommunicera med dig under rekryteringsprocessen</li>
</ul>
<p>Behandlingen sker med stöd av ditt samtycke samt vårt berättigade intresse att kunna genomföra rekryteringsprocessen.</p>

<h4>Lagring och gallring</h4>
<p>Dina personuppgifter kommer att sparas under rekryteringsprocessens gång och raderas senast 2 år efter att rekryteringen avslutats, om du inte anställs eller om vi inte kommit överens om något annat.</p>

<h4>Dina rättigheter</h4>
<p>Du har rätt att:</p>
<ul>
  <li>Få information om vilka personuppgifter vi behandlar om dig</li>
  <li>Begära rättelse av felaktiga uppgifter</li>
  <li>Begära radering av dina uppgifter</li>
  <li>Invända mot behandlingen</li>
  <li>Återkalla ditt samtycke</li>
</ul>

<h4>Kontakt</h4>
<p>För frågor om behandling av personuppgifter eller för att utöva dina rättigheter, kontakta det rekryterande företaget via kontaktuppgifterna i jobbannonsen.</p>

<p>Du har även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du anser att behandlingen av dina personuppgifter strider mot GDPR.</p>',
true
);