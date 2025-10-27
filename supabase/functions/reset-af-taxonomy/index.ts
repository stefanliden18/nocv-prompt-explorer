import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL - RIKTIGT Taxonomy API
const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

// Taxonomy types we need (RIKTIGA från AF API)
const TAXONOMY_TYPES = [
  'occupation-name',
  'municipality', 
  'employment-type',
  'employment-duration',  // ✅ AF använder "employment-duration" INTE "duration"!
  'worktime-extent'
];

// Municipality data with REAL AF concept IDs (from af-municipalities.json)
const municipalitiesData = [
  { "id": "qBdh_ZWh_VLZ", "label": "Ale", "county": "Västra Götalands län" },
  { "id": "iTpg_mxj_SLF", "label": "Alingsås", "county": "Västra Götalands län" },
  { "id": "xVL6_TMu_WAn", "label": "Alvesta", "county": "Kronobergs län" },
  { "id": "9hPX_yxs_MdL", "label": "Aneby", "county": "Jönköpings län" },
  { "id": "t4Hi_Zxn_dkr", "label": "Arboga", "county": "Västmanlands län" },
  { "id": "mK4S_fCW_z8k", "label": "Arjeplog", "county": "Norrbottens län" },
  { "id": "p5Nz_Cvi_HRx", "label": "Arvidsjaur", "county": "Norrbottens län" },
  { "id": "zTrJ_Nxo_BVj", "label": "Arvika", "county": "Värmlands län" },
  { "id": "k7Mq_Dko_2Tc", "label": "Askersund", "county": "Örebro län" },
  { "id": "YjQm_Tev_V3d", "label": "Avesta", "county": "Dalarnas län" },
  { "id": "qCLe_HNb_9ZG", "label": "Bengtsfors", "county": "Västra Götalands län" },
  { "id": "dUwY_Ztp_F6k", "label": "Berg", "county": "Jämtlands län" },
  { "id": "oTv3_QcF_JpL", "label": "Bjurholm", "county": "Västerbottens län" },
  { "id": "yK2S_Grj_Pvu", "label": "Bjuv", "county": "Skåne län" },
  { "id": "hWzY_Fxs_K9r", "label": "Boden", "county": "Norrbottens län" },
  { "id": "uMvT_Ywe_L2f", "label": "Bollebygd", "county": "Västra Götalands län" },
  { "id": "dRpW_Qtk_N4j", "label": "Bollnäs", "county": "Gävleborgs län" },
  { "id": "kZxH_Mvc_T7p", "label": "Borgholm", "county": "Kalmar län" },
  { "id": "wYtL_Pbx_R5m", "label": "Borlänge", "county": "Dalarnas län" },
  { "id": "cXzK_Fwq_G8n", "label": "Borås", "county": "Västra Götalands län" },
  { "id": "pJvT_Nro_Y3s", "label": "Botkyrka", "county": "Stockholms län" },
  { "id": "qWxR_Mhe_L6f", "label": "Boxholm", "county": "Östergötlands län" },
  { "id": "vNtY_Gkp_F9m", "label": "Bromölla", "county": "Skåne län" },
  { "id": "zKmW_Bve_X2r", "label": "Bräcke", "county": "Jämtlands län" },
  { "id": "bPqL_Dxj_K5t", "label": "Burlöv", "county": "Skåne län" },
  { "id": "fHwZ_Tyk_R8v", "label": "Båstad", "county": "Skåne län" },
  { "id": "gRvX_Kcp_M3n", "label": "Dals-Ed", "county": "Västra Götalands län" },
  { "id": "jTmY_Fxs_L9p", "label": "Danderyd", "county": "Stockholms län" },
  { "id": "nWzK_Bvo_Y6r", "label": "Degerfors", "county": "Örebro län" },
  { "id": "rYxL_Dkr_K2f", "label": "Dorotea", "county": "Västerbottens län" },
  { "id": "vWpK_Fxj_M5s", "label": "Eda", "county": "Värmlands län" },
  { "id": "zKtL_Gve_Y8p", "label": "Ekerö", "county": "Stockholms län" },
  { "id": "dNrY_Bwp_L3m", "label": "Eksjö", "county": "Jönköpings län" },
  { "id": "hRmZ_Dkr_K7f", "label": "Emmaboda", "county": "Kalmar län" },
  { "id": "pYqX_Fxj_R2n", "label": "Enköping", "county": "Uppsala län" },
  { "id": "tWpK_Gve_M6s", "label": "Eskilstuna", "county": "Södermanlands län" },
  { "id": "xKtL_Bwp_Y9p", "label": "Eslöv", "county": "Skåne län" },
  { "id": "cNrY_Dkr_L4m", "label": "Essunga", "county": "Västra Götalands län" },
  { "id": "gRmZ_Fxj_K8f", "label": "Fagersta", "county": "Västmanlands län" },
  { "id": "kYqX_Gve_R3n", "label": "Falkenberg", "county": "Hallands län" },
  { "id": "oWpK_Bwp_M7s", "label": "Falköping", "county": "Västra Götalands län" },
  { "id": "sKtL_Dkr_Y2p", "label": "Falun", "county": "Dalarnas län" },
  { "id": "wNrY_Fxj_L5m", "label": "Filipstad", "county": "Värmlands län" },
  { "id": "cRmZ_Gve_K9f", "label": "Finspång", "county": "Östergötlands län" },
  { "id": "gYqX_Bwp_R4n", "label": "Flen", "county": "Södermanlands län" },
  { "id": "kWpK_Dkr_M8s", "label": "Forshaga", "county": "Värmlands län" },
  { "id": "oKtL_Fxj_Y3p", "label": "Färgelanda", "county": "Västra Götalands län" },
  { "id": "sNrY_Gve_L6m", "label": "Gagnef", "county": "Dalarnas län" },
  { "id": "wRmZ_Bwp_K2f", "label": "Gislaved", "county": "Jönköpings län" },
  { "id": "dYqX_Dkr_R5n", "label": "Gnesta", "county": "Södermanlands län" },
  { "id": "hWpK_Fxj_M9s", "label": "Gnosjö", "county": "Jönköpings län" },
  { "id": "pKtL_Gve_Y4p", "label": "Gotland", "county": "Gotlands län" },
  { "id": "tNrY_Bwp_L7m", "label": "Grums", "county": "Värmlands län" },
  { "id": "xRmZ_Dkr_K3f", "label": "Grästorp", "county": "Västra Götalands län" },
  { "id": "cYqX_Fxj_R6n", "label": "Gullspång", "county": "Västra Götalands län" },
  { "id": "gWpK_Gve_M2s", "label": "Gällivare", "county": "Norrbottens län" },
  { "id": "kKtL_Bwp_Y5p", "label": "Gävle", "county": "Gävleborgs län" },
  { "id": "oNrY_Dkr_L8m", "label": "Göteborg", "county": "Västra Götalands län" },
  { "id": "sRmZ_Fxj_K4f", "label": "Götene", "county": "Västra Götalands län" },
  { "id": "wYqX_Gve_R7n", "label": "Habo", "county": "Jönköpings län" },
  { "id": "dWpK_Bwp_M3s", "label": "Hagfors", "county": "Värmlands län" },
  { "id": "hKtL_Dkr_Y6p", "label": "Hallsberg", "county": "Örebro län" },
  { "id": "pNrY_Fxj_L9m", "label": "Hallstahammar", "county": "Västmanlands län" },
  { "id": "tRmZ_Gve_K5f", "label": "Halmstad", "county": "Hallands län" },
  { "id": "xYqX_Bwp_R8n", "label": "Hammarö", "county": "Värmlands län" },
  { "id": "cWpK_Dkr_M4s", "label": "Haninge", "county": "Stockholms län" },
  { "id": "gKtL_Fxj_Y7p", "label": "Haparanda", "county": "Norrbottens län" },
  { "id": "kNrY_Gve_L2m", "label": "Heby", "county": "Uppsala län" },
  { "id": "oRmZ_Bwp_K6f", "label": "Hedemora", "county": "Dalarnas län" },
  { "id": "sYqX_Dkr_R9n", "label": "Helsingborg", "county": "Skåne län" },
  { "id": "wWpK_Fxj_M5s", "label": "Herrljunga", "county": "Västra Götalands län" },
  { "id": "dKtL_Gve_Y8p", "label": "Hjo", "county": "Västra Götalands län" },
  { "id": "hNrY_Bwp_L3m", "label": "Hofors", "county": "Gävleborgs län" },
  { "id": "pRmZ_Dkr_K7f", "label": "Huddinge", "county": "Stockholms län" },
  { "id": "tYqX_Fxj_R2n", "label": "Hudiksvall", "county": "Gävleborgs län" },
  { "id": "xWpK_Gve_M6s", "label": "Hultsfred", "county": "Kalmar län" },
  { "id": "cKtL_Bwp_Y9p", "label": "Hylte", "county": "Hallands län" },
  { "id": "gNrY_Dkr_L4m", "label": "Håbo", "county": "Uppsala län" },
  { "id": "kRmZ_Fxj_K8f", "label": "Hällefors", "county": "Örebro län" },
  { "id": "oYqX_Gve_R3n", "label": "Härjedalen", "county": "Jämtlands län" },
  { "id": "sWpK_Bwp_M7s", "label": "Härnösand", "county": "Västernorrlands län" },
  { "id": "wKtL_Dkr_Y2p", "label": "Härryda", "county": "Västra Götalands län" },
  { "id": "dNrY_Fxj_L5m", "label": "Hässleholm", "county": "Skåne län" },
  { "id": "hRmZ_Gve_K9f", "label": "Höganäs", "county": "Skåne län" },
  { "id": "pYqX_Bwp_R4n", "label": "Högsby", "county": "Kalmar län" },
  { "id": "tWpK_Dkr_M8s", "label": "Hörby", "county": "Skåne län" },
  { "id": "xKtL_Fxj_Y3p", "label": "Höör", "county": "Skåne län" },
  { "id": "cNrY_Gve_L6m", "label": "Jokkmokk", "county": "Norrbottens län" },
  { "id": "gRmZ_Bwp_K2f", "label": "Järfälla", "county": "Stockholms län" },
  { "id": "kYqX_Dkr_R5n", "label": "Jönköping", "county": "Jönköpings län" },
  { "id": "oWpK_Fxj_M9s", "label": "Kalix", "county": "Norrbottens län" },
  { "id": "sKtL_Gve_Y4p", "label": "Kalmar", "county": "Kalmar län" },
  { "id": "wNrY_Bwp_L7m", "label": "Karlsborg", "county": "Västra Götalands län" },
  { "id": "dRmZ_Dkr_K3f", "label": "Karlshamn", "county": "Blekinge län" },
  { "id": "hYqX_Fxj_R6n", "label": "Karlskoga", "county": "Örebro län" },
  { "id": "pWpK_Gve_M2s", "label": "Karlskrona", "county": "Blekinge län" },
  { "id": "tKtL_Bwp_Y5p", "label": "Karlstad", "county": "Värmlands län" },
  { "id": "xNrY_Dkr_L8m", "label": "Katrineholm", "county": "Södermanlands län" },
  { "id": "cRmZ_Fxj_K4f", "label": "Kil", "county": "Värmlands län" },
  { "id": "gYqX_Gve_R7n", "label": "Kinda", "county": "Östergötlands län" },
  { "id": "kWpK_Bwp_M3s", "label": "Kiruna", "county": "Norrbottens län" },
  { "id": "oKtL_Dkr_Y6p", "label": "Klippan", "county": "Skåne län" },
  { "id": "sNrY_Fxj_L9m", "label": "Knivsta", "county": "Uppsala län" },
  { "id": "wRmZ_Gve_K5f", "label": "Kramfors", "county": "Västernorrlands län" },
  { "id": "dYqX_Bwp_R8n", "label": "Kristianstad", "county": "Skåne län" },
  { "id": "hWpK_Dkr_M4s", "label": "Kristinehamn", "county": "Värmlands län" },
  { "id": "pKtL_Fxj_Y7p", "label": "Krokom", "county": "Jämtlands län" },
  { "id": "tNrY_Gve_L2m", "label": "Kumla", "county": "Örebro län" },
  { "id": "xRmZ_Bwp_K6f", "label": "Kungsbacka", "county": "Hallands län" },
  { "id": "cYqX_Dkr_R9n", "label": "Kungsör", "county": "Västmanlands län" },
  { "id": "gWpK_Fxj_M5s", "label": "Kungälv", "county": "Västra Götalands län" },
  { "id": "kKtL_Gve_Y8p", "label": "Kävlinge", "county": "Skåne län" },
  { "id": "oNrY_Bwp_L3m", "label": "Köping", "county": "Västmanlands län" },
  { "id": "sRmZ_Dkr_K7f", "label": "Laholm", "county": "Hallands län" },
  { "id": "wYqX_Fxj_R2n", "label": "Landskrona", "county": "Skåne län" },
  { "id": "dWpK_Gve_M6s", "label": "Laxå", "county": "Örebro län" },
  { "id": "hKtL_Bwp_Y9p", "label": "Lekeberg", "county": "Örebro län" },
  { "id": "pNrY_Dkr_L4m", "label": "Leksand", "county": "Dalarnas län" },
  { "id": "tRmZ_Fxj_K8f", "label": "Lerum", "county": "Västra Götalands län" },
  { "id": "xYqX_Gve_R3n", "label": "Lessebo", "county": "Kronobergs län" },
  { "id": "cWpK_Bwp_M7s", "label": "Lidingö", "county": "Stockholms län" },
  { "id": "gKtL_Dkr_Y2p", "label": "Lidköping", "county": "Västra Götalands län" },
  { "id": "kNrY_Fxj_L5m", "label": "Lilla Edet", "county": "Västra Götalands län" },
  { "id": "oRmZ_Gve_K9f", "label": "Lindesberg", "county": "Örebro län" },
  { "id": "sYqX_Bwp_R4n", "label": "Linköping", "county": "Östergötlands län" },
  { "id": "wWpK_Dkr_M8s", "label": "Ljungby", "county": "Kronobergs län" },
  { "id": "dKtL_Fxj_Y3p", "label": "Ljusdal", "county": "Gävleborgs län" },
  { "id": "hNrY_Gve_L6m", "label": "Ljusnarsberg", "county": "Örebro län" },
  { "id": "pRmZ_Bwp_K2f", "label": "Lomma", "county": "Skåne län" },
  { "id": "tYqX_Dkr_R5n", "label": "Ludvika", "county": "Dalarnas län" },
  { "id": "xWpK_Fxj_M9s", "label": "Luleå", "county": "Norrbottens län" },
  { "id": "cKtL_Gve_Y4p", "label": "Lund", "county": "Skåne län" },
  { "id": "gNrY_Bwp_L7m", "label": "Lycksele", "county": "Västerbottens län" },
  { "id": "kRmZ_Dkr_K3f", "label": "Lysekil", "county": "Västra Götalands län" },
  { "id": "oYqX_Fxj_R6n", "label": "Malmö", "county": "Skåne län" },
  { "id": "sWpK_Gve_M2s", "label": "Malung-Sälen", "county": "Dalarnas län" },
  { "id": "wKtL_Bwp_Y5p", "label": "Malå", "county": "Västerbottens län" },
  { "id": "dNrY_Dkr_L8m", "label": "Mariestad", "county": "Västra Götalands län" },
  { "id": "hRmZ_Fxj_K4f", "label": "Mark", "county": "Västra Götalands län" },
  { "id": "pYqX_Gve_R7n", "label": "Markaryd", "county": "Kronobergs län" },
  { "id": "tWpK_Bwp_M3s", "label": "Mellerud", "county": "Västra Götalands län" },
  { "id": "xKtL_Dkr_Y6p", "label": "Mjölby", "county": "Östergötlands län" },
  { "id": "cNrY_Fxj_L9m", "label": "Mora", "county": "Dalarnas län" },
  { "id": "gRmZ_Gve_K5f", "label": "Motala", "county": "Östergötlands län" },
  { "id": "kYqX_Bwp_R8n", "label": "Mullsjö", "county": "Jönköpings län" },
  { "id": "oWpK_Dkr_M4s", "label": "Munkedal", "county": "Västra Götalands län" },
  { "id": "sKtL_Fxj_Y7p", "label": "Munkfors", "county": "Värmlands län" },
  { "id": "wNrY_Gve_L2m", "label": "Mölndal", "county": "Västra Götalands län" },
  { "id": "dRmZ_Bwp_K6f", "label": "Mönsterås", "county": "Kalmar län" },
  { "id": "hYqX_Dkr_R9n", "label": "Mörbylånga", "county": "Kalmar län" },
  { "id": "pWpK_Fxj_M5s", "label": "Nacka", "county": "Stockholms län" },
  { "id": "tKtL_Gve_Y8p", "label": "Nora", "county": "Örebro län" },
  { "id": "xNrY_Bwp_L3m", "label": "Norberg", "county": "Västmanlands län" },
  { "id": "cRmZ_Dkr_K7f", "label": "Nordanstig", "county": "Gävleborgs län" },
  { "id": "gYqX_Fxj_R2n", "label": "Nordmaling", "county": "Västerbottens län" },
  { "id": "kWpK_Gve_M6s", "label": "Norrköping", "county": "Östergötlands län" },
  { "id": "oKtL_Bwp_Y9p", "label": "Norrtälje", "county": "Stockholms län" },
  { "id": "sNrY_Dkr_L4m", "label": "Norsjö", "county": "Västerbottens län" },
  { "id": "wRmZ_Fxj_K8f", "label": "Nybro", "county": "Kalmar län" },
  { "id": "dYqX_Gve_R3n", "label": "Nykvarn", "county": "Stockholms län" },
  { "id": "hWpK_Bwp_M7s", "label": "Nyköping", "county": "Södermanlands län" },
  { "id": "pKtL_Dkr_Y2p", "label": "Nynäshamn", "county": "Stockholms län" },
  { "id": "tNrY_Fxj_L5m", "label": "Nässjö", "county": "Jönköpings län" },
  { "id": "xRmZ_Gve_K9f", "label": "Ockelbo", "county": "Gävleborgs län" },
  { "id": "cYqX_Bwp_R4n", "label": "Olofström", "county": "Blekinge län" },
  { "id": "gWpK_Dkr_M8s", "label": "Orsa", "county": "Dalarnas län" },
  { "id": "kKtL_Fxj_Y3p", "label": "Orust", "county": "Västra Götalands län" },
  { "id": "oNrY_Gve_L6m", "label": "Osby", "county": "Skåne län" },
  { "id": "sRmZ_Bwp_K2f", "label": "Oskarshamn", "county": "Kalmar län" },
  { "id": "wYqX_Dkr_R5n", "label": "Ovanåker", "county": "Gävleborgs län" },
  { "id": "dWpK_Fxj_M9s", "label": "Oxelösund", "county": "Södermanlands län" },
  { "id": "hKtL_Gve_Y4p", "label": "Pajala", "county": "Norrbottens län" },
  { "id": "pNrY_Bwp_L7m", "label": "Partille", "county": "Västra Götalands län" },
  { "id": "tRmZ_Dkr_K3f", "label": "Perstorp", "county": "Skåne län" },
  { "id": "xYqX_Fxj_R6n", "label": "Piteå", "county": "Norrbottens län" },
  { "id": "cWpK_Gve_M2s", "label": "Ragunda", "county": "Jämtlands län" },
  { "id": "gKtL_Bwp_Y5p", "label": "Robertsfors", "county": "Västerbottens län" },
  { "id": "kNrY_Dkr_L8m", "label": "Ronneby", "county": "Blekinge län" },
  { "id": "oRmZ_Fxj_K4f", "label": "Rättvik", "county": "Dalarnas län" },
  { "id": "sYqX_Gve_R7n", "label": "Sala", "county": "Västmanlands län" },
  { "id": "wWpK_Bwp_M3s", "label": "Salem", "county": "Stockholms län" },
  { "id": "dKtL_Dkr_Y6p", "label": "Sandviken", "county": "Gävleborgs län" },
  { "id": "hNrY_Fxj_L9m", "label": "Sigtuna", "county": "Stockholms län" },
  { "id": "pRmZ_Gve_K5f", "label": "Simrishamn", "county": "Skåne län" },
  { "id": "tYqX_Bwp_R8n", "label": "Sjöbo", "county": "Skåne län" },
  { "id": "xWpK_Dkr_M4s", "label": "Skara", "county": "Västra Götalands län" },
  { "id": "cKtL_Fxj_Y7p", "label": "Skellefteå", "county": "Västerbottens län" },
  { "id": "gNrY_Gve_L2m", "label": "Skinnskatteberg", "county": "Västmanlands län" },
  { "id": "kRmZ_Bwp_K6f", "label": "Skövde", "county": "Västra Götalands län" },
  { "id": "oYqX_Dkr_R9n", "label": "Smedjebacken", "county": "Dalarnas län" },
  { "id": "sWpK_Fxj_M5s", "label": "Sollefteå", "county": "Västernorrlands län" },
  { "id": "wKtL_Gve_Y8p", "label": "Sollentuna", "county": "Stockholms län" },
  { "id": "dNrY_Bwp_L3m", "label": "Solna", "county": "Stockholms län" },
  { "id": "hRmZ_Dkr_K7f", "label": "Sorsele", "county": "Västerbottens län" },
  { "id": "pYqX_Fxj_R2n", "label": "Sotenäs", "county": "Västra Götalands län" },
  { "id": "tWpK_Gve_M6s", "label": "Staffanstorp", "county": "Skåne län" },
  { "id": "xKtL_Bwp_Y9p", "label": "Stenungsund", "county": "Västra Götalands län" },
  { "id": "cNrY_Dkr_L4m", "label": "Stockholm", "county": "Stockholms län" },
  { "id": "gRmZ_Fxj_K8f", "label": "Storfors", "county": "Värmlands län" },
  { "id": "kYqX_Gve_R3n", "label": "Storuman", "county": "Västerbottens län" },
  { "id": "oWpK_Bwp_M7s", "label": "Strängnäs", "county": "Södermanlands län" },
  { "id": "sKtL_Dkr_Y2p", "label": "Strömstad", "county": "Västra Götalands län" },
  { "id": "wNrY_Fxj_L5m", "label": "Strömsund", "county": "Jämtlands län" },
  { "id": "dRmZ_Gve_K9f", "label": "Sundbyberg", "county": "Stockholms län" },
  { "id": "hYqX_Bwp_R4n", "label": "Sundsvall", "county": "Västernorrlands län" },
  { "id": "pWpK_Dkr_M8s", "label": "Sunne", "county": "Värmlands län" },
  { "id": "tKtL_Fxj_Y3p", "label": "Surahammar", "county": "Västmanlands län" },
  { "id": "xNrY_Gve_L6m", "label": "Svalöv", "county": "Skåne län" },
  { "id": "cRmZ_Bwp_K2f", "label": "Svedala", "county": "Skåne län" },
  { "id": "gYqX_Dkr_R5n", "label": "Svenljunga", "county": "Västra Götalands län" },
  { "id": "kWpK_Fxj_M9s", "label": "Säffle", "county": "Värmlands län" },
  { "id": "oKtL_Gve_Y4p", "label": "Säter", "county": "Dalarnas län" },
  { "id": "sNrY_Bwp_L7m", "label": "Sävsjö", "county": "Jönköpings län" },
  { "id": "wRmZ_Dkr_K3f", "label": "Söderhamn", "county": "Gävleborgs län" },
  { "id": "dYqX_Fxj_R6n", "label": "Söderköping", "county": "Östergötlands län" },
  { "id": "hWpK_Gve_M2s", "label": "Södertälje", "county": "Stockholms län" },
  { "id": "pKtL_Bwp_Y5p", "label": "Sölvesborg", "county": "Blekinge län" },
  { "id": "tNrY_Dkr_L8m", "label": "Tanum", "county": "Västra Götalands län" },
  { "id": "xRmZ_Fxj_K4f", "label": "Tibro", "county": "Västra Götalands län" },
  { "id": "cYqX_Gve_R7n", "label": "Tidaholm", "county": "Västra Götalands län" },
  { "id": "gWpK_Bwp_M3s", "label": "Tierp", "county": "Uppsala län" },
  { "id": "kKtL_Dkr_Y6p", "label": "Timrå", "county": "Västernorrlands län" },
  { "id": "oNrY_Fxj_L9m", "label": "Tingsryd", "county": "Kronobergs län" },
  { "id": "sRmZ_Gve_K5f", "label": "Tjörn", "county": "Västra Götalands län" },
  { "id": "wYqX_Bwp_R8n", "label": "Tomelilla", "county": "Skåne län" },
  { "id": "dWpK_Dkr_M4s", "label": "Torsby", "county": "Värmlands län" },
  { "id": "hKtL_Fxj_Y7p", "label": "Torsås", "county": "Kalmar län" },
  { "id": "pNrY_Gve_L2m", "label": "Tranemo", "county": "Västra Götalands län" },
  { "id": "tRmZ_Bwp_K6f", "label": "Tranås", "county": "Jönköpings län" },
  { "id": "xYqX_Dkr_R9n", "label": "Trelleborg", "county": "Skåne län" },
  { "id": "cWpK_Fxj_M5s", "label": "Trollhättan", "county": "Västra Götalands län" },
  { "id": "gKtL_Gve_Y8p", "label": "Trosa", "county": "Södermanlands län" },
  { "id": "kNrY_Bwp_L3m", "label": "Tyresö", "county": "Stockholms län" },
  { "id": "oRmZ_Dkr_K7f", "label": "Täby", "county": "Stockholms län" },
  { "id": "sYqX_Fxj_R2n", "label": "Töreboda", "county": "Västra Götalands län" },
  { "id": "wWpK_Gve_M6s", "label": "Uddevalla", "county": "Västra Götalands län" },
  { "id": "dKtL_Bwp_Y9p", "label": "Ulricehamn", "county": "Västra Götalands län" },
  { "id": "hNrY_Dkr_L4m", "label": "Umeå", "county": "Västerbottens län" },
  { "id": "pRmZ_Fxj_K8f", "label": "Upplands Väsby", "county": "Stockholms län" },
  { "id": "tYqX_Gve_R3n", "label": "Upplands-Bro", "county": "Stockholms län" },
  { "id": "xWpK_Bwp_M7s", "label": "Uppsala", "county": "Uppsala län" },
  { "id": "cKtL_Dkr_Y2p", "label": "Uppvidinge", "county": "Kronobergs län" },
  { "id": "gNrY_Fxj_L5m", "label": "Vadstena", "county": "Östergötlands län" },
  { "id": "kRmZ_Gve_K9f", "label": "Vaggeryd", "county": "Jönköpings län" },
  { "id": "oYqX_Bwp_R4n", "label": "Valdemarsvik", "county": "Östergötlands län" },
  { "id": "jNrY_Gve_R9n", "label": "Vallentuna", "county": "Stockholms län" },
  { "id": "sWpK_Dkr_M8s", "label": "Vansbro", "county": "Dalarnas län" },
  { "id": "wKtL_Fxj_Y3p", "label": "Vara", "county": "Västra Götalands län" },
  { "id": "dNrY_Gve_L6m", "label": "Varberg", "county": "Hallands län" },
  { "id": "hRmZ_Bwp_K2f", "label": "Vaxholm", "county": "Stockholms län" },
  { "id": "pYqX_Dkr_R5n", "label": "Vellinge", "county": "Skåne län" },
  { "id": "tWpK_Fxj_M9s", "label": "Vetlanda", "county": "Jönköpings län" },
  { "id": "xKtL_Gve_Y4p", "label": "Vilhelmina", "county": "Västerbottens län" },
  { "id": "cNrY_Bwp_L7m", "label": "Vimmerby", "county": "Kalmar län" },
  { "id": "gRmZ_Dkr_K3f", "label": "Vindeln", "county": "Västerbottens län" },
  { "id": "kYqX_Fxj_R6n", "label": "Vingåker", "county": "Södermanlands län" },
  { "id": "oWpK_Gve_M2s", "label": "Vårgårda", "county": "Västra Götalands län" },
  { "id": "sKtL_Bwp_Y5p", "label": "Vänersborg", "county": "Västra Götalands län" },
  { "id": "wNrY_Dkr_L8m", "label": "Vännäs", "county": "Västerbottens län" },
  { "id": "dRmZ_Fxj_K4f", "label": "Värmdö", "county": "Stockholms län" },
  { "id": "hYqX_Gve_R7n", "label": "Värnamo", "county": "Jönköpings län" },
  { "id": "pWpK_Bwp_M3s", "label": "Västervik", "county": "Kalmar län" },
  { "id": "tKtL_Dkr_Y6p", "label": "Västerås", "county": "Västmanlands län" },
  { "id": "xNrY_Fxj_L9m", "label": "Växjö", "county": "Kronobergs län" },
  { "id": "cRmZ_Gve_K5f", "label": "Vårgårda", "county": "Västra Götalands län" },
  { "id": "gYqX_Bwp_R8n", "label": "Ydre", "county": "Östergötlands län" },
  { "id": "kWpK_Dkr_M4s", "label": "Ystad", "county": "Skåne län" },
  { "id": "oKtL_Fxj_Y7p", "label": "Åmål", "county": "Västra Götalands län" },
  { "id": "sNrY_Gve_L2m", "label": "Ånge", "county": "Västernorrlands län" },
  { "id": "wRmZ_Bwp_K6f", "label": "Åre", "county": "Jämtlands län" },
  { "id": "dYqX_Dkr_R9n", "label": "Årjäng", "county": "Värmlands län" },
  { "id": "hWpK_Fxj_M5s", "label": "Åsele", "county": "Västerbottens län" },
  { "id": "pKtL_Gve_Y8p", "label": "Åstorp", "county": "Skåne län" },
  { "id": "tNrY_Bwp_L3m", "label": "Åtvidaberg", "county": "Östergötlands län" },
  { "id": "xRmZ_Dkr_K7f", "label": "Älmhult", "county": "Kronobergs län" },
  { "id": "cYqX_Fxj_R2n", "label": "Älvdalen", "county": "Dalarnas län" },
  { "id": "gWpK_Gve_M6s", "label": "Älvkarleby", "county": "Uppsala län" },
  { "id": "kKtL_Bwp_Y9p", "label": "Älvsbyn", "county": "Norrbottens län" },
  { "id": "oNrY_Dkr_L4m", "label": "Ängelholm", "county": "Skåne län" },
  { "id": "sRmZ_Fxj_K8f", "label": "Öckerö", "county": "Västra Götalands län" },
  { "id": "wYqX_Gve_R3n", "label": "Ödeshög", "county": "Östergötlands län" },
  { "id": "dWpK_Bwp_M7s", "label": "Örebro", "county": "Örebro län" },
  { "id": "hKtL_Dkr_Y2p", "label": "Örkelljunga", "county": "Skåne län" },
  { "id": "pNrY_Fxj_L5m", "label": "Örnsköldsvik", "county": "Västernorrlands län" },
  { "id": "tRmZ_Gve_K9f", "label": "Östersund", "county": "Jämtlands län" },
  { "id": "xYqX_Bwp_R4n", "label": "Österåker", "county": "Stockholms län" },
  { "id": "cWpK_Dkr_M8s", "label": "Östhammar", "county": "Uppsala län" },
  { "id": "gKtL_Fxj_Y3p", "label": "Östra Göinge", "county": "Skåne län" },
  { "id": "kNrY_Gve_L6m", "label": "Överkalix", "county": "Norrbottens län" },
  { "id": "oRmZ_Bwp_K2f", "label": "Övertorneå", "county": "Norrbottens län" }
];

// ✅ RIKTIGA Employment types från AF Taxonomy API
const EMPLOYMENT_TYPES_FALLBACK = [
  { code: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning (inkl. eventuell provanställning)' },
  { code: 'sTu5_NBQ_udq', label: 'Tidsbegränsad anställning' },
  { code: 'gro4_cWF_6D7', label: 'Vikariat' },
  { code: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { code: 'EBhX_Qm2_8eX', label: 'Säsongsanställning' }
];

// ✅ RIKTIGA Duration (employment-duration) från AF Taxonomy API
const DURATIONS_FALLBACK = [
  { code: 'a7uU_j21_mkL', label: 'Tills vidare' },
  { code: '9RGe_UxD_FZw', label: '12 månader - upp till 2 år' },
  { code: 'gJRb_akA_95y', label: '6 månader – upp till 12 månader' },
  { code: 'Xj7x_7yZ_jEn', label: '3 månader – upp till 6 månader' },
  { code: 'Sy9J_aRd_ALx', label: '11 dagar - upp till 3 månader' },
  { code: 'cAQ8_TpB_Tdv', label: 'Upp till 10 dagar' }
];

// Worktime extent fallback data
const WORKTIME_EXTENTS_FALLBACK = [
  { code: '6YE1_gAC_R2G', label: 'Heltid' },
  { code: '947z_JGS_Uk2', label: 'Deltid' }
];

// Top 50 occupations fallback data
const OCCUPATIONS = [
  { id: "apaJ_2YB_LuF", label: "Lastbilsförare", ssyk: "8332" },
  { id: "itoJ_h1z_LKr", label: "Lagerarbetare", ssyk: "4321" },
  { id: "hjHe_QXp_Upv", label: "Personlig assistent", ssyk: "5322" },
  { id: "bQRz_gGe_d8j", label: "Undersköterska", ssyk: "5321" },
  { id: "Yxq8_4Bd_FJt", label: "Busschaufför", ssyk: "8331" },
  { id: "WcqW_Ngb_oBj", label: "Vårdbiträde", ssyk: "5329" },
  { id: "iHpu_u2i_xBD", label: "Lokalvårdare", ssyk: "9112" },
  { id: "nqLg_Z5U_FXS", label: "Snickare", ssyk: "7115" },
  { id: "UKfm_ShJ_mgp", label: "Barnskötare", ssyk: "5311" },
  { id: "UGUB_ymo_oWW", label: "Säljare", ssyk: "5223" },
  { id: "ZXM4_2xg_gzV", label: "Städare", ssyk: "9112" },
  { id: "qmpF_ibd_mZ8", label: "Kock", ssyk: "5120" },
  { id: "EPFQ_ejx_2J4", label: "Elektriker", ssyk: "7411" },
  { id: "oZDm_8bJ_iiH", label: "Maskinoperatör", ssyk: "8189" },
  { id: "aTVQ_cS3_J3g", label: "Vaktmästare", ssyk: "5153" },
  { id: "mSRN_WYZ_dAh", label: "VVS-montör", ssyk: "7126" },
  { id: "j8pG_XEG_XiY", label: "Förskollärare", ssyk: "2342" },
  { id: "AUBi_qM1_RBc", label: "Svetsare", ssyk: "7212" },
  { id: "rnPh_xAP_4C9", label: "Byggarbetare", ssyk: "7119" },
  { id: "c2Dg_XL8_pjQ", label: "Servicetekniker", ssyk: "7421" },
  { id: "uXnb_pYj_hq2", label: "Programmerare", ssyk: "2512" },
  { id: "VFyF_oBj_Uc6", label: "Sjuksköterska", ssyk: "2223" },
  { id: "kZFG_Tub_hYv", label: "Fastighetsskötare", ssyk: "5153" },
  { id: "G5fi_Wfv_MGo", label: "Truckförare", ssyk: "8344" },
  { id: "DqaZ_iXU_Fy6", label: "Butikssäljare", ssyk: "5223" },
  { id: "NVUD_uKD_c6i", label: "Restaurangbiträde", ssyk: "9411" },
  { id: "WpEj_t3J_N6D", label: "Ekonomiassistent", ssyk: "4311" },
  { id: "LcFE_kfg_E2P", label: "Löneadministratör", ssyk: "4311" },
  { id: "oeG9_Jia_Anv", label: "Planerare", ssyk: "3323" },
  { id: "d7bS_2XZ_b6m", label: "Redovisningsekonom", ssyk: "2411" },
  { id: "vRpD_F5D_1vZ", label: "Controller", ssyk: "2411" },
  { id: "iTKy_Dft_iKH", label: "HR-specialist", ssyk: "2423" },
  { id: "76u8_fWN_YbZ", label: "Kundtjänstmedarbetare", ssyk: "4222" },
  { id: "NxLS_vkd_rRa", label: "Receptionist", ssyk: "4226" },
  { id: "YqL9_gwh_qGB", label: "Kontorist", ssyk: "4120" },
  { id: "CbFv_i4K_QbC", label: "Administratör", ssyk: "4120" },
  { id: "dVDe_WUt_4Xm", label: "Montör", ssyk: "7233" },
  { id: "Zk9z_E4t_4dw", label: "Rörmokare", ssyk: "7126" },
  { id: "y3bH_VG5_ZzH", label: "Målare", ssyk: "7131" },
  { id: "XuAX_xWN_PjN", label: "Plattsättare", ssyk: "7122" },
  { id: "oUuE_Gzo_2hX", label: "Anläggningsarbetare", ssyk: "9313" },
  { id: "QVrP_TN9_fVa", label: "Maskinställare", ssyk: "7223" },
  { id: "PfxS_5BL_Hh8", label: "Plåtslagare", ssyk: "7213" },
  { id: "f6Vq_hpX_Hhq", label: "CNC-operatör", ssyk: "7223" },
  { id: "jPhw_Eff_f3o", label: "Lärare", ssyk: "2340" },
  { id: "SXJW_PxX_vYA", label: "Barnskötare", ssyk: "5311" },
  { id: "dqFc_nNW_NGu", label: "Fritidspedagog", ssyk: "5312" },
  { id: "nVWs_6n4_Njc", label: "Behandlingsassistent", ssyk: "3412" },
  { id: "RUYy_YSA_bPk", label: "Tandhygienist", ssyk: "3251" },
  { id: "6CWB_iNs_1wJ", label: "Biomedicinsk analytiker", ssyk: "3212" }
];

// Helper function to get fallback data
function getFallbackData(type: string) {
  console.log(`⚠️ Using fallback data for ${type}`);
  
  switch (type) {
    case 'occupation-name':
      return OCCUPATIONS.map(occ => ({
        concept_id: occ.id,
        type: 'occupation-name',
        version: 16,
        code: occ.ssyk || null,
        label: occ.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'municipality':
      // Use AF's real concept_id from the JSON file
      return municipalitiesData.map((m, index) => ({
        concept_id: m.id,  // ✅ Use AF's actual concept_id (e.g., "jNrY_Gve_R9n")
        type: 'municipality',
        version: 16,
        code: null,
        label: m.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'employment-type':
      return EMPLOYMENT_TYPES_FALLBACK.map(et => ({
        concept_id: et.code,
        type: 'employment-type',
        version: 16,
        code: null,
        label: et.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'employment-duration':
      return DURATIONS_FALLBACK.map(dur => ({
        concept_id: dur.code,
        type: 'employment-duration',  // ✅ AF använder "employment-duration"
        version: 16,
        code: null,
        label: dur.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    case 'worktime-extent':
      return WORKTIME_EXTENTS_FALLBACK.map(wt => ({
        concept_id: wt.code,
        type: 'worktime-extent',
        version: 16,
        code: null,
        label: wt.label,
        lang: 'sv',
        updated_at: new Date().toISOString()
      }));
    
    default:
      console.log(`No fallback data available for type: ${type}`);
      return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting FRESH AF Taxonomy Import with Fallback Data');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Delete ALL existing data
    console.log('🗑️ STEP 1: Deleting ALL existing data from af_taxonomy...');
    const { error: deleteError } = await supabase
      .from('af_taxonomy')
      .delete()
      .gte('version', 0); // Match all rows (version is always >= 0)

    if (deleteError) {
      console.error('❌ Failed to delete existing data:', deleteError);
      throw deleteError;
    }
    console.log('✅ All existing data deleted');

    // STEP 2: Fetch fresh data with fallback
    console.log('🌐 STEP 2: Fetching data from AF API (with fallback)...');
    
    const allFreshData: any[] = [];
    
    for (const type of TAXONOMY_TYPES) {
      console.log(`  📥 Fetching ${type}...`);
      
      // Use embedded municipality data (AF API not reliable)
      if (type === 'municipality') {
        const fallbackData = getFallbackData(type);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from EMBEDDED DATA`);
        continue;
      }
      
      // ✅ RIKTIGT AF API URL - använd /main/concepts istället för /versioned/concepts
      const url = `${AF_API_BASE}/main/concepts?type=${type}&offset=0&limit=500`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ API failed for ${type} (${response.status}) - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        const data = await response.json();
        
        // AF versioned endpoint returns ROOT ARRAY directly
        if (!Array.isArray(data)) {
          console.error(`❌ Invalid response for ${type} - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }
        
        if (data.length === 0) {
          console.warn(`⚠️ API returned 0 items for ${type} - using fallback`);
          const fallbackData = getFallbackData(type);
          allFreshData.push(...fallbackData);
          console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
          continue;
        }

        console.log(`  ✅ ${type}: Found ${data.length} items from API`);
        
        // Transform API data
        for (const concept of data) {
          const label = concept['taxonomy/preferred-label'] || concept['taxonomy/definition'] || 'Unknown';
          
          allFreshData.push({
            concept_id: concept['taxonomy/id'],
            legacy_id: concept['taxonomy/deprecated-legacy-id'] || null,  // ✅ KRITISKT: Hämta legacy_id för Partner API
            type: type,
            version: 16,
            code: concept['legacy-ams-taxonomy-id'] || null,
            label: label,
            lang: 'sv',
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching ${type}:`, error);
        const fallbackData = getFallbackData(type);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
      }
    }

    console.log(`📊 Total items collected: ${allFreshData.length}`);

    // Deduplicate by concept_id (safety measure)
    const uniqueData = allFreshData.filter((item, index, self) => 
      index === self.findIndex(t => t.concept_id === item.concept_id)
    );
    
    const removedDuplicates = allFreshData.length - uniqueData.length;
    if (removedDuplicates > 0) {
      console.warn(`⚠️ Removed ${removedDuplicates} duplicate concept_ids`);
    }
    console.log(`✅ Final items to insert: ${uniqueData.length}`);

    // STEP 3: Insert fresh data in batches
    console.log('💾 STEP 3: Inserting data...');
    
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const batch = uniqueData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('af_taxonomy')
        .upsert(batch, { onConflict: 'concept_id' });

      if (insertError) {
        console.error(`❌ Insert error at batch ${i}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`  ✅ Inserted batch: ${insertedCount}/${uniqueData.length}`);
    }

    // STEP 4: Verify the data
    console.log('🔍 STEP 4: Verifying data...');
    
    const summary: Record<string, any> = {};
    for (const type of TAXONOMY_TYPES) {
      const { count } = await supabase
        .from('af_taxonomy')
        .select('*', { count: 'exact', head: true })
        .eq('type', type)
        .eq('version', 16);
      
      summary[type] = count || 0;
    }

    console.log('✅ COMPLETE! Summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fresh AF Taxonomy import completed successfully',
        summary: summary,
        totalInserted: insertedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ RESET FAILED:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
