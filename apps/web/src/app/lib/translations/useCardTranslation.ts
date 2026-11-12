import {useOutletContext} from 'react-router';
import messages from './card-ui.json';
import {getCityCardCopy} from './cityCardCopy';

export type CardMessage = keyof typeof messages.en;
type Values = Record<string, string | number | null | undefined>;
export function cardTranslator(language: string) {
  const locale = language in messages ? language as keyof typeof messages : 'en';
  const formatLocale = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : locale;
  const t = (key: CardMessage, values: Values = {}) => messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));
  return {
    language: locale, t, policy: getCityCardCopy(locale),
    money: (cents: number) => new Intl.NumberFormat(formatLocale, {style: 'currency', currency: 'EUR'}).format(cents / 100),
    date: (value: string) => new Intl.DateTimeFormat(formatLocale, {timeZone: 'Europe/Lisbon', dateStyle: 'medium'}).format(new Date(value + 'T12:00:00Z')),
    ageLabels: {full: t('full'), half: t('half'), free: t('free'), unknown: t('unknown')},
    status: (value: string) => {
      const keys: Record<string, CardMessage> = {active:'active', confirmed:'active', valid:'active', cancelled:'cancelled', canceled:'cancelled', expired:'expired', pending:'pending', reserved:'pending', submitted:'processing', processing:'processing', succeeded:'succeeded', completed:'succeeded', refunded:'succeeded', failed:'failed', review:'reviewNeeded'};
      return t(keys[value] || 'unknownStatus');
    },
    error: (error: unknown, fallback: CardMessage = 'requestError') => {
      const message = error instanceof Error ? error.message : String(error ?? '');
      // Local errors already contain translated copy. Do not expose raw provider/server text.
      // Errors may have arrived before a language switch; resolve their key again.
      for (const [sourceLocale, dictionary] of Object.entries(messages)) {
        const key = (Object.keys(dictionary) as CardMessage[]).find(key => dictionary[key] === message);
        if (key) return t(key);
        if (message === getCityCardCopy(sourceLocale).companion) return getCityCardCopy(locale).companion;
      }
      if (/sign in|unauthorized|jwt|session.*expired/i.test(message)) return t('signinError');
      if (/prices have changed|operating hours changed/i.test(message)) return t('pricesChanged');
      if (/free cancellation closed/i.test(message)) return t('cancelClosed');
      if (/cards changed/i.test(message)) return t('cancelChanged');
      if (/support|configuration mismatch/i.test(message)) return t('supportError');
      if (/not enough (cards|seats)/i.test(message)) return t('capacity');
      if (/finish or cancel|active checkout/i.test(message)) return t('pendingHelp');
      if (/sales are currently paused/i.test(message)) return t('salesPaused');
      if (/same-day purchases/i.test(message)) return t('sameDay');
      if (/children need a full-price/i.test(message)) return getCityCardCopy(locale).companion;
      if (/name and age category/i.test(message)) return t('invalidCards');
      if (/first-departure|open visit date|not open for booking|valid visit date/i.test(message)) return t('availabilityError');
      return t(fallback);
    },
  };
}
export function useCardTranslation() {
  const context = useOutletContext<{language?: string} | undefined>();
  return cardTranslator(context?.language || 'en');
}
