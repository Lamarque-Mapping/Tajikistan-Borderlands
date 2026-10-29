(async()=>{try{
const analysis=await parent.WBVault.json('analysis/summary');
const chart=document.getElementById('preview-analysis');
chart.className='population-preview';
const title=document.createElement('div');title.className='preview-heading';title.innerHTML='<strong>Population</strong><span>Largest Tajik district populations · 2025</span>';chart.appendChild(title);
const header=document.createElement('div');header.className='preview-columns';header.innerHTML='<span>District</span><span>People</span><span>People / km²</span>';chart.appendChild(header);
const rows=analysis[0].breakdowns.units.filter(u=>u.level==='district'&&u.country==='Tajikistan'&&Number.isFinite(u.population)).sort((a,b)=>b.population-a.population).slice(0,5);
const density=r=>r.population/r.catchmentAreaKm2;
const maxP=Math.max(...rows.map(r=>r.population)),maxD=Math.max(...rows.map(density));
const number=v=>Math.round(v).toLocaleString('en-GB'),decimal=v=>v.toLocaleString('en-GB',{maximumFractionDigits:1,minimumFractionDigits:1});
function bar(value,max,text,cls){
 const cell=document.createElement('span');cell.className='preview-metric '+cls;
 const track=document.createElement('span');track.className='preview-bar-track';track.setAttribute('aria-hidden','true');
 const fill=document.createElement('i');fill.style.width=100*value/max+'%';track.appendChild(fill);
 const label=document.createElement('span');label.className='preview-value';label.textContent=text;
 cell.append(track,label);return cell;
}
for(const r of rows){
 const name=r.label.replace(' District',''),d=density(r);
 const row=document.createElement('div');row.className='preview-row';row.title=name+': '+number(r.population)+' estimated people; '+decimal(d)+' people per km²';row.setAttribute('aria-label',row.title);
 const label=document.createElement('span');label.className='preview-name';label.textContent=name;
 row.append(label,bar(r.population,maxP,Math.round(r.population/1000)+'k','population'),bar(d,maxD,decimal(d),'density'));chart.appendChild(row);
}
const source=document.createElement('p');source.className='preview-source';source.textContent='WorldPop estimates · district portions in the study · separate scales';chart.appendChild(source);
}catch(e){console.error('Home previews',e);}})();
