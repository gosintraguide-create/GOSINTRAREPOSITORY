import copy from './city-card-copy.json';
export function getCityCardCopy(language: string = 'en') {
  return copy[language as keyof typeof copy] || copy.en;
}
