'use strict';
(async()=>{let mainReady=false;try{
const [SUMMARY,EXTRA]=await Promise.all([parent.WBVault.json('analysis/summary'),parent.WBVault.json('analysis/geography')]);
const allUnits=SUMMARY.flatMap(item=>item.breakdowns?.units||[]),clusters=allUnits.filter(u=>u.level==='cluster');
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=v=>typeof v==='number'&&Number.isFinite(v),number=v=>finite(v)?Math.round(v).toLocaleString('en-GB'):'—';
const decimal=(v,digits=1)=>finite(v)?v.toLocaleString('en-GB',{minimumFractionDigits:digits,maximumFractionDigits:digits}):'—';
const short=v=>String(v||'').replace(' Borderland Cluster',''),empty='<p class="empty">No data is available for this selection.</p>';
const state={cluster:(SUMMARY.find(s=>s.code==='karamoja')||SUMMARY[0]).code,level:'district',country:'Tajikistan',acledUnit:'',acledMetric:'incidents',healthMode:'motor',healthMeasure:'people',projectGroup:'outcomes'};
const rowKey=u=>' data-unit="'+esc(u.key)+'"';
function unitName(u){return u.level==='cluster'?short(u.clusterTitle):u.level==='country'?u.country:u.adm3Name||u.adm2Name||u.label;}
function unitContext(u){if(u.level==='cluster')return 'Whole study area';if(u.level==='country')return short(u.clusterTitle)+' · study portion';return [u.country,u.adm3Name?u.adm2Name:u.adm1Name,u.label==='Osh city'?'Municipality · Admin 1':u.adminLevel===2?'Admin 2':''].filter(Boolean).join(' · ');}
function label(u,note=''){return '<div class="area-label">'+esc(unitName(u))+'<small>'+esc(unitContext(u))+'</small>'+(note?'<small>'+esc(note)+'</small>':'')+'</div>';}
function units(){return allUnits.filter(u=>u.level===state.level&&(state.level==='cluster'||u.clusterCode===state.cluster)&&(!state.country||u.country===state.country));}
function sortUnits(rows,get,byName=false){return rows.slice().sort((a,b)=>{if(byName)return unitName(a).localeCompare(unitName(b));const av=get(a),bv=get(b);return (finite(bv)?bv:-Infinity)-(finite(av)?av:-Infinity)||unitName(a).localeCompare(unitName(b));});}
function population(u){return finite(u.population)?u.population:null;}
function area(u){return finite(u.catchmentAreaKm2)?u.catchmentAreaKm2:EXTRA.environment[u.key]?.areaKm2;}
function density(u){const p=population(u),a=area(u);return finite(p)&&finite(a)&&a>0?p/a:null;}
function numberBar(value,max,cls='',format=number,description=''){
 if(!finite(value))return '<div class="missing">No estimate</div>';
 const width=Math.max(0,Math.min(100,max>0?100*value/max:0));
 return '<div class="number-bar '+cls+'" title="'+esc(description)+'"><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:'+width+'%"></div></div><span class="bar-value">'+format(value)+'</span></div>';
}
const exportAPI = window.WBAnalysisExport;
const unitFields = ['area_id','area','cluster','country','geography_level','source_admin_level','boundary_basis'];
const unitValues = u => [u.key,unitName(u),short(u.clusterTitle),u.country,u.level,u.adminLevel,'Portion inside the analytical borderland boundary'];
function setExport(id, fields, rows, suffix) {
 exportAPI.register(id, () => exportAPI.saveCSV(id, fields, rows, 'borderland-'+id+'-'+(suffix || (state.level==='cluster'?'all-clusters':state.cluster+(state.country?'-'+state.country:'')))+'.csv'));
}
function populationExport(rows){setExport('population',[...unitFields,'population_2025','source_cell_area_coverage_pct','area_km2','people_per_km2','source','notes'],rows.map(u=>[...unitValues(u),population(u),u.populationCoveragePct,area(u),density(u),'WorldPop 2025','Modelled population; not whole-admin census totals']));}
function landExport(rows){setExport('landcover',[...unitFields,...EXTRA.landClasses.map(c=>c.key+'_pct'),'area_coverage_pct','area_with_land_cover_km2','source','method'],rows.map(u=>[...unitValues(u),...EXTRA.landClasses.map((c,i)=>env(u).land?.shares?.[i]),env(u).land?.coveragePct,env(u).land?.areaKm2,'ESA WorldCover 2021','5 km cell composition weighted by boundary-overlap area; percentages of covered area']));}
function builtExport(rows){setExport('settlement',[...unitFields,'built_2000_km2','built_2020_km2','change_km2','area_coverage_pct','comparable_area_km2','source','method'],rows.map(u=>{const b=env(u).built||{};return [...unitValues(u),b.year2000Km2,b.year2020Km2,b.changeKm2,b.coveragePct,b.areaKm2,'GHSL GHS-BUILT-S R2023A','5 km cell means weighted by overlap; same valid cells for both epochs'];}));}
function healthExport(rows){setExport('healthcare',[...unitFields,'travel_mode','ranking_measure','population_total_2025','population_with_travel_time','within_two_hours_people','beyond_two_hours_people','beyond_two_hours_pct','population_coverage_pct','source','notes'],rows.map(u=>{const h=health(u);return [...unitValues(u),state.healthMode,state.healthMeasure,h.population_total,h.population_analysed,h.pop_le120,h.pop_gt120,h.pct_gt120,h.coverage_pct,'WorldPop 2025; Malaria Atlas Project 2019','Modelled travel times; share denominator excludes uncovered population; not facility quality or capacity'];}));}
function violenceExport(u,cover,series){setExport('violence',[...unitFields,'month','recorded_incidents','reported_fatalities','partial_month','coverage_start','coverage_end','selected_chart_measure','source','event_types','notes'],u?series.map(r=>[...unitValues(u),r.period,r.incidents,r.fatalities,!!r.partial,cover.start,cover.end,state.acledMetric,'ACLED','All supplied event types, including protests and riots','Reported events; partial months are not complete-month totals; retain ACLED attribution and use terms']):[],u?u.key.replace(/[^a-z0-9_-]/gi,'-'):state.cluster);}
function projectsExport(families,rows,display){setExport('portfolio',['cluster','country_filter','location_evidence_filter','working_area_filter','organisation_filter','period_filter','grouping','category','distinct_project_families','selected_families_total','family_ids','source','notes'],rows.map(([key,count])=>[short(SUMMARY.find(s=>s.code===state.cluster)?.title),state.country||'All countries',$('projectEvidence').value,$('portfolioOutcome').selectedOptions[0]?.textContent,$('portfolioOrganisation').value||'All reporting organisations',$('portfolioPeriod').value||'Available records',state.projectGroup,display(key),count,families.length,families.filter(p=>state.projectGroup==='outcomes'?(p.outcomes.length?p.outcomes:['unclassified']).includes(key):p.organisations.includes(key)).map(p=>p.id).join('; '),'IATI publisher records via d-portal','Distinct families per category; categories can overlap and must not be summed; counts are not spending, delivery or impact']),state.cluster+(state.country?'-'+state.country:''));}

function renderPopulation(){
 const order=$('populationSort').value,rows=sortUnits(units(),order==='density'?density:population,order==='name'),maxP=Math.max(0,...rows.map(u=>population(u)||0)),maxD=Math.max(0,...rows.map(u=>density(u)||0));
 populationExport(rows);
 $('populationSummary').textContent=rows.length+' areas · separate scales for population and density';
 $('populationChart').innerHTML=rows.map(u=>'<div class="comparison-row"'+rowKey(u)+'>'+label(u,finite(area(u))?decimal(area(u))+' km² in study area · '+decimal(u.populationCoveragePct)+'% source-cell area coverage':'Area estimate unavailable')+numberBar(population(u),maxP,'',number,unitName(u)+': '+number(population(u))+' estimated residents')+numberBar(density(u),maxD,'density',decimal,unitName(u)+': '+decimal(density(u))+' people per km²')+'</div>').join('')||empty;
}
const env=u=>EXTRA.environment[u.key]||{};
function coverageText(pct){return finite(pct)?decimal(pct)+'% area coverage':'Coverage unavailable';}

function renderRainfall(){
 const rows=sortUnits(units(),u=>env(u).rainfall?.rain2025?.mean_mm);
 $('rainfallChart').innerHTML=rows.map(u=>{const r=env(u).rainfall||{};return '<div class="comparison-row"'+rowKey(u)+'>'+label(u,coverageText(r.rain2025?.coverage_pct))+numberBar(r.rain2025?.mean_mm,3000,'',decimal,'2025 rainfall total in mm; 0–3,000 mm scale')+numberBar(r.rain202609?.mean_mm,400,'density',decimal,'September 2026 rainfall total in mm; 0–400 mm scale')+'</div>';}).join('')||empty;
 setExport('rainfall',[...unitFields,'rainfall_2025_mm','rainfall_september_2026_mm','annual_source_area_coverage_pct','monthly_source_area_coverage_pct','source','method'],rows.map(u=>{const r=env(u).rainfall||{};return [...unitValues(u),r.rain2025?.mean_mm,r.rain202609?.mean_mm,r.rain2025?.coverage_pct,r.rain202609?.coverage_pct,'CHIRPS v3','Valid source-cell area-weighted mean rainfall depth; totals, not anomalies'];}));
}

function renderWater(){
 const rows=sortUnits(units(),u=>env(u).water?.seasonality?.any_pct),max=Math.max(1,...rows.map(u=>env(u).water?.seasonality?.any_pct||0));
 $('waterAxis').textContent='Water area · % of observed area · scale 0–'+decimal(max)+'%';
 $('waterChart').innerHTML=rows.map(u=>{const w=env(u).water?.seasonality;if(!w)return '<div class="bar-row">'+label(u)+'<span class="missing">No water observations</span></div>';return '<div class="bar-row"'+rowKey(u)+'>'+label(u,decimal(w.valid_area_km2)+' km² observed')+'<div class="stack" style="width:'+(100*w.any_pct/max)+'%"><span class="segment" style="width:'+(w.any_pct?100*w.permanent_pct/w.any_pct:0)+'%;background:#245a86" title="Permanent water: '+decimal(w.permanent_pct,2)+'%"></span><span class="segment" style="width:'+(w.any_pct?100*w.seasonal_pct/w.any_pct:0)+'%;background:#84b8dc" title="Seasonal water: '+decimal(w.seasonal_pct,2)+'%"></span></div><div class="change-value">'+decimal(w.any_pct,2)+'%<small>'+decimal(w.any_km2,2)+' km²</small></div></div>';}).join('')||empty;
 setExport('surface-water',[...unitFields,'observed_area_km2','any_water_pct','permanent_water_pct','seasonal_water_pct','any_water_km2','permanent_water_km2','seasonal_water_km2','mean_occurrence_1984_2024_pct','source','method'],rows.map(u=>{const w=env(u).water?.seasonality||{};return [...unitValues(u),w.valid_area_km2,w.any_pct,w.permanent_pct,w.seasonal_pct,w.any_km2,w.permanent_km2,w.seasonal_km2,env(u).water?.occurrence?.mean,'JRC GSW v1.5; seasonality 2024; occurrence 1984–2024','Native pixels assigned by centre and weighted by equal-area cell area; zero retained, NoData excluded'];}));
}

function renderLand(){
 const key=$('landSort').value,index=EXTRA.landClasses.findIndex(c=>c.key===key),rows=sortUnits(units(),u=>env(u).land?.shares?.[index],key==='name');
 landExport(rows);
 $('landChart').innerHTML=rows.map(u=>{const data=env(u).land,shares=data?.shares;
  if(!shares)return '<div class="bar-row"'+rowKey(u)+'>'+label(u)+'<span class="missing">No land-cover estimate</span><span></span></div>';
  const total=shares.reduce((a,b)=>a+b,0),dominant=shares.indexOf(Math.max(...shares));
  const segments=shares.map((value,i)=>{const c=EXTRA.landClasses[i],text=c.label+': '+decimal(value)+'%';return value>0?'<span class="segment" role="img" tabindex="0" aria-label="'+esc(unitName(u)+' — '+text)+'" title="'+esc(text)+'" style="width:'+(100*value/total)+'%;background:'+c.colour+'"></span>':'';}).join('');
  return '<div class="bar-row"'+rowKey(u)+'>'+label(u,coverageText(data.coveragePct))+'<div class="stack">'+segments+'</div><div class="land-value">'+esc(EXTRA.landClasses[dominant].label)+'<br>'+decimal(shares[dominant])+'%</div></div>';
 }).join('')||empty;
}
function builtNumber(v){if(finite(v)&&v>0&&v<.01)return '&lt;0.01';return decimal(v,2);}
function renderBuilt(){
 const key=$('builtSort').value,rows=sortUnits(units(),u=>env(u).built?.[key==='2020'?'year2020Km2':'changeKm2'],key==='name');
 const max=Math.max(0,...rows.flatMap(u=>[env(u).built?.year2000Km2||0,env(u).built?.year2020Km2||0]));
 builtExport(rows);
 $('builtChart').innerHTML=rows.map(u=>{const b=env(u).built;
  if(!finite(b?.year2000Km2)||!finite(b?.year2020Km2))return '<div class="built-row"'+rowKey(u)+'>'+label(u)+'<span class="missing">No comparable pair of estimates</span><span></span></div>';
  const change=b.changeKm2,changeText=(change>.005?'+':'')+decimal(change,2);
  return '<div class="built-row"'+rowKey(u)+'>'+label(u,coverageText(b.coveragePct))+'<div class="paired-bars">'+numberBar(b.year2000Km2,max,'early',builtNumber,'2000: '+decimal(b.year2000Km2,2)+' km²')+numberBar(b.year2020Km2,max,'late',builtNumber,'2020: '+decimal(b.year2020Km2,2)+' km²')+'</div><div class="change-value">'+changeText+'</div></div>';
 }).join('')||empty;
}
function health(u){return u.healthcare?.[state.healthMode]||{};}
function renderHealth(){
 const isShare=state.healthMeasure==='share',rows=sortUnits(units(),u=>health(u)[isShare?'pct_gt120':'pop_gt120']),max=Math.max(0,...rows.map(u=>health(u).population_analysed||0));
 healthExport(rows);
 $('healthAxis').textContent=isShare?'Share of population with travel-time data':'Estimated people · common scale';
 $('healthChart').innerHTML=rows.map(u=>{const h=health(u),denom=h.population_analysed;
  if(!finite(denom)||denom<=0)return '<div class="bar-row"'+rowKey(u)+'>'+label(u)+'<span class="missing">No population with travel-time data</span><span></span></div>';
  const values=[h.pop_le120,h.pop_gt120],colours=['#acbfcc','#a25546'],labels=['Within two hours','Beyond two hours'];
  if(!values.every(finite))return '<div class="bar-row"'+rowKey(u)+'>'+label(u)+'<span class="missing">Incomplete travel-time estimate</span><span></span></div>';
  const segments=values.map((v,i)=>{const text=labels[i]+': '+number(v)+' people ('+decimal(100*v/denom)+'%)';return '<span class="segment" role="img" tabindex="0" aria-label="'+esc(unitName(u)+' — '+text)+'" title="'+esc(text)+'" style="width:'+(100*v/denom)+'%;background:'+colours[i]+'"></span>';}).join('');
  const value=isShare?decimal(h.pct_gt120)+'%':number(h.pop_gt120),second=isShare?number(h.pop_gt120)+' people':decimal(h.pct_gt120)+'%';
  return '<div class="bar-row"'+rowKey(u)+'>'+label(u,decimal(h.coverage_pct)+'% population coverage')+'<div class="stack" style="width:'+(isShare?100:100*denom/max)+'%">'+segments+'</div><div class="change-value">'+value+'<small>'+second+'</small></div></div>';
 }).join('')||empty;
}
function svgLine(series,metric){
 const width=1000,height=285,left=64,right=28,top=20,bottom=44,w=width-left-right,h=height-top-bottom,values=series.map(x=>finite(x[metric])?x[metric]:0),rawMax=Math.max(4,...values),step=Math.max(1,Math.ceil(rawMax/4)),max=step*4,colour=metric==='fatalities'?'#744450':'#a24f4d';
 const point=(i,v)=>[left+(series.length<=1?0:w*i/(series.length-1)),top+h-h*v/max];let marks='';
 for(let i=0;i<=4;i++){const y=top+h-h*i/4;marks+='<line x1="'+left+'" y1="'+y+'" x2="'+(width-right)+'" y2="'+y+'" stroke="#e1e7ec"/><text x="'+(left-12)+'" y="'+(y+4)+'" text-anchor="end" fill="#647b8c">'+number(step*i)+'</text>';}
 const every=Math.max(1,Math.ceil(series.length/7));series.forEach((s,i)=>{if(i%every===0||i===series.length-1){const p=point(i,0);marks+='<text x="'+p[0]+'" y="'+(height-15)+'" text-anchor="middle" fill="#647b8c">'+esc(s.period)+(s.partial?'*':'')+'</text>';}});
 let lines='';for(let i=1;i<series.length;i++){const a=point(i-1,values[i-1]),b=point(i,values[i]);lines+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+colour+'" stroke-width="2.4"'+(series[i].partial||series[i-1].partial?' stroke-dasharray="5 5"':'')+'/>';}
 const dots=series.map((s,i)=>{const p=point(i,values[i]);return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+(s.partial?'white':colour)+'" stroke="'+colour+'" tabindex="0" aria-label="'+esc(s.period+': '+number(values[i])+' '+metric)+'"><title>'+esc(s.period)+': '+number(values[i])+' '+metric+'</title></circle>';}).join('');
 return '<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Monthly recorded '+metric+'"><title>Monthly recorded '+metric+'</title>'+marks+lines+dots+'</svg>';
}
function renderAcled(){
 const u=allUnits.find(u=>u.key===state.acledUnit),cover=SUMMARY.find(s=>s.code===(u?.clusterCode||state.cluster))?.breakdowns?.coverage||{};
 $('coverageBadge').textContent=cover.label||[cover.start,cover.end].filter(Boolean).join(' – ');
 if(!u){violenceExport(null,cover,[]);$('acledChart').innerHTML=empty;$('acledSummary').innerHTML='';return;}
 const a=u.acled||{},series=a.monthly||[];
 violenceExport(u,cover,series);
 $('acledChart').innerHTML=series.length?svgLine(series,state.acledMetric):empty;
 $('acledSummary').innerHTML='<span>Recorded incidents<strong>'+number(a.incidents)+'</strong></span><span>Reported fatalities<strong>'+number(a.fatalities)+'</strong></span>';
 $('acledFoot').textContent='Source: ACLED. All supplied event types, including protests and riots. Country and sub-district figures include only the area inside the selected borderland.'+(series.some(s=>s.partial)?' * A partial month is shown with a dashed line; the final month ends on '+(cover.end||'the last recorded date')+'.':'');
}
function fillSelect(el,options,value){el.replaceChildren();for(const [v,text] of options){const o=document.createElement('option');o.value=v;o.textContent=text;el.append(o);}el.value=options.some(([v])=>v===value)?value:(options[0]?.[0]||'');}
function fillAcled(){
 const root=clusters.find(u=>u.clusterCode===state.cluster),country=allUnits.find(u=>u.level==='country'&&u.clusterCode===state.cluster&&u.country===state.country);
 let candidates=state.level==='cluster'?clusters:[state.country?country:root,...units()];candidates=candidates.filter((u,i,a)=>u&&a.findIndex(x=>x?.key===u.key)===i);
 fillSelect($('acledAreaSelect'),candidates.map(u=>[u.key,unitName(u)+(u.level==='district'?' — '+unitContext(u):u.level==='cluster'?' · whole cluster':' · cluster portion')]),state.acledUnit);
 state.acledUnit=$('acledAreaSelect').value;renderAcled();
}
function bindButtons(id,key,render){const box=$(id);box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state[key]=b.dataset.value;box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));}
function projectMatches(p){
 const evidence=$('projectEvidence').value,org=$('portfolioOrganisation').value,outcome=$('portfolioOutcome').value,period=$('portfolioPeriod').value,country=EXTRA.countryCodes[state.country];
 if(org&&!p.organisations.includes(org))return false;
 if(outcome&&(outcome==='unclassified'?p.outcomes.length:!p.outcomes.includes(outcome)))return false;
 if(period&&(period==='closed'?!p.statuses.some(s=>['Closed','Finalising'].includes(s)):!p.statuses.includes(period)))return false;
 if(evidence==='context')return !!p.context&&(!country||p.countries.includes(country));
 return p.locations.some(loc=>(evidence==='relevant'||(evidence==='mapped'&&['local','area'].includes(loc.kind))||loc.kind===evidence)&&(!country||loc.countries.includes(country)));
}
function renderProjects(){
 const families=(EXTRA.projects[state.cluster]||[]).filter(projectMatches),counts=new Map(),group=state.projectGroup;
 for(const p of families){const keys=group==='outcomes'?(p.outcomes.length?p.outcomes:['unclassified']):p.organisations;for(const k of new Set(keys))counts.set(k,(counts.get(k)||0)+1);}
 const display=k=>group==='outcomes'?(EXTRA.outcomes[k]?.label||'Unclassified'):k;
 const rows=[...counts].sort((a,b)=>b[1]-a[1]||display(a[0]).localeCompare(display(b[0]))),max=Math.max(0,...rows.map(x=>x[1]));
 projectsExport(families,rows,display);
 $('portfolioScope').textContent=short(SUMMARY.find(s=>s.code===state.cluster)?.title)+(state.country?' · '+state.country:'');
 $('projectSummary').innerHTML='<span><strong>'+number(families.length)+'</strong>distinct project families</span>';
 $('projectChart').innerHTML=rows.map(([k,n])=>'<div class="bar-row" data-category="'+esc(k)+'"><div class="area-label">'+esc(display(k))+'</div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:'+(100*n/max)+'%;background:'+(group==='outcomes'?(EXTRA.outcomes[k]?.colour||'#798d9e'):'#497b9d')+'"></div></div><div class="bar-value">'+number(n)+'</div></div>').join('')||'<p class="empty">No projects match these filters.</p>';
}
function fillProjects(){
 const orgs=[...new Set((EXTRA.projects[state.cluster]||[]).flatMap(p=>p.organisations))].sort();
 fillSelect($('portfolioOrganisation'),[['','All reporting organisations'],...orgs.map(o=>[o,o])],$('portfolioOrganisation').value);renderProjects();
}
function refreshScope(reset=false){
 if(reset)state.acledUnit=state.country?(allUnits.find(u=>u.level==='country'&&u.clusterCode===state.cluster&&u.country===state.country)?.key||''):(clusters.find(u=>u.clusterCode===state.cluster)?.key||'');
 $('countryGroup').hidden=state.level==='cluster';
 const fallback=units().filter(u=>u.level==='district'&&u.adminLevel===2).length;
 $('scopeNote').textContent=state.level==='cluster'?'Population, deprivation, land cover, settlement, rainfall, water and healthcare charts summarise the whole study area. Recorded events retain their labelled scope.':state.level==='country'?'Country portions inside the study extent.':'District portions inside the study extent.'+(fallback?' '+fallback+' areas use supplied Admin 2 boundaries. Source polygons may overlap; district totals are not additive.':'');
 $('openMap').href='#map='+state.cluster;
 renderPopulation();renderLand();renderBuilt();renderRainfall();renderWater();renderHealth();fillAcled();fillProjects();
 window.UNDPAnalysisScope={level:state.level,country:state.country,cluster:state.cluster};document.dispatchEvent(new CustomEvent('undp:analysis-scope',{detail:window.UNDPAnalysisScope}));
}
function fillCountries(){fillSelect($('countrySelect'),[['','All countries'],...allUnits.filter(u=>u.level==='country'&&u.clusterCode===state.cluster).map(u=>[u.country,u.country])],state.country);state.country=$('countrySelect').value;}
fillSelect($('clusterSelect'),SUMMARY.map(s=>[s.code,short(s.title)]),state.cluster);fillCountries();
fillSelect($('portfolioOutcome'),[['','All working areas'],...Object.entries(EXTRA.outcomes).map(([k,v])=>[k,v.label]),['unclassified','Unclassified']],'');
$('landLegend').innerHTML=EXTRA.landClasses.map(c=>'<span><i style="background:'+c.colour+'"></i>'+esc(c.label)+'</span>').join('');
$('clusterSelect').onchange=()=>{state.cluster=$('clusterSelect').value;state.country='';fillCountries();refreshScope(true);};
$('levelSelect').onchange=()=>{state.level=$('levelSelect').value;if(state.level==='cluster'){state.country='';$('countrySelect').value='';}refreshScope(true);};
$('countrySelect').onchange=()=>{state.country=$('countrySelect').value;refreshScope(true);};
$('populationSort').onchange=renderPopulation;$('landSort').onchange=renderLand;$('builtSort').onchange=renderBuilt;
$('acledAreaSelect').onchange=()=>{state.acledUnit=$('acledAreaSelect').value;renderAcled();};
bindButtons('acledMetricButtons','acledMetric',renderAcled);bindButtons('healthModeButtons','healthMode',renderHealth);bindButtons('healthMeasureButtons','healthMeasure',renderHealth);bindButtons('projectGroupButtons','projectGroup',renderProjects);
for(const id of ['projectEvidence','portfolioOutcome','portfolioOrganisation','portfolioPeriod'])$(id).onchange=renderProjects;
$('openMap').onclick=e=>{e.preventDefault();parent.WBVault.go('map='+state.cluster);};
document.querySelectorAll('.section-nav a').forEach(a=>a.onclick=e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
refreshScope(true);mainReady=true;
}catch(error){const box=document.getElementById('analysisLoading');if(box){box.classList.add('error');box.textContent='The analysis could not load. Reopen Analysis to retry.';}console.error(error);}
finally{
  await Promise.allSettled([window.WBSedacReady,window.WBRuralReady,window.WBAnalysisFontsReady]);
  // Missing module files should leave a useful message, never an endless loader.
  const app=document.getElementById('analysisApp');app.inert=false;app.removeAttribute('inert');
  if(mainReady)document.getElementById('analysisLoading')?.remove();
  document.documentElement.dataset.analysisReady='true';
  parent.WBVault.ready?.(document,Number(document.querySelector('meta[name="wb-route-serial"]')?.content));
}})();
