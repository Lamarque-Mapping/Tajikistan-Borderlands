(async()=>{try{
const [study,core,roads,towns,analysis]=await Promise.all(['study','tk_borderlands/core','tk_borderlands/roads','tk_borderlands/towns','analysis/summary'].map(name=>parent.WBVault.json(name)));
const svg=document.getElementById('preview-map'),b=core.bounds,c=Math.cos((b[0][0]+b[1][0])/2*Math.PI/180),w=(b[1][1]-b[0][1])*c,h=b[1][0]-b[0][0],scale=Math.min(530/w,225/h),x0=(600-w*scale)/2,y0=(290-h*scale)/2;
const pt=a=>[(a[0]-b[0][1])*c*scale+x0,290-y0-(a[1]-b[0][0])*scale];
function line(a,close=false){return a.map((p,i)=>(i?'L':'M')+pt(p).map(v=>v.toFixed(1)).join(',')).join('')+(close?'Z':'');}
function path(g){if(g.type==='Polygon')return g.coordinates.map(a=>line(a,true)).join('');if(g.type==='MultiPolygon')return g.coordinates.flatMap(p=>p.map(a=>line(a,true))).join('');if(g.type==='LineString')return line(g.coordinates);if(g.type==='MultiLineString')return g.coordinates.map(a=>line(a)).join('');if(g.type==='GeometryCollection')return g.geometries.map(path).join('');return '';}
function el(parent,tag,attrs,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;parent.appendChild(e);return e;}
el(svg,'path',{d:study.features.map(f=>path(f.geometry)).join(''),fill:'#dce7db',stroke:'#6b8876','stroke-width':1});
el(svg,'path',{d:roads.primaryRoads.features.map(f=>path(f.geometry)).join(''),fill:'none',stroke:'#a76b45','stroke-width':1,opacity:.75});
for(const name of ['Khujand','Isfara','Batken','Osh']){const f=towns.towns.features.find(f=>f.properties.name===name);if(!f)continue;const [x,y]=pt(f.geometry.coordinates);el(svg,'circle',{cx:x,cy:y,r:3,fill:'#274d3d'});el(svg,'text',{x:x+(name==='Isfara'?-6:6),y:y+(name==='Batken'?16:-6),fill:'#274d3d','font-size':11,'text-anchor':name==='Isfara'?'end':'start'},name);}
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
