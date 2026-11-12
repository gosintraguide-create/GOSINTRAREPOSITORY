import {useCardTranslation} from '../lib/translations/useCardTranslation';
import {Link, useOutletContext} from 'react-router';
import {getCityCardCopy} from '../lib/translations/cityCardCopy';
import {getTranslation} from '../lib/translations/loader';
import './CustomerCityCards.css';
function CityCardRules() {
  const {language='en'}=useOutletContext<{language:string}>();const p=getCityCardCopy(language);
  return <ul className="cc-list" lang={language}>{[p.ages,p.companion,p.vehicle,p.hours,p.perks,p.cancel,p.refund,p.excluded].map(text=><li key={text}>{text}</li>)}</ul>;
}
export function CityCardTermsPage() {
  const {language='en'}=useOutletContext<{language:string}>();const p=getCityCardCopy(language),t=getTranslation(language);
  return <main className="customer-cards" lang={language}><Link to="/buy-ticket">{p.buy}</Link><section className="cc-panel"><h1>{p.terms}</h1><p>{p.legacy}</p><CityCardRules /><p><a href="mailto:hoponsintra@gmail.com">hoponsintra@gmail.com</a> · <Link to="/terms-of-service">{t.footer.terms}</Link> · <Link to="/privacy-policy">{t.footer.privacyPolicy}</Link></p></section></main>;
}
