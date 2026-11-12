import {TabsTrigger,TabsList} from './ui/tabs';
import './admin-console.css';
export const adminSections=[
 ['Overview',[['overview','Attention & finances'],['metrics','Legacy booking reports']]],
 ['Bookings & Sales',[['city-cards','City Cards'],['refunds','Refunds'],['delivery','Ticket emails'],['bookings','Booking list'],['tours','Tour bookings']]],
 ['Reports',[['finance-report','Financial overview'],['driver-sales-report','Sales by driver'],['merchant-sales-report','Sales by merchant'],['perk-report','Perk usage']]],
 ['Operations',[['pickups','Dispatch']]],
 ['Partners & Perks',[['deals-merchants','Businesses & offers'],['redemptions','Redemptions']]],
 ['Staff & Access',[['staff','Staff profiles']]],
 ['Pricing & Availability',[['city-pricing','City Card prices'],['availability','Capacity & hours'],['settings','Legacy website settings']]],
 ['Messages',[['messages','Inbox']]],
 ['Website & Content',[['content','Pages'],['blog','Blog'],['private-tours','Tour products'],['images','Images'],['planner-images','Planner images'],['cinema-no-mato','Cinema no Mato'],['seo','SEO'],['tags','Tags']]],
 ['System & Activity',[['activity','Admin activity'],['dev','Maintenance tests'],['cleanup','Diagnostics & cleanup']]],
] as const;
export const validAdminTabs=adminSections.flatMap(([,tabs])=>tabs.map(([id])=>id)) as readonly string[];
export function AdminNavigation({active,onNavigate}:{active:string;onNavigate:(tab:string)=>void}){
 const group=adminSections.find(([,tabs])=>tabs.some(([id])=>id===active))||adminSections[0];
 return <nav aria-label="Admin sections" className="admin-navigation"><p className="admin-nav-label">WORKSPACE</p><div className="admin-section-list">{adminSections.map(([label,tabs])=><button key={label} type="button" data-slot="tabs-trigger" data-state={label===group[0]?"active":"inactive"} aria-current={label===group[0]?"page":undefined} onClick={()=>onNavigate(tabs[0][0])} className="admin-section-trigger">{label}</button>)}</div><div className="admin-subsections"><p className="admin-nav-label">{group[0]}</p><TabsList className="admin-section-list">{group[1].map(([id,label])=><TabsTrigger key={id} value={id} className="admin-subsection-trigger">{label}</TabsTrigger>)}</TabsList></div></nav>;
}
