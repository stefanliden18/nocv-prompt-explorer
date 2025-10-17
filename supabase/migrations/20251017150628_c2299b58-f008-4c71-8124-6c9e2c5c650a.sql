-- Fix text formatting on About page by removing empty paragraph tags

UPDATE page_content 
SET content_html = '<p>Vi som har startat NOCV tror helt enkelt inte på att ett dokument gör en människa rättvisa. Människor är så mycket mer än det som står på ett vitt papper! Det är just därför som vi vill förflytta rekrytering och jobbsökande in i den riktiga världen, där människor kan söka jobb helt utan krav på ålder, kön, nationalitet eller annat som är inte är väsentligt.</p><p>Att söka jobb ska vara enkelt, smidigt och gå snabbt! Med NOCV förflyttar vi jobbsökandet åt det håller vi tror är rätt. Samtliga sökande kommer att få en intervju med en Ai-agent, det innebär att alla har samma möjlighet - för oss är det viktigt.</p>'
WHERE page_key = 'about' AND section_key = 'hero';

UPDATE page_content 
SET content_html = '<p>Med över 30 års erfarenhet ifrån rekrytering anser vi oss vara väldigt kunniga. Tillsammans med duktiga människor från branschen vill vi ta ett helt nytt grepp. Det spelar ingen roll vad du har gjort tidigare, det viktiga är vilka kunskaper du har. Kan du skruva med snöskotrar, traktorer eller motorcyklare bör du rimligtvis kunna hantera bilar, lastbilar eller bussar. Vi har ett tydligt fokus på fordonsindustrin och vi ser inga begränsningar.</p>'
WHERE page_key = 'about' AND section_key = 'story';