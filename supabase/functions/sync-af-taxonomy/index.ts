import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JOBTECH_TAXONOMY_BASE_URL = 'https://taxonomy.api.jobtechdev.se';

interface TaxonomyEndpoint {
  type: string;
  version: number;
}

const TAXONOMY_ENDPOINTS: TaxonomyEndpoint[] = [
  { type: 'occupation-name', version: 16 },
  { type: 'worktime-extent', version: 16 },
  { type: 'municipality', version: 16 },
  { type: 'employment-type', version: 16 },
  { type: 'duration', version: 16 }
];

// Alla svenska kommuner (290 st) - MUST be defined before SCB_MUNICIPALITY_CODES
const MUNICIPALITIES = [
  { id: "0114", label: "Upplands Väsby", county: "Stockholms län" },
  { id: "0115", label: "Vallentuna", county: "Stockholms län" },
  { id: "0117", label: "Österåker", county: "Stockholms län" },
  { id: "0120", label: "Värmdö", county: "Stockholms län" },
  { id: "0123", label: "Järfälla", county: "Stockholms län" },
  { id: "0125", label: "Ekerö", county: "Stockholms län" },
  { id: "0126", label: "Huddinge", county: "Stockholms län" },
  { id: "0127", label: "Botkyrka", county: "Stockholms län" },
  { id: "0128", label: "Salem", county: "Stockholms län" },
  { id: "0136", label: "Haninge", county: "Stockholms län" },
  { id: "0138", label: "Tyresö", county: "Stockholms län" },
  { id: "0139", label: "Upplands-Bro", county: "Stockholms län" },
  { id: "0140", label: "Nykvarn", county: "Stockholms län" },
  { id: "0160", label: "Täby", county: "Stockholms län" },
  { id: "0162", label: "Danderyd", county: "Stockholms län" },
  { id: "0163", label: "Sollentuna", county: "Stockholms län" },
  { id: "0180", label: "Stockholm", county: "Stockholms län" },
  { id: "0181", label: "Södertälje", county: "Stockholms län" },
  { id: "0182", label: "Nacka", county: "Stockholms län" },
  { id: "0183", label: "Sundbyberg", county: "Stockholms län" },
  { id: "0184", label: "Solna", county: "Stockholms län" },
  { id: "0186", label: "Lidingö", county: "Stockholms län" },
  { id: "0187", label: "Vaxholm", county: "Stockholms län" },
  { id: "0188", label: "Norrtälje", county: "Stockholms län" },
  { id: "0191", label: "Sigtuna", county: "Stockholms län" },
  { id: "0192", label: "Nynäshamn", county: "Stockholms län" },
  { id: "0305", label: "Håbo", county: "Uppsala län" },
  { id: "0319", label: "Älvkarleby", county: "Uppsala län" },
  { id: "0330", label: "Knivsta", county: "Uppsala län" },
  { id: "0331", label: "Heby", county: "Uppsala län" },
  { id: "0360", label: "Tierp", county: "Uppsala län" },
  { id: "0380", label: "Uppsala", county: "Uppsala län" },
  { id: "0381", label: "Enköping", county: "Uppsala län" },
  { id: "0382", label: "Östhammar", county: "Uppsala län" },
  { id: "0428", label: "Vingåker", county: "Södermanlands län" },
  { id: "0461", label: "Gnesta", county: "Södermanlands län" },
  { id: "0480", label: "Nyköping", county: "Södermanlands län" },
  { id: "0481", label: "Oxelösund", county: "Södermanlands län" },
  { id: "0482", label: "Flen", county: "Södermanlands län" },
  { id: "0483", label: "Katrineholm", county: "Södermanlands län" },
  { id: "0484", label: "Eskilstuna", county: "Södermanlands län" },
  { id: "0486", label: "Strängnäs", county: "Södermanlands län" },
  { id: "0488", label: "Trosa", county: "Södermanlands län" },
  { id: "0509", label: "Ödeshög", county: "Östergötlands län" },
  { id: "0512", label: "Ydre", county: "Östergötlands län" },
  { id: "0513", label: "Kinda", county: "Östergötlands län" },
  { id: "0560", label: "Boxholm", county: "Östergötlands län" },
  { id: "0561", label: "Åtvidaberg", county: "Östergötlands län" },
  { id: "0562", label: "Finspång", county: "Östergötlands län" },
  { id: "0563", label: "Valdemarsvik", county: "Östergötlands län" },
  { id: "0580", label: "Linköping", county: "Östergötlands län" },
  { id: "0581", label: "Norrköping", county: "Östergötlands län" },
  { id: "0582", label: "Söderköping", county: "Östergötlands län" },
  { id: "0583", label: "Motala", county: "Östergötlands län" },
  { id: "0584", label: "Vadstena", county: "Östergötlands län" },
  { id: "0586", label: "Mjölby", county: "Östergötlands län" },
  { id: "0604", label: "Aneby", county: "Jönköpings län" },
  { id: "0617", label: "Gnosjö", county: "Jönköpings län" },
  { id: "0642", label: "Mullsjö", county: "Jönköpings län" },
  { id: "0643", label: "Habo", county: "Jönköpings län" },
  { id: "0662", label: "Gislaved", county: "Jönköpings län" },
  { id: "0665", label: "Vaggeryd", county: "Jönköpings län" },
  { id: "0680", label: "Jönköping", county: "Jönköpings län" },
  { id: "0682", label: "Nässjö", county: "Jönköpings län" },
  { id: "0683", label: "Värnamo", county: "Jönköpings län" },
  { id: "0684", label: "Sävsjö", county: "Jönköpings län" },
  { id: "0685", label: "Vetlanda", county: "Jönköpings län" },
  { id: "0686", label: "Eksjö", county: "Jönköpings län" },
  { id: "0687", label: "Tranås", county: "Jönköpings län" },
  { id: "0760", label: "Uppvidinge", county: "Kronobergs län" },
  { id: "0761", label: "Lessebo", county: "Kronobergs län" },
  { id: "0763", label: "Tingsryd", county: "Kronobergs län" },
  { id: "0764", label: "Alvesta", county: "Kronobergs län" },
  { id: "0765", label: "Älmhult", county: "Kronobergs län" },
  { id: "0767", label: "Markaryd", county: "Kronobergs län" },
  { id: "0780", label: "Växjö", county: "Kronobergs län" },
  { id: "0781", label: "Ljungby", county: "Kronobergs län" },
  { id: "0821", label: "Högsby", county: "Kalmar län" },
  { id: "0834", label: "Torsås", county: "Kalmar län" },
  { id: "0840", label: "Mörbylånga", county: "Kalmar län" },
  { id: "0860", label: "Hultsfred", county: "Kalmar län" },
  { id: "0861", label: "Mönsterås", county: "Kalmar län" },
  { id: "0862", label: "Emmaboda", county: "Kalmar län" },
  { id: "0880", label: "Kalmar", county: "Kalmar län" },
  { id: "0881", label: "Nybro", county: "Kalmar län" },
  { id: "0882", label: "Oskarshamn", county: "Kalmar län" },
  { id: "0883", label: "Västervik", county: "Kalmar län" },
  { id: "0884", label: "Vimmerby", county: "Kalmar län" },
  { id: "0885", label: "Borgholm", county: "Kalmar län" },
  { id: "0980", label: "Gotland", county: "Gotlands län" },
  { id: "1060", label: "Olofström", county: "Blekinge län" },
  { id: "1080", label: "Karlskrona", county: "Blekinge län" },
  { id: "1081", label: "Ronneby", county: "Blekinge län" },
  { id: "1082", label: "Karlshamn", county: "Blekinge län" },
  { id: "1083", label: "Sölvesborg", county: "Blekinge län" },
  { id: "1214", label: "Svalöv", county: "Skåne län" },
  { id: "1230", label: "Staffanstorp", county: "Skåne län" },
  { id: "1231", label: "Burlöv", county: "Skåne län" },
  { id: "1233", label: "Vellinge", county: "Skåne län" },
  { id: "1256", label: "Östra Göinge", county: "Skåne län" },
  { id: "1257", label: "Örkelljunga", county: "Skåne län" },
  { id: "1260", label: "Bjuv", county: "Skåne län" },
  { id: "1261", label: "Kävlinge", county: "Skåne län" },
  { id: "1262", label: "Lomma", county: "Skåne län" },
  { id: "1263", label: "Svedala", county: "Skåne län" },
  { id: "1264", label: "Skurup", county: "Skåne län" },
  { id: "1265", label: "Sjöbo", county: "Skåne län" },
  { id: "1266", label: "Hörby", county: "Skåne län" },
  { id: "1267", label: "Höör", county: "Skåne län" },
  { id: "1270", label: "Tomelilla", county: "Skåne län" },
  { id: "1272", label: "Bromölla", county: "Skåne län" },
  { id: "1273", label: "Osby", county: "Skåne län" },
  { id: "1275", label: "Perstorp", county: "Skåne län" },
  { id: "1276", label: "Klippan", county: "Skåne län" },
  { id: "1277", label: "Åstorp", county: "Skåne län" },
  { id: "1278", label: "Båstad", county: "Skåne län" },
  { id: "1280", label: "Malmö", county: "Skåne län" },
  { id: "1281", label: "Lund", county: "Skåne län" },
  { id: "1282", label: "Landskrona", county: "Skåne län" },
  { id: "1283", label: "Helsingborg", county: "Skåne län" },
  { id: "1284", label: "Höganäs", county: "Skåne län" },
  { id: "1285", label: "Eslöv", county: "Skåne län" },
  { id: "1286", label: "Ystad", county: "Skåne län" },
  { id: "1287", label: "Trelleborg", county: "Skåne län" },
  { id: "1290", label: "Kristianstad", county: "Skåne län" },
  { id: "1291", label: "Simrishamn", county: "Skåne län" },
  { id: "1292", label: "Ängelholm", county: "Skåne län" },
  { id: "1293", label: "Hässleholm", county: "Skåne län" },
  { id: "1315", label: "Hylte", county: "Hallands län" },
  { id: "1380", label: "Halmstad", county: "Hallands län" },
  { id: "1381", label: "Laholm", county: "Hallands län" },
  { id: "1382", label: "Falkenberg", county: "Hallands län" },
  { id: "1383", label: "Varberg", county: "Hallands län" },
  { id: "1384", label: "Kungsbacka", county: "Hallands län" },
  { id: "1401", label: "Härryda", county: "Västra Götalands län" },
  { id: "1402", label: "Partille", county: "Västra Götalands län" },
  { id: "1407", label: "Öckerö", county: "Västra Götalands län" },
  { id: "1415", label: "Stenungsund", county: "Västra Götalands län" },
  { id: "1419", label: "Tjörn", county: "Västra Götalands län" },
  { id: "1421", label: "Orust", county: "Västra Götalands län" },
  { id: "1427", label: "Sotenäs", county: "Västra Götalands län" },
  { id: "1430", label: "Munkedal", county: "Västra Götalands län" },
  { id: "1435", label: "Tanum", county: "Västra Götalands län" },
  { id: "1438", label: "Dals-Ed", county: "Västra Götalands län" },
  { id: "1439", label: "Färgelanda", county: "Västra Götalands län" },
  { id: "1440", label: "Ale", county: "Västra Götalands län" },
  { id: "1441", label: "Lerum", county: "Västra Götalands län" },
  { id: "1442", label: "Vårgårda", county: "Västra Götalands län" },
  { id: "1443", label: "Bollebygd", county: "Västra Götalands län" },
  { id: "1444", label: "Grästorp", county: "Västra Götalands län" },
  { id: "1445", label: "Essunga", county: "Västra Götalands län" },
  { id: "1446", label: "Karlsborg", county: "Västra Götalands län" },
  { id: "1447", label: "Gullspång", county: "Västra Götalands län" },
  { id: "1452", label: "Tranemo", county: "Västra Götalands län" },
  { id: "1460", label: "Bengtsfors", county: "Västra Götalands län" },
  { id: "1461", label: "Mellerud", county: "Västra Götalands län" },
  { id: "1462", label: "Lilla Edet", county: "Västra Götalands län" },
  { id: "1463", label: "Mark", county: "Västra Götalands län" },
  { id: "1465", label: "Svenljunga", county: "Västra Götalands län" },
  { id: "1466", label: "Herrljunga", county: "Västra Götalands län" },
  { id: "1470", label: "Vara", county: "Västra Götalands län" },
  { id: "1471", label: "Götene", county: "Västra Götalands län" },
  { id: "1472", label: "Tibro", county: "Västra Götalands län" },
  { id: "1473", label: "Töreboda", county: "Västra Götalands län" },
  { id: "1480", label: "Göteborg", county: "Västra Götalands län" },
  { id: "1481", label: "Mölndal", county: "Västra Götalands län" },
  { id: "1482", label: "Kungälv", county: "Västra Götalands län" },
  { id: "1484", label: "Lysekil", county: "Västra Götalands län" },
  { id: "1485", label: "Uddevalla", county: "Västra Götalands län" },
  { id: "1486", label: "Strömstad", county: "Västra Götalands län" },
  { id: "1487", label: "Vänersborg", county: "Västra Götalands län" },
  { id: "1488", label: "Trollhättan", county: "Västra Götalands län" },
  { id: "1489", label: "Alingsås", county: "Västra Götalands län" },
  { id: "1490", label: "Borås", county: "Västra Götalands län" },
  { id: "1491", label: "Ulricehamn", county: "Västra Götalands län" },
  { id: "1492", label: "Åmål", county: "Västra Götalands län" },
  { id: "1493", label: "Mariestad", county: "Västra Götalands län" },
  { id: "1494", label: "Lidköping", county: "Västra Götalands län" },
  { id: "1495", label: "Skara", county: "Västra Götalands län" },
  { id: "1496", label: "Skövde", county: "Västra Götalands län" },
  { id: "1497", label: "Hjo", county: "Västra Götalands län" },
  { id: "1498", label: "Tidaholm", county: "Västra Götalands län" },
  { id: "1499", label: "Falköping", county: "Västra Götalands län" },
  { id: "1715", label: "Kil", county: "Värmlands län" },
  { id: "1730", label: "Eda", county: "Värmlands län" },
  { id: "1737", label: "Torsby", county: "Värmlands län" },
  { id: "1760", label: "Storfors", county: "Värmlands län" },
  { id: "1761", label: "Hammarö", county: "Värmlands län" },
  { id: "1762", label: "Munkfors", county: "Värmlands län" },
  { id: "1763", label: "Forshaga", county: "Värmlands län" },
  { id: "1764", label: "Grums", county: "Värmlands län" },
  { id: "1765", label: "Årjäng", county: "Värmlands län" },
  { id: "1766", label: "Sunne", county: "Värmlands län" },
  { id: "1780", label: "Karlstad", county: "Värmlands län" },
  { id: "1781", label: "Kristinehamn", county: "Värmlands län" },
  { id: "1782", label: "Filipstad", county: "Värmlands län" },
  { id: "1783", label: "Hagfors", county: "Värmlands län" },
  { id: "1784", label: "Arvika", county: "Värmlands län" },
  { id: "1785", label: "Säffle", county: "Värmlands län" },
  { id: "1814", label: "Lekeberg", county: "Örebro län" },
  { id: "1860", label: "Laxå", county: "Örebro län" },
  { id: "1861", label: "Hallsberg", county: "Örebro län" },
  { id: "1862", label: "Degerfors", county: "Örebro län" },
  { id: "1863", label: "Hällefors", county: "Örebro län" },
  { id: "1864", label: "Ljusnarsberg", county: "Örebro län" },
  { id: "1880", label: "Örebro", county: "Örebro län" },
  { id: "1881", label: "Kumla", county: "Örebro län" },
  { id: "1882", label: "Askersund", county: "Örebro län" },
  { id: "1883", label: "Karlskoga", county: "Örebro län" },
  { id: "1884", label: "Nora", county: "Örebro län" },
  { id: "1885", label: "Lindesberg", county: "Örebro län" },
  { id: "1904", label: "Skinnskatteberg", county: "Västmanlands län" },
  { id: "1907", label: "Surahammar", county: "Västmanlands län" },
  { id: "1960", label: "Kungsör", county: "Västmanlands län" },
  { id: "1961", label: "Hallstahammar", county: "Västmanlands län" },
  { id: "1962", label: "Norberg", county: "Västmanlands län" },
  { id: "1980", label: "Västerås", county: "Västmanlands län" },
  { id: "1981", label: "Sala", county: "Västmanlands län" },
  { id: "1982", label: "Fagersta", county: "Västmanlands län" },
  { id: "1983", label: "Köping", county: "Västmanlands län" },
  { id: "1984", label: "Arboga", county: "Västmanlands län" },
  { id: "2021", label: "Vansbro", county: "Dalarnas län" },
  { id: "2023", label: "Malung-Sälen", county: "Dalarnas län" },
  { id: "2026", label: "Gagnef", county: "Dalarnas län" },
  { id: "2029", label: "Leksand", county: "Dalarnas län" },
  { id: "2031", label: "Rättvik", county: "Dalarnas län" },
  { id: "2034", label: "Orsa", county: "Dalarnas län" },
  { id: "2039", label: "Älvdalen", county: "Dalarnas län" },
  { id: "2061", label: "Smedjebacken", county: "Dalarnas län" },
  { id: "2062", label: "Mora", county: "Dalarnas län" },
  { id: "2080", label: "Falun", county: "Dalarnas län" },
  { id: "2081", label: "Borlänge", county: "Dalarnas län" },
  { id: "2082", label: "Säter", county: "Dalarnas län" },
  { id: "2083", label: "Hedemora", county: "Dalarnas län" },
  { id: "2084", label: "Avesta", county: "Dalarnas län" },
  { id: "2085", label: "Ludvika", county: "Dalarnas län" },
  { id: "2101", label: "Ockelbo", county: "Gävleborgs län" },
  { id: "2104", label: "Hofors", county: "Gävleborgs län" },
  { id: "2121", label: "Ovanåker", county: "Gävleborgs län" },
  { id: "2132", label: "Nordanstig", county: "Gävleborgs län" },
  { id: "2161", label: "Ljusdal", county: "Gävleborgs län" },
  { id: "2180", label: "Gävle", county: "Gävleborgs län" },
  { id: "2181", label: "Sandviken", county: "Gävleborgs län" },
  { id: "2182", label: "Söderhamn", county: "Gävleborgs län" },
  { id: "2183", label: "Bollnäs", county: "Gävleborgs län" },
  { id: "2184", label: "Hudiksvall", county: "Gävleborgs län" },
  { id: "2260", label: "Ånge", county: "Västernorrlands län" },
  { id: "2262", label: "Timrå", county: "Västernorrlands län" },
  { id: "2280", label: "Härnösand", county: "Västernorrlands län" },
  { id: "2281", label: "Sundsvall", county: "Västernorrlands län" },
  { id: "2282", label: "Kramfors", county: "Västernorrlands län" },
  { id: "2283", label: "Sollefteå", county: "Västernorrlands län" },
  { id: "2284", label: "Örnsköldsvik", county: "Västernorrlands län" },
  { id: "2303", label: "Ragunda", county: "Jämtlands län" },
  { id: "2305", label: "Bräcke", county: "Jämtlands län" },
  { id: "2309", label: "Krokom", county: "Jämtlands län" },
  { id: "2313", label: "Strömsund", county: "Jämtlands län" },
  { id: "2321", label: "Åre", county: "Jämtlands län" },
  { id: "2326", label: "Berg", county: "Jämtlands län" },
  { id: "2361", label: "Härjedalen", county: "Jämtlands län" },
  { id: "2380", label: "Östersund", county: "Jämtlands län" },
  { id: "2401", label: "Nordmaling", county: "Västerbottens län" },
  { id: "2403", label: "Bjurholm", county: "Västerbottens län" },
  { id: "2404", label: "Vindeln", county: "Västerbottens län" },
  { id: "2409", label: "Robertsfors", county: "Västerbottens län" },
  { id: "2417", label: "Norsjö", county: "Västerbottens län" },
  { id: "2418", label: "Malå", county: "Västerbottens län" },
  { id: "2421", label: "Storuman", county: "Västerbottens län" },
  { id: "2422", label: "Sorsele", county: "Västerbottens län" },
  { id: "2425", label: "Dorotea", county: "Västerbottens län" },
  { id: "2460", label: "Vännäs", county: "Västerbottens län" },
  { id: "2462", label: "Vilhelmina", county: "Västerbottens län" },
  { id: "2463", label: "Åsele", county: "Västerbottens län" },
  { id: "2480", label: "Umeå", county: "Västerbottens län" },
  { id: "2481", label: "Lycksele", county: "Västerbottens län" },
  { id: "2482", label: "Skellefteå", county: "Västerbottens län" },
  { id: "2505", label: "Arvidsjaur", county: "Norrbottens län" },
  { id: "2506", label: "Arjeplog", county: "Norrbottens län" },
  { id: "2510", label: "Jokkmokk", county: "Norrbottens län" },
  { id: "2513", label: "Överkalix", county: "Norrbottens län" },
  { id: "2514", label: "Kalix", county: "Norrbottens län" },
  { id: "2518", label: "Övertorneå", county: "Norrbottens län" },
  { id: "2521", label: "Pajala", county: "Norrbottens län" },
  { id: "2523", label: "Gällivare", county: "Norrbottens län" },
  { id: "2560", label: "Älvsbyn", county: "Norrbottens län" },
  { id: "2580", label: "Luleå", county: "Norrbottens län" },
  { id: "2581", label: "Piteå", county: "Norrbottens län" },
  { id: "2582", label: "Boden", county: "Norrbottens län" },
  { id: "2583", label: "Haparanda", county: "Norrbottens län" },
  { id: "2584", label: "Kiruna", county: "Norrbottens län" }
];

// Helper function to fetch municipality taxonomy from AF API (special handling)
async function fetchMunicipalityTaxonomy(): Promise<any[]> {
  const url = `${JOBTECH_TAXONOMY_BASE_URL}/v1/taxonomy/main/concepts?type=municipality`;
  console.log(`Fetching municipalities from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch municipality: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // AF API returns ROOT ARRAY for /main/ endpoint, not { concepts: [] }
    if (!Array.isArray(data)) {
      console.error('Invalid municipality response - expected array, got:', typeof data);
      throw new Error('Invalid municipality response format from AF API');
    }
    
    console.log(`✅ Successfully fetched ${data.length} municipalities from AF API`);
    
    // Map AF API format to our format (without code, will be added via SCB mapping)
    return data.map((concept: any) => ({
      concept_id: concept['taxonomy/id'],
      type: 'municipality',
      version: 1,
      code: null, // Will be filled by addSCBCode()
      label: concept['taxonomy/preferred-label'] || concept['taxonomy/definition'] || 'Unknown'
    }));
  } catch (error) {
    console.error(`Error fetching municipalities from AF API:`, error);
    throw error; // Municipality MUST come from AF API
  }
}

// Create SCB code mapping from MUNICIPALITIES fallback data
function getSCBMunicipalityCodes(): Record<string, string> {
  return MUNICIPALITIES.reduce((acc, mun) => {
    acc[mun.label] = mun.id;
    return acc;
  }, {} as Record<string, string>);
}

// Helper function to add SCB codes to municipality concepts
function addSCBCode(municipality: any): any {
  const scbCode = getSCBMunicipalityCodes()[municipality.label];
  if (!scbCode) {
    console.warn(`⚠️ No SCB code found for municipality: ${municipality.label}`);
  }
  return {
    ...municipality,
    code: scbCode || null
  };
}

// Helper function to fetch taxonomy from AF API with fallback (for non-municipality types)
async function fetchTaxonomy(type: string, version: number) {
  console.log(`Fetching taxonomy: ${type} version ${version}`);
  
  try {
    const url = `${JOBTECH_TAXONOMY_BASE_URL}/v1/taxonomy/main/concepts?type=${type}`;
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch ${type}: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${errorBody}`);
      console.error(`URL attempted: ${url}`);
      console.log(`⚠️ Using fallback data for ${type} due to HTTP error`);
      return getFallbackData(type, version);
    }
    
    const data = await response.json();
    
    // AF /main/ endpoint returns ROOT ARRAY, not { concepts: [] }
    if (!Array.isArray(data)) {
      console.error(`Invalid response format for ${type} - expected array, got:`, typeof data);
      console.log(`⚠️ Using fallback data for ${type} due to invalid format`);
      return getFallbackData(type, version);
    }
    
    console.log(`✅ Successfully fetched ${data.length} items for ${type} from API`);
    
    return data.map((concept: any) => ({
      concept_id: concept['taxonomy/id'],
      type: type,
      version: version,
      code: concept['legacy-ams-taxonomy-id'] || concept.code || null,
      label: concept['taxonomy/preferred-label'] || concept['taxonomy/definition'] || 'Unknown'
    }));
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    console.log(`⚠️ Using fallback data for ${type} due to network/DNS error`);
    return getFallbackData(type, version);
  }
}

// 🆕 Get fallback data when API is unavailable
function getFallbackData(type: string, version: number) {
  console.log(`Loading fallback data for ${type}...`);
  
  switch (type) {
    case 'occupation-name':
      return OCCUPATIONS.map(occ => ({
        concept_id: occ.id,
        type: 'occupation-name',
        version: 16,
        code: occ.ssyk,
        label: occ.label
      }));
    
    case 'municipality':
      // Ingen fallback - förlitar oss på att nya API:et fungerar
      throw new Error('Municipality taxonomy must be fetched from AF API');
    
    case 'employment-type':
      return EMPLOYMENT_TYPES_FALLBACK.map(et => ({
        concept_id: et.code,
        type: 'employment-type',
        version: 16,
        code: null,
        label: et.label
      }));
    
    case 'duration':
      return DURATIONS_FALLBACK.map(dur => ({
        concept_id: dur.code,
        type: 'duration',
        version: 16,
        code: null,
        label: dur.label
      }));
    
    case 'worktime-extent':
      return WORKTIME_EXTENTS_FALLBACK.map(wt => ({
        concept_id: wt.code,
        type: 'worktime-extent',
        version: 16,
        code: null,
        label: wt.label
      }));
    
    default:
      console.log(`No fallback data available for type: ${type}`);
      return [];
  }
}

// ✅ Statiska fallback-data med uppdaterade concept IDs från AF API dokumentation (version 16)
const EMPLOYMENT_TYPES_FALLBACK = [
  { code: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning (inkl. eventuell provanställning)' },  // ✅ Version 16
  { code: '8qLN_bEY_bhk', label: 'Vikariat' },
  { code: 'nuKG_MXb_Yua', label: 'Säsongsarbete' },
  { code: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { code: 'bYfG_jXa_zik', label: 'Frilans' },
  { code: 'h4fe_E7e_UqV', label: 'Extratjänst' },
  { code: 'Jh8f_q9J_pbJ', label: 'Sommarjobb/Feriejobb' }
];

// Statiska fallback-data för varaktighet
const DURATIONS_FALLBACK = [
  { code: 'a7uU_j21_mkL', label: 'Tillsvidare' },  // ✅ Uppdaterad från AF dokumentation
  { code: '9uK9_HfZ_uGj', label: 'Visstid mer än 6 månader' },
  { code: 'roiG_Mii_fiZ', label: 'Visstid 3-6 månader' },
  { code: 'fPhi_RmE_iUg', label: 'Visstid mindre än 3 månader' }
];

// Statiska fallback-data för arbetstidsomfattning
const WORKTIME_EXTENTS_FALLBACK = [
  { code: '6YE1_gAC_R2G', label: 'Heltid' },
  { code: '947z_JGS_Uk2', label: 'Deltid' }
];

// Statiska yrkeskoder (50 vanligaste)
const OCCUPATIONS = [
  { id: "apaJ_2YB_LuF", label: "Lastbilsförare", label_en: "Truck driver", ssyk: "8332" },
  { id: "itoJ_h1z_LKr", label: "Lagerarbetare", label_en: "Warehouse worker", ssyk: "4321" },
  { id: "hjHe_QXp_Upv", label: "Personlig assistent", label_en: "Personal assistant", ssyk: "5322" },
  { id: "bQRz_gGe_d8j", label: "Undersköterska", label_en: "Nursing assistant", ssyk: "5321" },
  { id: "Yxq8_4Bd_FJt", label: "Busschaufför", label_en: "Bus driver", ssyk: "8331" },
  { id: "WcqW_Ngb_oBj", label: "Vårdbiträde", label_en: "Care assistant", ssyk: "5329" },
  { id: "iHpu_u2i_xBD", label: "Lokalvårdare", label_en: "Cleaner", ssyk: "9112" },
  { id: "nqLg_Z5U_FXS", label: "Snickare", label_en: "Carpenter", ssyk: "7115" },
  { id: "UKfm_ShJ_mgp", label: "Barnskötare", label_en: "Childcare worker", ssyk: "5311" },
  { id: "UGUB_ymo_oWW", label: "Säljare", label_en: "Salesperson", ssyk: "5223" },
  { id: "ZXM4_2xg_gzV", label: "Städare", label_en: "Cleaner", ssyk: "9112" },
  { id: "qmpF_ibd_mZ8", label: "Kock", label_en: "Chef", ssyk: "5120" },
  { id: "EPFQ_ejx_2J4", label: "Elektriker", label_en: "Electrician", ssyk: "7411" },
  { id: "oZDm_8bJ_iiH", label: "Maskinoperatör", label_en: "Machine operator", ssyk: "8189" },
  { id: "aTVQ_cS3_J3g", label: "Vaktmästare", label_en: "Caretaker", ssyk: "5153" },
  { id: "mSRN_WYZ_dAh", label: "VVS-montör", label_en: "Plumber", ssyk: "7126" },
  { id: "j8pG_XEG_XiY", label: "Förskollärare", label_en: "Preschool teacher", ssyk: "2342" },
  { id: "AUBi_qM1_RBc", label: "Svetsare", label_en: "Welder", ssyk: "7212" },
  { id: "rnPh_xAP_4C9", label: "Byggarbetare", label_en: "Construction worker", ssyk: "7119" },
  { id: "c2Dg_XL8_pjQ", label: "Servicetekniker", label_en: "Service technician", ssyk: "7421" },
  { id: "uXnb_pYj_hq2", label: "Programmerare", label_en: "Programmer", ssyk: "2512" },
  { id: "VFyF_oBj_Uc6", label: "Sjuksköterska", label_en: "Nurse", ssyk: "2223" },
  { id: "kZFG_Tub_hYv", label: "Fastighetsskötare", label_en: "Property caretaker", ssyk: "5153" },
  { id: "qMjh_Ybu_gW9", label: "Murare", label_en: "Bricklayer", ssyk: "7112" },
  { id: "xJni_8Cf_vD3", label: "Kundtjänstmedarbetare", label_en: "Customer service representative", ssyk: "4222" },
  { id: "pWcz_4Hx_jL8", label: "Plattsättare", label_en: "Tiler", ssyk: "7122" },
  { id: "gTbn_9Qp_mR2", label: "Målare", label_en: "Painter", ssyk: "7131" },
  { id: "vFhq_3Kw_nS7", label: "Behandlingsassistent", label_en: "Treatment assistant", ssyk: "5312" },
  { id: "dYxm_6Lp_oT4", label: "Ekonomiassistent", label_en: "Finance assistant", ssyk: "4311" },
  { id: "hNzk_2Mp_pU9", label: "Restaurangbiträde", label_en: "Restaurant assistant", ssyk: "5130" },
  { id: "jPvl_8Nq_qV1", label: "Truckförare", label_en: "Forklift driver", ssyk: "8344" },
  { id: "bRwm_4Or_rW6", label: "Mekaniker", label_en: "Mechanic", ssyk: "7231" },
  { id: "fTxn_7Ps_sX3", label: "Receptionist", label_en: "Receptionist", ssyk: "4226" },
  { id: "lVyo_1Qt_tY8", label: "Tandhygienist", label_en: "Dental hygienist", ssyk: "3251" },
  { id: "nXzp_5Ru_uZ2", label: "Lärare grundskolan", label_en: "Primary school teacher", ssyk: "2341" },
  { id: "pZaq_9Sv_vA7", label: "Kontorsassistent", label_en: "Office assistant", ssyk: "4110" },
  { id: "rBbr_3Tw_wB4", label: "CNC-operatör", label_en: "CNC operator", ssyk: "8211" },
  { id: "tDcs_7Ux_xC9", label: "Redovisningsekonom", label_en: "Accountant", ssyk: "2411" },
  { id: "vFdt_1Vy_yD1", label: "Projektledare", label_en: "Project manager", ssyk: "2421" },
  { id: "xHeu_5Wz_zE6", label: "Revisor", label_en: "Auditor", ssyk: "2412" },
  { id: "zJfv_9Xa_aF3", label: "HR-specialist", label_en: "HR specialist", ssyk: "2423" },
  { id: "bLgw_3Yb_bG8", label: "Marknadsförare", label_en: "Marketing specialist", ssyk: "2431" },
  { id: "dNhx_7Zc_cH2", label: "Systemutvecklare", label_en: "Systems developer", ssyk: "2512" },
  { id: "fPiy_1Ad_dI7", label: "Systemadministratör", label_en: "System administrator", ssyk: "2522" },
  { id: "hRjz_5Be_eJ4", label: "Nätverkstekniker", label_en: "Network technician", ssyk: "3513" },
  { id: "jTka_9Cf_fK9", label: "IT-support", label_en: "IT support", ssyk: "3512" },
  { id: "lVlb_3Dg_gL1", label: "Gymnasielärare", label_en: "High school teacher", ssyk: "2330" },
  { id: "nXmc_7Eh_hM6", label: "Skolsköterska", label_en: "School nurse", ssyk: "2223" },
  { id: "pZnd_1Fi_iN3", label: "Socionom", label_en: "Social worker", ssyk: "2635" },
  { id: "rBoe_5Gj_jO8", label: "Psykolog", label_en: "Psychologist", ssyk: "2634" }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting AF taxonomy sync...');
    
    const syncResults = [];
    let totalSynced = 0;

    // Fetch and sync each taxonomy type (excluding municipality - handled separately)
    for (const endpoint of TAXONOMY_ENDPOINTS) {
      if (endpoint.type === 'municipality') continue; // Skip, handled separately below
      
      console.log(`[SYNC] Fetching ${endpoint.type} v${endpoint.version}...`);
      
      const taxonomyData = await fetchTaxonomy(endpoint.type, endpoint.version);
      
      if (taxonomyData.length === 0) {
        console.warn(`[SYNC] No concepts found for ${endpoint.type} (neither from API nor fallback)`);
        syncResults.push({
          type: endpoint.type,
          version: endpoint.version,
          status: 'empty',
          count: 0
        });
        continue;
      }
      
      console.log(`[SYNC] Retrieved ${taxonomyData.length} concepts for ${endpoint.type}`);

      // Delete ALL old data for this type (all versions) before inserting new
      console.log(`[SYNC] Cleaning ALL data for ${endpoint.type}...`);
      const { error: deleteError } = await supabase
        .from('af_taxonomy')
        .delete()
        .eq('type', endpoint.type);

      if (deleteError) {
        console.error(`[SYNC] Delete error for ${endpoint.type}:`, deleteError);
      }

      // Upsert new data
      console.log(`[SYNC] Upserting ${taxonomyData.length} items for ${endpoint.type}...`);
      const { error: upsertError } = await supabase
        .from('af_taxonomy')
        .upsert(taxonomyData, { onConflict: 'concept_id' });

      if (upsertError) {
        console.error(`[SYNC] Upsert error for ${endpoint.type}:`, upsertError);
        syncResults.push({
          type: endpoint.type,
          version: endpoint.version,
          status: 'error',
          error: upsertError.message
        });
      } else {
        totalSynced += taxonomyData.length;
        console.log(`[SYNC] ✅ Synced ${taxonomyData.length} concepts for ${endpoint.type}`);
        syncResults.push({
          type: endpoint.type,
          version: endpoint.version,
          status: 'success',
          count: taxonomyData.length
        });
      }
    }

    // MUNICIPALITY: Special handling - fetch from AF API and add SCB codes
    try {
      console.log('[SYNC] Fetching municipalities from AF API...');
      let municipalityConcepts = await fetchMunicipalityTaxonomy();
      
      console.log(`[SYNC] Adding SCB codes to ${municipalityConcepts.length} municipalities...`);
      municipalityConcepts = municipalityConcepts.map(addSCBCode);
      
      console.log('[SYNC] Cleaning ALL municipality data...');
      const { error: deleteError } = await supabase
        .from('af_taxonomy')
        .delete()
        .eq('type', 'municipality');

      if (deleteError) {
        console.error('[SYNC] Delete error for municipality:', deleteError);
      }

      console.log(`[SYNC] Upserting ${municipalityConcepts.length} municipalities with SCB codes...`);
      const { error: upsertError } = await supabase
        .from('af_taxonomy')
        .upsert(municipalityConcepts, { onConflict: 'concept_id' });

      if (upsertError) {
        console.error('[SYNC] Upsert error for municipality:', upsertError);
        syncResults.push({
          type: 'municipality',
          version: 1,
          status: 'error',
          error: upsertError.message
        });
      } else {
        totalSynced += municipalityConcepts.length;
        console.log(`[SYNC] ✅ Synced ${municipalityConcepts.length} municipalities with SCB codes`);
        syncResults.push({
          type: 'municipality',
          version: 1,
          status: 'success',
          count: municipalityConcepts.length
        });
      }
    } catch (municipalityError) {
      console.error('[SYNC] Failed to sync municipalities:', municipalityError);
      syncResults.push({
        type: 'municipality',
        version: 1,
        status: 'error',
        error: municipalityError instanceof Error ? municipalityError.message : 'Unknown error'
      });
    }

    console.log(`[SYNC] Total synced: ${totalSynced} concepts`);

    const response = {
      success: true, 
      results: syncResults,
      total_synced: totalSynced
    };

    console.log('Sync complete:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Sync failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to sync AF taxonomy'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});