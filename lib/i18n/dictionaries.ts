import 'server-only';

const dictionaries = {
  en: () => import('../../data/dictionaries/en.json').then((module) => module.default),
  es: () => import('../../data/dictionaries/es.json').then((module) => module.default),
  fr: () => import('../../data/dictionaries/fr.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = Awaited<ReturnType<typeof dictionaries.en>>;

export const getDictionary = async (locale: string) => {
  const lang = (dictionaries as any)[locale] ? locale : 'en';
  return (dictionaries as any)[lang]() as Promise<Dictionary>;
};

// We also need a sync version for client side if we pass the dictionary directly
export const defaultLocale = 'es'; // As requested by user to be Spanish by default, or we can use 'en'. Let's use 'es' as default because the user speaks Spanish ("Vamos a hacer"). Wait, the original text was English, let's keep 'en' as default if not found.
