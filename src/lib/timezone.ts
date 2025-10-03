import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const STOCKHOLM_TZ = 'Europe/Stockholm';

/**
 * Konverterar Stockholm-tid till UTC för databas-lagring
 */
export const stockholmToUTC = (date: Date): string => {
  return fromZonedTime(date, STOCKHOLM_TZ).toISOString();
};

/**
 * Konverterar UTC från databas till Stockholm-tid för visning
 */
export const utcToStockholm = (utcDate: Date | string): Date => {
  return toZonedTime(new Date(utcDate), STOCKHOLM_TZ);
};

/**
 * Hämtar nuvarande tid i Stockholm
 */
export const nowInStockholm = (): Date => {
  return toZonedTime(new Date(), STOCKHOLM_TZ);
};

/**
 * Hämtar nuvarande tid som UTC string för databas-queries
 */
export const nowUTC = (): string => {
  return new Date().toISOString();
};
