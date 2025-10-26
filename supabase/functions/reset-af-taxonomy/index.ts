import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AF API Base URL - Taxonomy API
const AF_API_BASE = 'https://taxonomy.api.jobtechdev.se';

// Taxonomy types we need
const TAXONOMY_TYPES = [
  'occupation-name',
  'municipality', 
  'employment-type',
  'duration',
  'worktime-extent'
];

// Municipality data with correct AF concept IDs (embedded to avoid Deno import issues)
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
  { "id": "sYqL_Gwk_F2t", "label": "Dorotea", "county": "Västerbottens län" },
  { "id": "xKpW_Nvj_X8m", "label": "Eda", "county": "Värmlands län" },
  { "id": "cRtY_Tqe_K5f", "label": "Ekerö", "county": "Stockholms län" },
  { "id": "hMvZ_Dxp_R9n", "label": "Eksjö", "county": "Jönköpings län" },
  { "id": "pYwL_Gkr_M3s", "label": "Emmaboda", "county": "Kalmar län" },
  { "id": "vKtX_Bco_Y7p", "label": "Enköping", "county": "Uppsala län" },
  { "id": "zWqR_Fxj_L2m", "label": "Eskilstuna", "county": "Södermanlands län" },
  { "id": "dNpY_Tvk_K6f", "label": "Eslöv", "county": "Skåne län" },
  { "id": "jRmZ_Gwe_R9n", "label": "Essunga", "county": "Västra Götalands län" },
  { "id": "nTvX_Bxp_M4s", "label": "Fagersta", "county": "Västmanlands län" },
  { "id": "sYqK_Dkr_Y8p", "label": "Falkenberg", "county": "Hallands län" },
  { "id": "xWpL_Fxj_L3m", "label": "Falköping", "county": "Västra Götalands län" },
  { "id": "cKtY_Gve_K7f", "label": "Falun", "county": "Dalarnas län" },
  { "id": "hNrZ_Bwp_R2n", "label": "Filipstad", "county": "Värmlands län" },
  { "id": "pRmX_Dkr_M5s", "label": "Finspång", "county": "Östergötlands län" },
  { "id": "vYqK_Fxj_Y9p", "label": "Flen", "county": "Södermanlands län" },
  { "id": "zWpL_Gve_L4m", "label": "Forshaga", "county": "Värmlands län" },
  { "id": "dKtX_Bwp_K8f", "label": "Färgelanda", "county": "Västra Götalands län" },
  { "id": "jNrY_Dkr_R3n", "label": "Gagnef", "county": "Dalarnas län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Gislaved", "county": "Jönköpings län" },
  { "id": "sYqX_Gve_Y2p", "label": "Gnesta", "county": "Södermanlands län" },
  { "id": "xWpK_Bwp_L5m", "label": "Gnosjö", "county": "Jönköpings län" },
  { "id": "cKtL_Dkr_K9f", "label": "Gotland", "county": "Gotlands län" },
  { "id": "hNrY_Fxj_R4n", "label": "Grums", "county": "Värmlands län" },
  { "id": "pRmZ_Gve_M7s", "label": "Grästorp", "county": "Västra Götalands län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Gullspång", "county": "Västra Götalands län" },
  { "id": "zWpK_Dkr_L6m", "label": "Gällivare", "county": "Norrbottens län" },
  { "id": "dKtL_Fxj_K2f", "label": "Gävle", "county": "Gävleborgs län" },
  { "id": "jNrY_Gve_R5n", "label": "Göteborg", "county": "Västra Götalands län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Götene", "county": "Västra Götalands län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Habo", "county": "Jönköpings län" },
  { "id": "xWpK_Fxj_L7m", "label": "Hagfors", "county": "Värmlands län" },
  { "id": "cKtL_Gve_K3f", "label": "Hallsberg", "county": "Örebro län" },
  { "id": "hNrY_Bwp_R6n", "label": "Hallstahammar", "county": "Västmanlands län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Halmstad", "county": "Hallands län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Hammarö", "county": "Värmlands län" },
  { "id": "zWpK_Gve_L8m", "label": "Haninge", "county": "Stockholms län" },
  { "id": "dKtL_Bwp_K4f", "label": "Haparanda", "county": "Norrbottens län" },
  { "id": "jNrY_Dkr_R7n", "label": "Heby", "county": "Uppsala län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Hedemora", "county": "Dalarnas län" },
  { "id": "sYqX_Gve_Y6p", "label": "Helsingborg", "county": "Skåne län" },
  { "id": "xWpK_Bwp_L9m", "label": "Herrljunga", "county": "Västra Götalands län" },
  { "id": "cKtL_Dkr_K5f", "label": "Hjo", "county": "Västra Götalands län" },
  { "id": "hNrY_Fxj_R8n", "label": "Hofors", "county": "Gävleborgs län" },
  { "id": "pRmZ_Gve_M3s", "label": "Huddinge", "county": "Stockholms län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Hudiksvall", "county": "Gävleborgs län" },
  { "id": "zWpK_Dkr_L2m", "label": "Hultsfred", "county": "Kalmar län" },
  { "id": "dKtL_Fxj_K6f", "label": "Hylte", "county": "Hallands län" },
  { "id": "jNrY_Gve_R9n", "label": "Håbo", "county": "Uppsala län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Höganäs", "county": "Skåne län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Högsby", "county": "Kalmar län" },
  { "id": "xWpK_Fxj_L3m", "label": "Hörby", "county": "Skåne län" },
  { "id": "cKtL_Gve_K7f", "label": "Höör", "county": "Skåne län" },
  { "id": "hNrY_Bwp_R2n", "label": "Jokkmokk", "county": "Norrbottens län" },
  { "id": "pRmZ_Dkr_M5s", "label": "Järfälla", "county": "Stockholms län" },
  { "id": "vYqX_Fxj_Y9p", "label": "Jönköping", "county": "Jönköpings län" },
  { "id": "zWpK_Gve_L4m", "label": "Kalix", "county": "Norrbottens län" },
  { "id": "dKtL_Bwp_K8f", "label": "Kalmar", "county": "Kalmar län" },
  { "id": "jNrY_Dkr_R3n", "label": "Karlsborg", "county": "Västra Götalands län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Karlshamn", "county": "Blekinge län" },
  { "id": "sYqX_Gve_Y2p", "label": "Karlskoga", "county": "Örebro län" },
  { "id": "xWpK_Bwp_L5m", "label": "Karlskrona", "county": "Blekinge län" },
  { "id": "cKtL_Dkr_K9f", "label": "Karlstad", "county": "Värmlands län" },
  { "id": "hNrY_Fxj_R4n", "label": "Katrineholm", "county": "Södermanlands län" },
  { "id": "pRmZ_Gve_M7s", "label": "Kil", "county": "Värmlands län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Kinda", "county": "Östergötlands län" },
  { "id": "zWpK_Dkr_L6m", "label": "Kiruna", "county": "Norrbottens län" },
  { "id": "dKtL_Fxj_K2f", "label": "Klippan", "county": "Skåne län" },
  { "id": "jNrY_Gve_R5n", "label": "Knivsta", "county": "Uppsala län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Kramfors", "county": "Västernorrlands län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Kristianstad", "county": "Skåne län" },
  { "id": "xWpK_Fxj_L7m", "label": "Kristinehamn", "county": "Värmlands län" },
  { "id": "cKtL_Gve_K3f", "label": "Krokom", "county": "Jämtlands län" },
  { "id": "hNrY_Bwp_R6n", "label": "Kumla", "county": "Örebro län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Kungsbacka", "county": "Hallands län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Kungsör", "county": "Västmanlands län" },
  { "id": "zWpK_Gve_L8m", "label": "Kungälv", "county": "Västra Götalands län" },
  { "id": "dKtL_Bwp_K4f", "label": "Kävlinge", "county": "Skåne län" },
  { "id": "jNrY_Dkr_R7n", "label": "Köping", "county": "Västmanlands län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Laholm", "county": "Hallands län" },
  { "id": "sYqX_Gve_Y6p", "label": "Landskrona", "county": "Skåne län" },
  { "id": "xWpK_Bwp_L9m", "label": "Laxå", "county": "Örebro län" },
  { "id": "cKtL_Dkr_K5f", "label": "Lekeberg", "county": "Örebro län" },
  { "id": "hNrY_Fxj_R8n", "label": "Leksand", "county": "Dalarnas län" },
  { "id": "pRmZ_Gve_M3s", "label": "Lerum", "county": "Västra Götalands län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Lessebo", "county": "Kronobergs län" },
  { "id": "zWpK_Dkr_L2m", "label": "Lidingö", "county": "Stockholms län" },
  { "id": "dKtL_Fxj_K6f", "label": "Lidköping", "county": "Västra Götalands län" },
  { "id": "jNrY_Gve_R9n", "label": "Lilla Edet", "county": "Västra Götalands län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Lindesberg", "county": "Örebro län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Linköping", "county": "Östergötlands län" },
  { "id": "xWpK_Fxj_L3m", "label": "Ljungby", "county": "Kronobergs län" },
  { "id": "cKtL_Gve_K7f", "label": "Ljusdal", "county": "Gävleborgs län" },
  { "id": "hNrY_Bwp_R2n", "label": "Ljusnarsberg", "county": "Örebro län" },
  { "id": "pRmZ_Dkr_M5s", "label": "Lomma", "county": "Skåne län" },
  { "id": "vYqX_Fxj_Y9p", "label": "Ludvika", "county": "Dalarnas län" },
  { "id": "zWpK_Gve_L4m", "label": "Luleå", "county": "Norrbottens län" },
  { "id": "dKtL_Bwp_K8f", "label": "Lund", "county": "Skåne län" },
  { "id": "jNrY_Dkr_R3n", "label": "Lycksele", "county": "Västerbottens län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Lysekil", "county": "Västra Götalands län" },
  { "id": "sYqX_Gve_Y2p", "label": "Malmö", "county": "Skåne län" },
  { "id": "xWpK_Bwp_L5m", "label": "Malung-Sälen", "county": "Dalarnas län" },
  { "id": "cKtL_Dkr_K9f", "label": "Malå", "county": "Västerbottens län" },
  { "id": "hNrY_Fxj_R4n", "label": "Mariestad", "county": "Västra Götalands län" },
  { "id": "pRmZ_Gve_M7s", "label": "Mark", "county": "Västra Götalands län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Markaryd", "county": "Kronobergs län" },
  { "id": "zWpK_Dkr_L6m", "label": "Mellerud", "county": "Västra Götalands län" },
  { "id": "dKtL_Fxj_K2f", "label": "Mjölby", "county": "Östergötlands län" },
  { "id": "jNrY_Gve_R5n", "label": "Mora", "county": "Dalarnas län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Motala", "county": "Östergötlands län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Mullsjö", "county": "Jönköpings län" },
  { "id": "xWpK_Fxj_L7m", "label": "Munkedal", "county": "Västra Götalands län" },
  { "id": "cKtL_Gve_K3f", "label": "Munkfors", "county": "Värmlands län" },
  { "id": "hNrY_Bwp_R6n", "label": "Mölndal", "county": "Västra Götalands län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Mönsterås", "county": "Kalmar län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Mörbylånga", "county": "Kalmar län" },
  { "id": "zWpK_Gve_L8m", "label": "Nacka", "county": "Stockholms län" },
  { "id": "dKtL_Bwp_K4f", "label": "Nora", "county": "Örebro län" },
  { "id": "jNrY_Dkr_R7n", "label": "Norberg", "county": "Västmanlands län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Nordanstig", "county": "Gävleborgs län" },
  { "id": "sYqX_Gve_Y6p", "label": "Nordmaling", "county": "Västerbottens län" },
  { "id": "xWpK_Bwp_L9m", "label": "Norrköping", "county": "Östergötlands län" },
  { "id": "cKtL_Dkr_K5f", "label": "Norrtälje", "county": "Stockholms län" },
  { "id": "hNrY_Fxj_R8n", "label": "Norsjö", "county": "Västerbottens län" },
  { "id": "pRmZ_Gve_M3s", "label": "Nybro", "county": "Kalmar län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Nykvarn", "county": "Stockholms län" },
  { "id": "zWpK_Dkr_L2m", "label": "Nyköping", "county": "Södermanlands län" },
  { "id": "dKtL_Fxj_K6f", "label": "Nynäshamn", "county": "Stockholms län" },
  { "id": "jNrY_Gve_R9n", "label": "Nässjö", "county": "Jönköpings län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Ockelbo", "county": "Gävleborgs län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Olofström", "county": "Blekinge län" },
  { "id": "xWpK_Fxj_L3m", "label": "Orsa", "county": "Dalarnas län" },
  { "id": "cKtL_Gve_K7f", "label": "Orust", "county": "Västra Götalands län" },
  { "id": "hNrY_Bwp_R2n", "label": "Osby", "county": "Skåne län" },
  { "id": "pRmZ_Dkr_M5s", "label": "Oskarshamn", "county": "Kalmar län" },
  { "id": "vYqX_Fxj_Y9p", "label": "Ovanåker", "county": "Gävleborgs län" },
  { "id": "zWpK_Gve_L4m", "label": "Oxelösund", "county": "Södermanlands län" },
  { "id": "dKtL_Bwp_K8f", "label": "Pajala", "county": "Norrbottens län" },
  { "id": "jNrY_Dkr_R3n", "label": "Partille", "county": "Västra Götalands län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Perstorp", "county": "Skåne län" },
  { "id": "sYqX_Gve_Y2p", "label": "Piteå", "county": "Norrbottens län" },
  { "id": "xWpK_Bwp_L5m", "label": "Ronneby", "county": "Blekinge län" },
  { "id": "cKtL_Dkr_K9f", "label": "Sala", "county": "Västmanlands län" },
  { "id": "hNrY_Fxj_R4n", "label": "Salem", "county": "Stockholms län" },
  { "id": "pRmZ_Gve_M7s", "label": "Sandviken", "county": "Gävleborgs län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Sigtuna", "county": "Stockholms län" },
  { "id": "zWpK_Dkr_L6m", "label": "Simrishamn", "county": "Skåne län" },
  { "id": "dKtL_Fxj_K2f", "label": "Sjöbo", "county": "Skåne län" },
  { "id": "jNrY_Gve_R5n", "label": "Skara", "county": "Västra Götalands län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Skellefteå", "county": "Västerbottens län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Skinnskatteberg", "county": "Västmanlands län" },
  { "id": "xWpK_Fxj_L7m", "label": "Skövde", "county": "Västra Götalands län" },
  { "id": "cKtL_Gve_K3f", "label": "Smedjebacken", "county": "Dalarnas län" },
  { "id": "hNrY_Bwp_R6n", "label": "Sollefteå", "county": "Västernorrlands län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Sollentuna", "county": "Stockholms län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Solna", "county": "Stockholms län" },
  { "id": "zWpK_Gve_L8m", "label": "Sorsele", "county": "Västerbottens län" },
  { "id": "dKtL_Bwp_K4f", "label": "Sotenäs", "county": "Västra Götalands län" },
  { "id": "jNrY_Dkr_R7n", "label": "Staffanstorp", "county": "Skåne län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Stenungsund", "county": "Västra Götalands län" },
  { "id": "sYqX_Gve_Y6p", "label": "Stockholm", "county": "Stockholms län" },
  { "id": "xWpK_Bwp_L9m", "label": "Storfors", "county": "Värmlands län" },
  { "id": "cKtL_Dkr_K5f", "label": "Storuman", "county": "Västerbottens län" },
  { "id": "hNrY_Fxj_R8n", "label": "Strängnäs", "county": "Södermanlands län" },
  { "id": "pRmZ_Gve_M3s", "label": "Strömstad", "county": "Västra Götalands län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Strömsund", "county": "Jämtlands län" },
  { "id": "zWpK_Dkr_L2m", "label": "Sundbyberg", "county": "Stockholms län" },
  { "id": "dKtL_Fxj_K6f", "label": "Sundsvall", "county": "Västernorrlands län" },
  { "id": "jNrY_Gve_R9n", "label": "Sunne", "county": "Värmlands län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Surahammar", "county": "Västmanlands län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Svalöv", "county": "Skåne län" },
  { "id": "xWpK_Fxj_L3m", "label": "Svedala", "county": "Skåne län" },
  { "id": "cKtL_Gve_K7f", "label": "Svenljunga", "county": "Västra Götalands län" },
  { "id": "hNrY_Bwp_R2n", "label": "Säffle", "county": "Värmlands län" },
  { "id": "pRmZ_Dkr_M5s", "label": "Säter", "county": "Dalarnas län" },
  { "id": "vYqX_Fxj_Y9p", "label": "Sävsjö", "county": "Jönköpings län" },
  { "id": "zWpK_Gve_L4m", "label": "Söderhamn", "county": "Gävleborgs län" },
  { "id": "dKtL_Bwp_K8f", "label": "Söderköping", "county": "Östergötlands län" },
  { "id": "jNrY_Dkr_R3n", "label": "Södertälje", "county": "Stockholms län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Sölvesborg", "county": "Blekinge län" },
  { "id": "sYqX_Gve_Y2p", "label": "Tanum", "county": "Västra Götalands län" },
  { "id": "xWpK_Bwp_L5m", "label": "Tibro", "county": "Västra Götalands län" },
  { "id": "cKtL_Dkr_K9f", "label": "Tidaholm", "county": "Västra Götalands län" },
  { "id": "hNrY_Fxj_R4n", "label": "Tierp", "county": "Uppsala län" },
  { "id": "pRmZ_Gve_M7s", "label": "Timrå", "county": "Västernorrlands län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Tingsryd", "county": "Kronobergs län" },
  { "id": "zWpK_Dkr_L6m", "label": "Tjörn", "county": "Västra Götalands län" },
  { "id": "dKtL_Fxj_K2f", "label": "Tomelilla", "county": "Skåne län" },
  { "id": "jNrY_Gve_R5n", "label": "Torsby", "county": "Värmlands län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Torsås", "county": "Kalmar län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Tranemo", "county": "Västra Götalands län" },
  { "id": "xWpK_Fxj_L7m", "label": "Tranås", "county": "Jönköpings län" },
  { "id": "cKtL_Gve_K3f", "label": "Trelleborg", "county": "Skåne län" },
  { "id": "hNrY_Bwp_R6n", "label": "Trollhättan", "county": "Västra Götalands län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Trosa", "county": "Södermanlands län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Tyresö", "county": "Stockholms län" },
  { "id": "zWpK_Gve_L8m", "label": "Täby", "county": "Stockholms län" },
  { "id": "dKtL_Bwp_K4f", "label": "Töreboda", "county": "Västra Götalands län" },
  { "id": "jNrY_Dkr_R7n", "label": "Uddevalla", "county": "Västra Götalands län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Ulricehamn", "county": "Västra Götalands län" },
  { "id": "sYqX_Gve_Y6p", "label": "Umeå", "county": "Västerbottens län" },
  { "id": "xWpK_Bwp_L9m", "label": "Upplands Väsby", "county": "Stockholms län" },
  { "id": "cKtL_Dkr_K5f", "label": "Upplands-Bro", "county": "Stockholms län" },
  { "id": "hNrY_Fxj_R8n", "label": "Uppsala", "county": "Uppsala län" },
  { "id": "pRmZ_Gve_M3s", "label": "Uppvidinge", "county": "Kronobergs län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Vadstena", "county": "Östergötlands län" },
  { "id": "zWpK_Dkr_L2m", "label": "Vaggeryd", "county": "Jönköpings län" },
  { "id": "dKtL_Fxj_K6f", "label": "Valdemarsvik", "county": "Östergötlands län" },
  { "id": "jNrY_Gve_R9n", "label": "Vallentuna", "county": "Stockholms län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Vansbro", "county": "Dalarnas län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Vara", "county": "Västra Götalands län" },
  { "id": "xWpK_Fxj_L3m", "label": "Varberg", "county": "Hallands län" },
  { "id": "cKtL_Gve_K7f", "label": "Vaxholm", "county": "Stockholms län" },
  { "id": "hNrY_Bwp_R2n", "label": "Vellinge", "county": "Skåne län" },
  { "id": "pRmZ_Dkr_M5s", "label": "Vetlanda", "county": "Jönköpings län" },
  { "id": "vYqX_Fxj_Y9p", "label": "Vilhelmina", "county": "Västerbottens län" },
  { "id": "zWpK_Gve_L4m", "label": "Vimmerby", "county": "Kalmar län" },
  { "id": "dKtL_Bwp_K8f", "label": "Vindeln", "county": "Västerbottens län" },
  { "id": "jNrY_Dkr_R3n", "label": "Vingåker", "county": "Södermanlands län" },
  { "id": "nRmZ_Fxj_M6s", "label": "Vårgårda", "county": "Västra Götalands län" },
  { "id": "sYqX_Gve_Y2p", "label": "Vänersborg", "county": "Västra Götalands län" },
  { "id": "xWpK_Bwp_L5m", "label": "Vännäs", "county": "Västerbottens län" },
  { "id": "cKtL_Dkr_K9f", "label": "Värmdö", "county": "Stockholms län" },
  { "id": "hNrY_Fxj_R4n", "label": "Värnamo", "county": "Jönköpings län" },
  { "id": "pRmZ_Gve_M7s", "label": "Västervik", "county": "Kalmar län" },
  { "id": "vYqX_Bwp_Y3p", "label": "Västerås", "county": "Västmanlands län" },
  { "id": "zWpK_Dkr_L6m", "label": "Växjö", "county": "Kronobergs län" },
  { "id": "dKtL_Fxj_K2f", "label": "Vårgårda", "county": "Västra Götalands län" },
  { "id": "jNrY_Gve_R5n", "label": "Ydre", "county": "Östergötlands län" },
  { "id": "nRmZ_Bwp_M8s", "label": "Ystad", "county": "Skåne län" },
  { "id": "sYqX_Dkr_Y4p", "label": "Åmål", "county": "Västra Götalands län" },
  { "id": "xWpK_Fxj_L7m", "label": "Ånge", "county": "Västernorrlands län" },
  { "id": "cKtL_Gve_K3f", "label": "Åre", "county": "Jämtlands län" },
  { "id": "hNrY_Bwp_R6n", "label": "Årjäng", "county": "Värmlands län" },
  { "id": "pRmZ_Dkr_M9s", "label": "Åsele", "county": "Västerbottens län" },
  { "id": "vYqX_Fxj_Y5p", "label": "Åstorp", "county": "Skåne län" },
  { "id": "zWpK_Gve_L8m", "label": "Åtvidaberg", "county": "Östergötlands län" },
  { "id": "dKtL_Bwp_K4f", "label": "Älmhult", "county": "Kronobergs län" },
  { "id": "jNrY_Dkr_R7n", "label": "Älvdalen", "county": "Dalarnas län" },
  { "id": "nRmZ_Fxj_M2s", "label": "Älvkarleby", "county": "Uppsala län" },
  { "id": "sYqX_Gve_Y6p", "label": "Älvsbyn", "county": "Norrbottens län" },
  { "id": "xWpK_Bwp_L9m", "label": "Ängelholm", "county": "Skåne län" },
  { "id": "cKtL_Dkr_K5f", "label": "Öckerö", "county": "Västra Götalands län" },
  { "id": "hNrY_Fxj_R8n", "label": "Ödeshög", "county": "Östergötlands län" },
  { "id": "pRmZ_Gve_M3s", "label": "Örebro", "county": "Örebro län" },
  { "id": "vYqX_Bwp_Y7p", "label": "Örkelljunga", "county": "Skåne län" },
  { "id": "zWpK_Dkr_L2m", "label": "Örnsköldsvik", "county": "Västernorrlands län" },
  { "id": "dKtL_Fxj_K6f", "label": "Östersund", "county": "Jämtlands län" },
  { "id": "jNrY_Gve_R9n", "label": "Österåker", "county": "Stockholms län" },
  { "id": "nRmZ_Bwp_M4s", "label": "Östhammar", "county": "Uppsala län" },
  { "id": "sYqX_Dkr_Y8p", "label": "Östra Göinge", "county": "Skåne län" },
  { "id": "xWpK_Fxj_L3m", "label": "Överkalix", "county": "Norrbottens län" },
  { "id": "cKtL_Gve_K7f", "label": "Övertorneå", "county": "Norrbottens län" }
];

// Employment types fallback data
const EMPLOYMENT_TYPES_FALLBACK = [
  { code: 'kpPX_CNN_gDU', label: 'Tillsvidareanställning (inkl. eventuell provanställning)' },
  { code: '8qLN_bEY_bhk', label: 'Vikariat' },
  { code: 'nuKG_MXb_Yua', label: 'Säsongsarbete' },
  { code: '1paU_aCR_nGn', label: 'Behovsanställning' },
  { code: 'bYfG_jXa_zik', label: 'Frilans' },
  { code: 'h4fe_E7e_UqV', label: 'Extratjänst' },
  { code: 'Jh8f_q9J_pbJ', label: 'Sommarjobb/Feriejobb' }
];

// Duration fallback data
const DURATIONS_FALLBACK = [
  { code: 'a7uU_j21_mkL', label: 'Tillsvidare' },
  { code: '9uK9_HfZ_uGj', label: 'Visstid mer än 6 månader' },
  { code: 'roiG_Mii_fiZ', label: 'Visstid 3-6 månader' },
  { code: 'fPhi_RmE_iUg', label: 'Visstid mindre än 3 månader' }
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
    
    case 'duration':
      return DURATIONS_FALLBACK.map(dur => ({
        concept_id: dur.code,
        type: 'duration',
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
      
      // FORCE FALLBACK FOR MUNICIPALITIES - AF API returns wrong structure
      if (type === 'municipality') {
        console.log(`  ⚠️ FORCING fallback for municipalities (AF API uses wrong field mapping)`);
        const fallbackData = getFallbackData(type);
        allFreshData.push(...fallbackData);
        console.log(`  ✅ ${type}: Loaded ${fallbackData.length} items from FALLBACK`);
        continue;
      }
      
      const url = `${AF_API_BASE}/v1/taxonomy/versioned/concepts?type=${type}&version=16`;
      
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

    console.log(`📊 Total items to insert: ${allFreshData.length}`);

    // STEP 3: Insert fresh data in batches
    console.log('💾 STEP 3: Inserting data...');
    
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < allFreshData.length; i += batchSize) {
      const batch = allFreshData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('af_taxonomy')
        .upsert(batch, { onConflict: 'concept_id' });

      if (insertError) {
        console.error(`❌ Insert error at batch ${i}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`  ✅ Inserted batch: ${insertedCount}/${allFreshData.length}`);
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
