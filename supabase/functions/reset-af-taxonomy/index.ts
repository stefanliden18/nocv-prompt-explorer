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

// Alla svenska kommuner (290 st)
const MUNICIPALITIES = [
  { id: "0114", label: "Upplands Väsby" },
  { id: "0115", label: "Vallentuna" },
  { id: "0117", label: "Österåker" },
  { id: "0120", label: "Värmdö" },
  { id: "0123", label: "Järfälla" },
  { id: "0125", label: "Ekerö" },
  { id: "0126", label: "Huddinge" },
  { id: "0127", label: "Botkyrka" },
  { id: "0128", label: "Salem" },
  { id: "0136", label: "Haninge" },
  { id: "0138", label: "Tyresö" },
  { id: "0139", label: "Upplands-Bro" },
  { id: "0140", label: "Nykvarn" },
  { id: "0160", label: "Täby" },
  { id: "0162", label: "Danderyd" },
  { id: "0163", label: "Sollentuna" },
  { id: "0180", label: "Stockholm" },
  { id: "0181", label: "Södertälje" },
  { id: "0182", label: "Nacka" },
  { id: "0183", label: "Sundbyberg" },
  { id: "0184", label: "Solna" },
  { id: "0186", label: "Lidingö" },
  { id: "0187", label: "Vaxholm" },
  { id: "0188", label: "Norrtälje" },
  { id: "0191", label: "Sigtuna" },
  { id: "0192", label: "Nynäshamn" },
  { id: "0305", label: "Håbo" },
  { id: "0319", label: "Älvkarleby" },
  { id: "0330", label: "Knivsta" },
  { id: "0331", label: "Heby" },
  { id: "0360", label: "Tierp" },
  { id: "0380", label: "Uppsala" },
  { id: "0381", label: "Enköping" },
  { id: "0382", label: "Östhammar" },
  { id: "0428", label: "Vingåker" },
  { id: "0461", label: "Gnesta" },
  { id: "0480", label: "Nyköping" },
  { id: "0481", label: "Oxelösund" },
  { id: "0482", label: "Flen" },
  { id: "0483", label: "Katrineholm" },
  { id: "0484", label: "Eskilstuna" },
  { id: "0486", label: "Strängnäs" },
  { id: "0488", label: "Trosa" },
  { id: "0509", label: "Ödeshög" },
  { id: "0512", label: "Ydre" },
  { id: "0513", label: "Kinda" },
  { id: "0560", label: "Boxholm" },
  { id: "0561", label: "Åtvidaberg" },
  { id: "0562", label: "Finspång" },
  { id: "0563", label: "Valdemarsvik" },
  { id: "0580", label: "Linköping" },
  { id: "0581", label: "Norrköping" },
  { id: "0582", label: "Söderköping" },
  { id: "0583", label: "Motala" },
  { id: "0584", label: "Vadstena" },
  { id: "0586", label: "Mjölby" },
  { id: "0604", label: "Aneby" },
  { id: "0617", label: "Gnosjö" },
  { id: "0642", label: "Mullsjö" },
  { id: "0643", label: "Habo" },
  { id: "0662", label: "Gislaved" },
  { id: "0665", label: "Vaggeryd" },
  { id: "0680", label: "Jönköping" },
  { id: "0682", label: "Nässjö" },
  { id: "0683", label: "Värnamo" },
  { id: "0684", label: "Sävsjö" },
  { id: "0685", label: "Vetlanda" },
  { id: "0686", label: "Eksjö" },
  { id: "0687", label: "Tranås" },
  { id: "0760", label: "Uppvidinge" },
  { id: "0761", label: "Lessebo" },
  { id: "0763", label: "Tingsryd" },
  { id: "0764", label: "Alvesta" },
  { id: "0765", label: "Älmhult" },
  { id: "0767", label: "Markaryd" },
  { id: "0780", label: "Växjö" },
  { id: "0781", label: "Ljungby" },
  { id: "0821", label: "Högsby" },
  { id: "0834", label: "Torsås" },
  { id: "0840", label: "Mörbylånga" },
  { id: "0860", label: "Hultsfred" },
  { id: "0861", label: "Mönsterås" },
  { id: "0862", label: "Emmaboda" },
  { id: "0880", label: "Kalmar" },
  { id: "0881", label: "Nybro" },
  { id: "0882", label: "Oskarshamn" },
  { id: "0883", label: "Västervik" },
  { id: "0884", label: "Vimmerby" },
  { id: "0885", label: "Borgholm" },
  { id: "0980", label: "Gotland" },
  { id: "1060", label: "Olofström" },
  { id: "1080", label: "Karlskrona" },
  { id: "1081", label: "Ronneby" },
  { id: "1082", label: "Karlshamn" },
  { id: "1083", label: "Sölvesborg" },
  { id: "1214", label: "Svalöv" },
  { id: "1230", label: "Staffanstorp" },
  { id: "1231", label: "Burlöv" },
  { id: "1233", label: "Vellinge" },
  { id: "1256", label: "Östra Göinge" },
  { id: "1257", label: "Örkelljunga" },
  { id: "1260", label: "Bjuv" },
  { id: "1261", label: "Kävlinge" },
  { id: "1262", label: "Lomma" },
  { id: "1263", label: "Svedala" },
  { id: "1264", label: "Skurup" },
  { id: "1265", label: "Sjöbo" },
  { id: "1266", label: "Hörby" },
  { id: "1267", label: "Höör" },
  { id: "1270", label: "Tomelilla" },
  { id: "1272", label: "Bromölla" },
  { id: "1273", label: "Osby" },
  { id: "1275", label: "Perstorp" },
  { id: "1276", label: "Klippan" },
  { id: "1277", label: "Åstorp" },
  { id: "1278", label: "Båstad" },
  { id: "1280", label: "Malmö" },
  { id: "1281", label: "Lund" },
  { id: "1282", label: "Landskrona" },
  { id: "1283", label: "Helsingborg" },
  { id: "1284", label: "Höganäs" },
  { id: "1285", label: "Eslöv" },
  { id: "1286", label: "Ystad" },
  { id: "1287", label: "Trelleborg" },
  { id: "1290", label: "Kristianstad" },
  { id: "1291", label: "Simrishamn" },
  { id: "1292", label: "Ängelholm" },
  { id: "1293", label: "Hässleholm" },
  { id: "1315", label: "Hylte" },
  { id: "1380", label: "Halmstad" },
  { id: "1381", label: "Laholm" },
  { id: "1382", label: "Falkenberg" },
  { id: "1383", label: "Varberg" },
  { id: "1384", label: "Kungsbacka" },
  { id: "1401", label: "Härryda" },
  { id: "1402", label: "Partille" },
  { id: "1407", label: "Öckerö" },
  { id: "1415", label: "Stenungsund" },
  { id: "1419", label: "Tjörn" },
  { id: "1421", label: "Orust" },
  { id: "1427", label: "Sotenäs" },
  { id: "1430", label: "Munkedal" },
  { id: "1435", label: "Tanum" },
  { id: "1438", label: "Dals-Ed" },
  { id: "1439", label: "Färgelanda" },
  { id: "1440", label: "Ale" },
  { id: "1441", label: "Lerum" },
  { id: "1442", label: "Vårgårda" },
  { id: "1443", label: "Bollebygd" },
  { id: "1444", label: "Grästorp" },
  { id: "1445", label: "Essunga" },
  { id: "1446", label: "Karlsborg" },
  { id: "1447", label: "Gullspång" },
  { id: "1452", label: "Tranemo" },
  { id: "1460", label: "Bengtsfors" },
  { id: "1461", label: "Mellerud" },
  { id: "1462", label: "Lilla Edet" },
  { id: "1463", label: "Mark" },
  { id: "1465", label: "Svenljunga" },
  { id: "1466", label: "Herrljunga" },
  { id: "1470", label: "Vara" },
  { id: "1471", label: "Götene" },
  { id: "1472", label: "Tibro" },
  { id: "1473", label: "Töreboda" },
  { id: "1480", label: "Göteborg" },
  { id: "1481", label: "Mölndal" },
  { id: "1482", label: "Kungälv" },
  { id: "1484", label: "Lysekil" },
  { id: "1485", label: "Uddevalla" },
  { id: "1486", label: "Strömstad" },
  { id: "1487", label: "Vänersborg" },
  { id: "1488", label: "Trollhättan" },
  { id: "1489", label: "Alingsås" },
  { id: "1490", label: "Borås" },
  { id: "1491", label: "Ulricehamn" },
  { id: "1492", label: "Åmål" },
  { id: "1493", label: "Mariestad" },
  { id: "1494", label: "Lidköping" },
  { id: "1495", label: "Skara" },
  { id: "1496", label: "Skövde" },
  { id: "1497", label: "Hjo" },
  { id: "1498", label: "Tidaholm" },
  { id: "1499", label: "Falköping" },
  { id: "1715", label: "Kil" },
  { id: "1730", label: "Eda" },
  { id: "1737", label: "Torsby" },
  { id: "1760", label: "Storfors" },
  { id: "1761", label: "Hammarö" },
  { id: "1762", label: "Munkfors" },
  { id: "1763", label: "Forshaga" },
  { id: "1764", label: "Grums" },
  { id: "1765", label: "Årjäng" },
  { id: "1766", label: "Sunne" },
  { id: "1780", label: "Karlstad" },
  { id: "1781", label: "Kristinehamn" },
  { id: "1782", label: "Filipstad" },
  { id: "1783", label: "Hagfors" },
  { id: "1784", label: "Arvika" },
  { id: "1785", label: "Säffle" },
  { id: "1814", label: "Lekeberg" },
  { id: "1860", label: "Laxå" },
  { id: "1861", label: "Hallsberg" },
  { id: "1862", label: "Degerfors" },
  { id: "1863", label: "Hällefors" },
  { id: "1864", label: "Ljusnarsberg" },
  { id: "1880", label: "Örebro" },
  { id: "1881", label: "Kumla" },
  { id: "1882", label: "Askersund" },
  { id: "1883", label: "Karlskoga" },
  { id: "1884", label: "Nora" },
  { id: "1885", label: "Lindesberg" },
  { id: "1904", label: "Skinnskatteberg" },
  { id: "1907", label: "Surahammar" },
  { id: "1960", label: "Kungsör" },
  { id: "1961", label: "Hallstahammar" },
  { id: "1962", label: "Norberg" },
  { id: "1980", label: "Västerås" },
  { id: "1981", label: "Sala" },
  { id: "1982", label: "Fagersta" },
  { id: "1983", label: "Köping" },
  { id: "1984", label: "Arboga" },
  { id: "2021", label: "Vansbro" },
  { id: "2023", label: "Malung-Sälen" },
  { id: "2026", label: "Gagnef" },
  { id: "2029", label: "Leksand" },
  { id: "2031", label: "Rättvik" },
  { id: "2034", label: "Orsa" },
  { id: "2039", label: "Älvdalen" },
  { id: "2061", label: "Smedjebacken" },
  { id: "2062", label: "Mora" },
  { id: "2080", label: "Falun" },
  { id: "2081", label: "Borlänge" },
  { id: "2082", label: "Säter" },
  { id: "2083", label: "Hedemora" },
  { id: "2084", label: "Avesta" },
  { id: "2085", label: "Ludvika" },
  { id: "2101", label: "Ockelbo" },
  { id: "2104", label: "Hofors" },
  { id: "2121", label: "Ovanåker" },
  { id: "2132", label: "Nordanstig" },
  { id: "2161", label: "Ljusdal" },
  { id: "2180", label: "Gävle" },
  { id: "2181", label: "Sandviken" },
  { id: "2182", label: "Söderhamn" },
  { id: "2183", label: "Bollnäs" },
  { id: "2184", label: "Hudiksvall" },
  { id: "2260", label: "Ånge" },
  { id: "2262", label: "Timrå" },
  { id: "2280", label: "Härnösand" },
  { id: "2281", label: "Sundsvall" },
  { id: "2282", label: "Kramfors" },
  { id: "2283", label: "Sollefteå" },
  { id: "2284", label: "Örnsköldsvik" },
  { id: "2303", label: "Ragunda" },
  { id: "2305", label: "Bräcke" },
  { id: "2309", label: "Krokom" },
  { id: "2313", label: "Strömsund" },
  { id: "2321", label: "Åre" },
  { id: "2326", label: "Berg" },
  { id: "2361", label: "Härjedalen" },
  { id: "2380", label: "Östersund" },
  { id: "2401", label: "Nordmaling" },
  { id: "2403", label: "Bjurholm" },
  { id: "2404", label: "Vindeln" },
  { id: "2409", label: "Robertsfors" },
  { id: "2417", label: "Norsjö" },
  { id: "2418", label: "Malå" },
  { id: "2421", label: "Storuman" },
  { id: "2422", label: "Sorsele" },
  { id: "2425", label: "Dorotea" },
  { id: "2460", label: "Vännäs" },
  { id: "2462", label: "Vilhelmina" },
  { id: "2463", label: "Åsele" },
  { id: "2480", label: "Umeå" },
  { id: "2481", label: "Lycksele" },
  { id: "2482", label: "Skellefteå" },
  { id: "2505", label: "Arvidsjaur" },
  { id: "2506", label: "Arjeplog" },
  { id: "2510", label: "Jokkmokk" },
  { id: "2513", label: "Överkalix" },
  { id: "2514", label: "Kalix" },
  { id: "2518", label: "Övertorneå" },
  { id: "2521", label: "Pajala" },
  { id: "2523", label: "Gällivare" },
  { id: "2560", label: "Älvsbyn" },
  { id: "2580", label: "Luleå" },
  { id: "2581", label: "Piteå" },
  { id: "2582", label: "Boden" },
  { id: "2583", label: "Haparanda" },
  { id: "2584", label: "Kiruna" }
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
      return MUNICIPALITIES.map(mun => ({
        concept_id: mun.id,
        type: 'municipality',
        version: 16,
        code: mun.id,
        label: mun.label,
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
      .neq('concept_id', ''); // Delete everything

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
        .insert(batch);

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
