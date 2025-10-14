import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const STOCKHOLM_TZ = 'Europe/Stockholm';

/**
 * Konverterar ett Date-objekt (som representerar Stockholm-tid) till UTC ISO-sträng
 * 
 * @param date - Date-objekt där getHours(), getMinutes() etc representerar Stockholm-tid
 * @returns ISO-sträng i UTC (för databas-lagring)
 * 
 * Exempel: 
 * Input: Date-objekt med 21:17 (Stockholm-tid)
 * Output: "2025-10-14T19:17:00.000Z" (UTC)
 */
export const stockholmToUTC = (date: Date): string => {
  // Extrahera datum/tid-komponenter som användaren ser
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Skapa ISO-sträng som representerar Stockholm-tid
  const stockholmTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Konvertera Stockholm-tid → UTC
  return fromZonedTime(stockholmTimeString, STOCKHOLM_TZ).toISOString();
};

/**
 * Konverterar UTC-datum från databas till Stockholm-tid
 * 
 * @param utcDate - UTC-datum (Date eller ISO-sträng)
 * @returns Date-objekt i Stockholm-tid
 */
export const utcToStockholm = (utcDate: Date | string): Date => {
  return toZonedTime(new Date(utcDate), STOCKHOLM_TZ);
};

/**
 * Hämtar nuvarande tid i Stockholm
 * 
 * @returns Date-objekt som representerar "just nu" i Stockholm
 */
export const nowInStockholm = (): Date => {
  // new Date() ger oss UTC-tid från servern
  // toZonedTime konverterar den till Stockholm-tid
  return toZonedTime(new Date(), STOCKHOLM_TZ);
};

/**
 * Hämtar nuvarande tid som UTC ISO-sträng för databas-queries
 * 
 * @returns ISO-sträng i UTC
 */
export const nowUTC = (): string => {
  return new Date().toISOString();
};
