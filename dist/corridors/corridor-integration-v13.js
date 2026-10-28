'use strict';
// Reviewed QGIS outputs. Installed inside the existing map view lifecycle.
window.createWBCorridors = function ({DATA,map,svgRenderer,setPreset,currentView,openProject}) {
  const el=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=0)=>v==null?'Not defined':Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
  const fc=features=>({type:'FeatureCollection',features});
  const localPathKm=10;
  const query=new URLSearchParams(parent.location.search);
  const state={metric:'reach_share',display:'grid',places:query.get('places')==='place'?'place':'urban',district:query.get('district')||(query.get('connectivityCountry')?'country:'+query.get('connectivityCountry'):''),nodes:false,roads:true,satellite:false,gems:false,pid:'',relationship:'all',selectedCell:null};
  let districtData=null,initialDistrict=true,extentControl=null;
  const data={},pending=new Map(),layers=new Map();let sectionCache=null;
  const methods='Shared OSM nodes on motorway, trunk or primary roads (including links), with at least three accessible neighbours and both major and local edges. Local paths exclude major roads, use a directed static motor-access graph and include a place-to-road snap of at most 250 m. Towns means OSM city/town nodes; all places also includes villages. The 20 km halo supports the 10 km local-path search. Nodes are not merged into functional interchanges. The 10 km path limit and 5 km grid are chosen starting points for exploratory comparison, not operational catchment standards. Turn restrictions, conditional access, closures and surface passability are not modelled. These are mapped connectivity indicators, not traffic, population access or economic integration.';
  const style=document.createElement('style');style.textContent=`
    .corridor-controls{font-size:12px;line-height:1.5;margin-top:12px}.corridor-controls label{display:block;margin:9px 0}.corridor-controls select{display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:4px;font:inherit;min-height:40px;border:1px solid #cbd7d0;border-radius:5px;background:white;color:#243b43}.corridor-controls input{accent-color:#275d54}.corridor-note{font-size:11px;line-height:1.5;color:#53656c}.corridor-controls button{font:inherit;min-height:36px;border:1px solid #bccfc5;border-radius:5px;background:#fff;padding:6px 10px;color:#244e46;cursor:pointer}.corridor-controls details{margin:10px 0}.corridor-controls summary{cursor:pointer}.corridor-stats{background:#f1f5f2;padding:8px;border-radius:5px}.corridor-key{margin:10px 0;font-size:11px;line-height:1.5}.corridor-key-row{display:flex;gap:7px;align-items:center;margin:4px 0}.corridor-key-swatch{width:13px;height:13px;border:1px solid #c6d1ce;flex:0 0 auto}.corridor-popup{font:12px/1.5 Arial;max-width:270px}.corridor-popup h3{font-size:14px;margin:0 0 7px}.corridor-popup table{width:100%;border-collapse:collapse}.corridor-popup td{padding:3px 0;vertical-align:top}.corridor-popup td:last-child{text-align:right;padding-left:10px}.gems-cluster{background:none;border:0}.gems-cluster span{display:grid;place-items:center;width:34px;height:34px;background:#694b87;color:white;border:3px solid white;box-sizing:border-box;border-radius:50%;font:600 11px Arial;box-shadow:0 1px 5px #0006}.gems-details{margin:12px 0;padding:10px;border-left:3px solid #694b87;background:#f6f3f9}.gems-details button{margin:4px 0;padding:7px;font:11px Arial;border:1px solid #cfc2dc;border-radius:4px;background:#fff;color:#543b70;cursor:pointer}.gems-details p{font-size:11px!important}.corridor-controls a{color:#226778}
    @media(max-width:1024px){.corridor-controls select,.corridor-controls button{min-height:44px}}
  `;document.head.appendChild(style);
  style.textContent+=`
    .connectivity-view:not(.connectivity-satellite) #map{background:#eef3f2}.connectivity-view:not(.connectivity-satellite) .leaflet-tile-pane{filter:grayscale(1);opacity:.12}.connectivity-view:not(.connectivity-satellite) .country-label{color:#324b58;text-shadow:0 1px 2px #fff}.connectivity-reach-options{display:grid;grid-template-columns:minmax(0,1fr) 90px;gap:8px}
    .connectivity-display{display:flex;gap:6px;margin:9px 0}.connectivity-display button{flex:1}.connectivity-display button[aria-pressed="true"]{background:#275d54;color:#fff;border-color:#275d54}.connectivity-cluster,.connectivity-node{background:none;border:0}.connectivity-cluster{display:grid;place-items:center}.connectivity-cluster svg{display:block;overflow:visible;filter:drop-shadow(0 1px 2px #0003)}.connectivity-node{display:grid;place-items:center}.connectivity-node span{display:block;width:9px;height:9px;border:2px solid white;border-radius:50%;box-sizing:content-box;box-shadow:0 1px 3px #0006}.connectivity-node:focus-visible,.connectivity-cluster:focus-visible{outline:2px solid #176f88;outline-offset:3px;border-radius:50%}.connectivity-reach-bar{display:flex;height:7px;overflow:hidden;border-radius:4px;background:#bd682d;margin:6px 0}.connectivity-reach-bar span{height:100%;background:#087f8c}.connectivity-stat-value{display:block;font-weight:700;font-size:14px}.connectivity-key-dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto;border:1px solid #fff;box-shadow:0 0 0 1px #c6d1ce}.connectivity-popup-stat{font-size:22px;font-weight:700;color:#275d54}.connectivity-popup-stat small{font-size:12px;font-weight:400;color:#53656c}
    .gems-actions{display:flex;flex-wrap:wrap;gap:6px}.corridor-popup button{display:block;font:inherit;min-height:36px;margin:6px 0;padding:6px 10px;border:1px solid #cfc2dc;border-radius:5px;background:#fff;color:#543b70;cursor:pointer}.gems-details button:focus-visible,.corridor-popup button:focus-visible{outline:2px solid #176f88;outline-offset:3px}
    .corridor-controls button:disabled{opacity:.55;cursor:default}.corridor-controls :is(button,select,input):focus-visible{outline:2px solid #176f88;outline-offset:3px}
    .gems-cluster span{width:42px;height:40px;border-radius:7px;display:flex;flex-direction:column;justify-content:center;gap:1px}.gems-cluster b{font-size:12px}.gems-cluster small{font:600 7px Arial;letter-spacing:.06em}.gems-point{background:none;border:0;display:grid;place-items:center}.gems-point:focus-visible{outline:2px solid #176f88;outline-offset:3px}.gems-point span,.gems-key-symbol{display:block;width:13px;height:13px;background:#694b87;border:2px solid #fff;box-sizing:border-box;border-radius:2px;box-shadow:0 1px 4px #0005}.gems-key-symbol{display:inline-block;vertical-align:middle;margin-right:4px}
    .corridor-key-line{width:16px;height:0;border-top:2px solid #354853;flex:0 0 auto}

    @media(max-width:1024px){.corridor-controls select{font-size:16px}.gems-details button,.corridor-popup button{min-height:44px}}
  `;
  style.textContent+="\n    \n    .map-view-switch>summary{padding:9px 0;font:600 12px Arial;cursor:pointer;color:#275d54;border-bottom:1px solid #d8dfe1}.map-view-switch>summary::after{content:'▾';float:right}.map-view-switch[open]>summary::after{content:'▴'}.map-view-switch .preset-grid{max-height:230px;overflow:auto;padding:8px 0;gap:6px}\n    .connectivity-view .corridor-controls{margin-top:8px}.connectivity-view .corridor-controls>label{margin:6px 0}.connectivity-view .corridor-key{margin:0 0 10px}.connectivity-view .corridor-note{margin:7px 0}\n    .connectivity-summary{padding:10px 12px;border:1px solid #d6e1dd;background:#f6f9f8;border-radius:7px}.connectivity-summary .connectivity-stat-value{font-size:25px;line-height:1.15;margin:4px 0;color:#275d54}.connectivity-summary small{font-size:11px;color:#53656c}.connectivity-selection{margin:10px 0;border-left:3px solid #275d54;padding:8px 11px;background:#edf5f3}.connectivity-selection[hidden]{display:none}.connectivity-selection header{display:flex;justify-content:space-between;align-items:center;font-weight:600}.connectivity-selection header button{padding:0;min-width:32px;min-height:32px;border:0;background:transparent;font-size:20px}.connectivity-selection .connectivity-popup-stat{font-size:25px;line-height:1.25;margin:3px 0}.connectivity-selection table{width:100%;border-collapse:collapse;font-size:11px}.connectivity-selection td{padding:3px 0}.connectivity-selection td:last-child{text-align:right}.connectivity-key-classes{display:grid;grid-template-columns:1fr 1fr;gap:0 6px}.connectivity-key-classes .corridor-key-swatch{width:18px;height:4px;border:0;border-radius:2px}.corridor-road-section:focus{outline:none;stroke:#111827;stroke-opacity:.4}\n    @media(max-width:1024px){.map-view-switch>summary{padding:13px 0}}\n";
  function clear(){for(const layer of layers.values())map.removeLayer(layer);layers.clear();}
  function add(key,layer){layers.set(key,layer);layer.addTo(map);}
  async function load(group){
    if(!['connectivity','gems'].includes(group))return false;
    if(!pending.has(group))pending.set(group,Promise.all([parent.WBVault.json(DATA.code+'/'+group),group==='connectivity'?fetch('data/local-connectivity/'+DATA.code+'.json.gz?v=2026-10-21.districts.77').then(async r=>{if(!r.ok)throw Error('District figures unavailable');return JSON.parse(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text());}):null]).then(([value,districts])=>{if(value.format!=='wb-corridors-web-v1'||value.code!==DATA.code)throw new Error('Invalid corridor output');data[group]=value;if(districts){if(districts.format!=='wb-connectivity-districts-v1'||districts.code!==DATA.code)throw Error('Invalid district data');districtData=districts;if(!focusRow())state.district='';}}).catch(e=>{pending.delete(group);throw e;}));
    await pending.get(group);return true;
  }
  function select(box,label,id,items,value,onchange){const lab=document.createElement('label');lab.textContent=label;const s=document.createElement('select');s.id=id;for(const [v,t] of items){const o=document.createElement('option');o.value=v;o.textContent=t;s.appendChild(o);}s.value=value;s.onchange=()=>onchange(s.value);lab.appendChild(s);box.appendChild(lab);return s;}
  function checkbox(box,label,id,value,onchange){const lab=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=value;input.onchange=()=>onchange(input.checked);lab.append(input,document.createTextNode(' '+label));box.appendChild(lab);}
  function button(box,label,onclick){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=onclick;box.appendChild(b);return b;}
  function note(box,html){const p=document.createElement('p');p.className='corridor-note';p.innerHTML=html;box.appendChild(p);}
  function redraw(){draw(currentView());legend(currentView());}
  function selectedField(){return ['reach_nodes','reach_share'].includes(state.metric)?state.places+'_'+localPathKm+'km_'+(state.metric==='reach_nodes'?'nodes':'share'):state.metric;}
  function classes(){if(state.metric==='reach_share')return [[0,'0%','#c58e56'],[.25,'Over 0–25%','#b5d3cd'],[.5,'Over 25–50%','#75b1aa'],[.75,'Over 50–75%','#388982'],[1,'Over 75–100%','#145b5c']];if(state.metric==='junction_nodes_per_10km')return [[0,'0','#c58e56'],[2,'Over 0–2','#b5d3cd'],[5,'Over 2–5','#75b1aa'],[10,'Over 5–10','#388982'],[Infinity,'Over 10','#145b5c']];return [[0,'0','#c58e56'],[2,'1–2','#b5d3cd'],[5,'3–5','#75b1aa'],[10,'6–10','#388982'],[25,'11–25','#367f6c'],[Infinity,'26 or more','#164b40']];}
  function fill(v){return v==null?'#a4aeb4':(classes().find(c=>v<=c[0])||classes().at(-1))[2];}
  function metricTitle(){return state.metric==='junction_nodes'?'Junction nodes per 5 km hex':state.metric==='junction_nodes_per_10km'?'Junction nodes per 10 mapped road km':(state.metric==='reach_nodes'?'Junction nodes':'Share of junction nodes')+' reaching '+(state.places==='urban'?'a city/town':'a city/town/village')+' within '+localPathKm+' km';}
  function controls(name,box){
    if(!['connectivity','projects'].includes(name))return;
    if(name==='projects'&&!data.gems)return;
    const c=document.createElement('div');c.className='corridor-controls';box.appendChild(c);
    if(name==='connectivity'){
      const areas=[['','Whole cluster'],...districtData.countries.map(r=>[r.id,r.name+' · country portion']),...districtData.districts.filter(r=>!r.boundary_fragment&&r.id!=='unassigned').map(r=>[r.id,r.name+' · '+r.country])];
      select(c,'Focus area','connectivityDistrict',areas,state.district,v=>focusDistrict(v));
      select(c,'Measure','corridorMetric',[['reach_share','Junctions reaching towns (%)'],['junction_nodes_per_10km','Junctions per 10 km of highway'],['junction_nodes','Junctions in each 5 km area'],['reach_nodes','Junctions reaching towns (count)']],state.metric,v=>{state.metric=v;if(state.display==='nodes'&&v!=='reach_share')state.display='roads';setPreset(name,{keepContext:true}).then(()=>el('corridorMetric')?.focus({preventScroll:true}));});
      if(['reach_share','reach_nodes'].includes(state.metric)){
        select(c,'Mapped destinations','corridorPlaces',[['urban','Cities / towns'],['place','Cities / towns / villages']],state.places,v=>{state.places=v;setPreset(name,{keepContext:true}).then(()=>el('corridorPlaces')?.focus({preventScroll:true}));});
        note(c,'Within 10 km along local roads to '+(state.places==='urban'?'a city / town':'a city / town / village')+'.');
      }
      const stats=document.createElement('div');stats.id='connectivityStats';stats.className='connectivity-summary';stats.setAttribute('aria-live','polite');c.appendChild(stats);
      const selected=document.createElement('section');selected.id='connectivitySelection';selected.className='connectivity-selection';selected.setAttribute('aria-live','polite');c.appendChild(selected);updateConnectivityStats();updateSelection();
      note(c,state.display==='roads'?'Click a coloured road stretch for its 5 km area’s figures.':state.display==='grid'?'Click a hexagon to inspect its figures.':'Click a junction to inspect its figures.');
      note(c,'<a target="_top" href="?connectivityCluster='+encodeURIComponent(DATA.code)+'&amp;places='+state.places+'#analysis">Compare districts and download figures →</a>');
      note(c,'OSM completeness has not been independently assessed. Missing mapped roads, junctions or settlement nodes do not establish an absence of connections on the ground.');
      const options=document.createElement('details');options.id='connectivityOptions';options.innerHTML='<summary>Display options</summary>';c.appendChild(options);
      select(options,'Show as','corridorDisplay',[['grid','5 km hex grid'],['roads','Coloured roads'],['nodes','Individual junctions / groups']],state.display,v=>{state.display=v;if(v==='nodes')state.metric='reach_share';setPreset(name,{keepContext:true}).then(()=>{el('connectivityOptions').open=true;el('corridorDisplay')?.focus({preventScroll:true});});});
      if(state.display!=='nodes')checkbox(options,'Show junction markers','corridorNodes',state.nodes,v=>{state.nodes=v;redraw();});
      if(state.display!=='roads')checkbox(options,'Show analysed major roads','corridorRoads',state.roads,v=>{state.roads=v;redraw();});
      checkbox(options,'Show satellite detail','corridorSatellite',state.satellite,v=>{state.satellite=v;redraw();});
      const details=document.createElement('details');details.innerHTML='<summary>Method and data</summary><p>'+esc(methods)+'</p><p>Road colours show the enclosing 5 km area’s value. Length normalisation requires at least 0.5 km of mapped major road in a cell. Shares require at least one junction. Divided roads can contribute more than one node and carriageway. OSM coverage differs between places.</p><p>District totals count junctions located within the supplied admin 2 boundary and cluster. Routes may cross those boundaries. Hexagons retain their full-cell values. Country and district figures use counts, not averages of hexagon percentages. Neighbouring boundary fragments are excluded from selectors and retained in downloads.</p><p><a href="data/local-connectivity/'+DATA.code+'.zip" download>Download underlying junction and district data · ZIP</a></p>';c.appendChild(details);button(details,'Download hexagon values (CSV)',()=>downloadGrid());
    } else {
      const h=document.createElement('strong');h.textContent='GEMS source locations';c.appendChild(h);
      checkbox(c,'Show GEMS source locations','gemsOverlay',state.gems,v=>{state.gems=v;redraw();});
      note(c,'Optional map layer. These filters affect GEMS only; the project directory has its own filters.');
      const projects=data.gems.projects;
      select(c,'World Bank project','gemsProject',[['','All GEMS project IDs'],...projects.map(p=>[p.project_id,p.project_id+' · '+p.official_title])],state.pid,v=>{state.pid=v;redraw();});
      select(c,'Relationship to this map’s directory','gemsRelationship',[['all','All source locations'],['focal','Linked to focal entries'],['context_only','Linked to context entries'],['absent','No existing directory match']],state.relationship,v=>{state.relationship=v;redraw();});
      const tally=document.createElement('p');tally.id='gemsCount';tally.className='corridor-stats';c.appendChild(tally);updateGemsCount();
      const actions=document.createElement('div');actions.className='gems-actions';c.appendChild(actions);
      button(actions,'Show and locate filtered rows',locateGems).id='gemsLocate';
      button(actions,'Download filtered rows (CSV)',downloadGems).id='gemsDownload';
      button(actions,'Reset GEMS filters',()=>{state.pid='';state.relationship='all';el('gemsProject').value='';el('gemsRelationship').value='all';redraw();el('gemsProject').focus({preventScroll:true});}).id='gemsReset';
      const details=document.createElement('details');details.innerHTML='<summary>About GEMS location evidence</summary>';c.appendChild(details);
      note(details,'GEMS points are undated user-supplied coordinates; implementation status and coordinate precision were not supplied. Source rows are not necessarily distinct sites. Their presence does not establish active work or completed delivery.');
      if(data.gems.quarantined_count)note(details,data.gems.quarantined_count+' Mandera source location held back: an inland coordinate for marine-fisheries project P163980 requires verification.');
      updateGemsCount();
    }
  }
  function cellRows(){return data.connectivity.cells;}
  function focusRow(){return state.district?districtData?.districts.concat(districtData.countries).find(r=>r.id===state.district):null;}
  function focusGeometry(){
    const row=focusRow();if(!row)return DATA.cluster;
    return row.level==='country'?fc(districtData.boundaries.features.filter(f=>f.properties.country===row.country)):fc(districtData.boundaries.features.filter(f=>f.properties.id===row.id));
  }
  function focusNodes(){
    const row=focusRow();if(!row)return data.connectivity.nodes.features;
    const ids=new Set(row.level==='country'?districtData.districts.filter(r=>r.country===row.country).map(r=>r.id):[row.id]);
    return data.connectivity.nodes.features.filter(f=>ids.has(districtData.node_districts[f.properties.osm_node_id]));
  }
  function zoomFocus(){
    const bounds=L.geoJSON(focusGeometry()).getBounds();if(!bounds.isValid())return;
    map.stop();map.fitBounds(bounds,{paddingTopLeft:[35,55],paddingBottomRight:window.innerWidth>1024?[375,40]:[35,95],maxZoom:11,animate:false});
  }
  function focusDistrict(id){state.district=id;state.selectedCell=null;redraw();const select=el('connectivityDistrict');if(select)select.value=id;zoomFocus();if(window.innerWidth<=1024)el('mobileMap').click();}
  function extentButton(on){
    if(!on){extentControl?.remove();return;}
    if(!extentControl){extentControl=L.control({position:'topleft'});extentControl.onAdd=()=>{const box=L.DomUtil.create('div','lc-map-reset leaflet-bar');L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);const b=document.createElement('button');b.type='button';b.textContent='Show whole cluster';b.onclick=()=>focusDistrict('');box.appendChild(b);return box;};}
    if(!extentControl.getContainer()?.isConnected)extentControl.addTo(map);
  }
  function pathField(){return state.places==='urban'?'town_path_km':'place_path_km';}
  function placeTitle(){return state.places==='urban'?'city/town':'city/town/village';}
  function nodeReaches(p){return p[pathField()]!=null&&p[pathField()]<=localPathKm;}
  function reachBar(reached,total){return '<div class="connectivity-reach-bar" aria-hidden="true"><span style="width:'+(total?100*reached/total:0)+'%"></span></div>';}

  function displayValue(p){const value=p[selectedField()];return value==null?'Not defined':num(value*(state.metric==='reach_share'?100:1),state.metric==='junction_nodes_per_10km'||state.metric==='reach_share'?1:0)+(state.metric==='reach_share'?'%':'');}
  function metricUnit(){return state.metric==='reach_share'?'of junctions reach '+placeTitle():state.metric==='junction_nodes_per_10km'?'raw junctions per 10 road km':state.metric==='junction_nodes'?'raw junction nodes':'junctions reach '+placeTitle();}
  function updateConnectivityStats(){
    const box=el('connectivityStats');if(!box)return;const density=state.metric==='junction_nodes_per_10km',row=density?null:focusRow(),nodes=density?data.connectivity.nodes.features:focusNodes(),total=nodes.length,reached=nodes.filter(f=>nodeReaches(f.properties)).length,km=data.connectivity.summary.major_road_km;
    const value=state.metric==='reach_share'?(total?num(100*reached/total,1)+'%':'Unavailable'):density?num(total/km*10,1):num(state.metric==='junction_nodes'?total:reached);
    box.innerHTML='<small>'+esc(row?row.name+' · '+(row.country||'country portion'):'Whole cluster'+(density?' · road-length measure':''))+'</small><span class="connectivity-stat-value">'+value+'</span>'+esc(metricUnit())+(['reach_share','reach_nodes'].includes(state.metric)?' within '+localPathKm+' km'+reachBar(reached,total)+'<small>'+num(reached)+' of '+num(total)+' raw junctions</small>':density?'<br><small>'+num(total)+' raw junctions · '+num(km,1)+' major-road km</small>':'')+(row?'<p class="corridor-note">Junctions inside this area. Hexagons keep their full-cell values; routes can cross boundaries.</p>':'')+(!total?'<p class="corridor-note">No qualifying mapped junctions; a share cannot be calculated.</p>':'');
  }
  function updateSelection(){
    const box=el('connectivitySelection');if(!box)return;const p=cellRows().find(p=>p.cell_id===state.selectedCell);box.hidden=!p;if(!p)return;const reach=state.places+'_'+localPathKm+'km_';
    box.innerHTML='<header><span>5 km area '+esc(p.cell_id)+'</span><button type="button" id="connectivityClear" aria-label="Clear selected area">×</button></header><div class="connectivity-popup-stat">'+displayValue(p)+'</div><div>'+esc(metricUnit())+(['reach_share','reach_nodes'].includes(state.metric)?' within '+localPathKm+' km':'')+'</div><table>'+[['Junctions reaching '+placeTitle(),num(p[reach+'nodes'])+' / '+num(p.junction_nodes)],['Major-road length',num(p.major_road_km,1)+' km'],['Junctions per 10 road km',num(p.junction_nodes_per_10km,1)]].map(([a,b])=>'<tr><td>'+esc(a)+'</td><td>'+esc(b)+'</td></tr>').join('')+'</table>'+(p.junction_nodes===0?'<p class="corridor-note">No mapped junctions here; a reach percentage cannot be calculated.</p>':'')+(p.major_road_km<.5?'<p class="corridor-note">Less than 0.5 road km; the density is undefined.</p>':'');el('connectivityClear').onclick=()=>{state.selectedCell=null;redraw();};
  }
  function selectCell(p){state.selectedCell=p.cell_id;redraw();if(window.innerWidth<=1024)el('mobileLayers').click();el('connectivitySelection')?.scrollIntoView({block:'nearest'});el('connectivityClear')?.focus({preventScroll:true});}
  // Display geometry only: split supplied roads at supplied cell boundaries.
  // Cell metrics remain reviewed values; no road-level metric or route is inferred.
  function roadSections(roads,grid,rows){
    const byId=new Map(rows.map(p=>[p.cell_id,p])),buckets=new Map(),size=.2;
    const bucketKeys=b=>{const keys=[];for(let x=Math.floor(b[0]/size);x<=Math.floor(b[2]/size);x++)for(let y=Math.floor(b[1]/size);y<=Math.floor(b[3]/size);y++)keys.push(x+','+y);return keys;};
    for(const f of grid.features){const p=byId.get(f.properties.cell_id);if(!p||!(p.major_road_km>0))continue;for(const rings of (f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates)){const points=rings.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),poly={p,rings,b:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};for(const key of bucketKeys(poly.b)){if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(poly);}}}
    const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
    function ringContains(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
    const contains=(p,poly)=>ringContains(p,poly.rings[0])&&!poly.rings.slice(1).some(r=>ringContains(p,r)),sections=new Map();
    for(const f of roads.features)for(const line of (f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates)){
      let lastId=null,lastLine=null;
      for(let i=1;i<line.length;i++){
        const a=line[i-1],b=line[i],d=sub(b,a),norm=d[0]*d[0]+d[1]*d[1];if(!norm)continue;
        const bb=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],candidates=[...new Set(bucketKeys(bb).flatMap(k=>buckets.get(k)||[]))].filter(p=>bb[0]<=p.b[2]&&bb[2]>=p.b[0]&&bb[1]<=p.b[3]&&bb[3]>=p.b[1]).sort((a,b)=>a.p.cell_id-b.p.cell_id),cuts=[0,1];
        for(const poly of candidates)for(const ring of poly.rings)for(let j=1;j<ring.length;j++){
          const c=ring[j-1],e=sub(ring[j],c),q=sub(c,a),den=cross(d,e);
          if(Math.abs(den)>1e-16){const t=cross(q,e)/den,u=cross(q,d)/den;if(t>0&&t<1&&u>=-1e-10&&u<=1+1e-10)cuts.push(t);}
          else if(Math.abs(cross(q,d))<1e-14)for(const end of [c,ring[j]]){const v=sub(end,a),t=(v[0]*d[0]+v[1]*d[1])/norm;if(t>0&&t<1)cuts.push(t);}
        }
        cuts.sort((a,b)=>a-b);const unique=cuts.filter((t,j)=>!j||t-cuts[j-1]>1e-10),point=t=>[a[0]+d[0]*t,a[1]+d[1]*t];
        for(let j=1;j<unique.length;j++){const start=point(unique[j-1]),end=point(unique[j]),mid=point((unique[j-1]+unique[j])/2),poly=candidates.find(p=>contains(mid,p));if(!poly){lastId=null;lastLine=null;continue;}const id=poly.p.cell_id;if(!sections.has(id))sections.set(id,{type:'Feature',properties:poly.p,geometry:{type:'MultiLineString',coordinates:[]}});if(lastId===id&&lastLine&&Math.abs(lastLine.at(-1)[0]-start[0])<1e-9&&Math.abs(lastLine.at(-1)[1]-start[1])<1e-9)lastLine.push(end);else{lastLine=[start,end];sections.get(id).geometry.coordinates.push(lastLine);}lastId=id;}
      }
    }
    return fc([...sections.values()]);
  }
  function bindArea(f,l){const p=f.properties,label='5 km area '+p.cell_id+' · '+displayValue(p)+' '+metricUnit();l.bindTooltip(esc(label));l.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);selectCell(p);});l.on('add',()=>{const path=l.getElement();if(!path)return;path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label);path.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCell(p);}};});}
  function junctionClusterIcon(cluster){
    const children=cluster.getAllChildMarkers(),count=children.length,reached=children.filter(m=>nodeReaches(m.feature.properties)).length,circumference=2*Math.PI*13;
    const label=num(count)+' raw junctions; '+num(reached)+' reach a mapped '+placeTitle()+' within '+localPathKm+' km. Click to zoom.';
    cluster.options.title=label;cluster.options.alt=label;
    cluster.bindTooltip(esc(label),{direction:'top'});
    const icon=L.divIcon({className:'connectivity-cluster',iconSize:[40,40],html:'<span aria-label="'+esc(label)+'"><svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="white"/><circle cx="20" cy="20" r="13" fill="none" stroke="#bd682d" stroke-width="6"/>'+(reached?'<circle cx="20" cy="20" r="13" fill="none" stroke="#087f8c" stroke-width="6" stroke-dasharray="'+(circumference*reached/count)+' '+circumference+'" transform="rotate(-90 20 20)"/>':'')+'<text x="20" y="24" text-anchor="middle" fill="#243b43" font-family="Arial" font-size="11" font-weight="700">'+esc(num(count))+'</text></svg></span>'});
    return icon;
  }
  function drawJunctions(){
    const cluster=L.markerClusterGroup({maxClusterRadius:z=>z<8?32:z<11?24:14,showCoverageOnHover:false,spiderfyOnMaxZoom:true,clusterPane:'pointPane',animate:false,iconCreateFunction:junctionClusterIcon});
    for(const f of focusNodes()){
      const p=f.properties,xy=f.geometry.coordinates,reached=nodeReaches(p),status=reached?'Local path to a mapped '+placeTitle()+' within '+localPathKm+' km':'No local path identified to a mapped '+placeTitle()+' within '+localPathKm+' km';
      const marker=L.marker([xy[1],xy[0]],{pane:'pointPane',keyboard:true,title:'OSM junction '+p.osm_node_id+' · '+status,alt:'OSM junction '+p.osm_node_id,icon:L.divIcon({className:'connectivity-node',iconSize:[24,24],html:'<span style="background:'+(reached?'#087f8c':'#bd682d')+'"></span>'})});marker.feature=f;
      marker.on('add',()=>marker.getElement()?.setAttribute('aria-label','OSM junction '+p.osm_node_id+' · '+status));marker.bindTooltip(esc(status));
      marker.bindPopup(()=>{const box=document.createElement('div');box.className='corridor-popup';box.innerHTML='<h3>OSM junction node</h3><p><strong>'+esc(status)+'</strong></p><table>'+[['Local path to city/town',p.town_path_km==null?'None found within 10 km':num(p.town_path_km,2)+' km'],['Local path to city/town/village',p.place_path_km==null?'None found within 10 km':num(p.place_path_km,2)+' km']].map(([a,b])=>'<tr><td>'+esc(a)+'</td><td>'+esc(b)+'</td></tr>').join('')+'</table><p><a href="https://www.openstreetmap.org/node/'+esc(p.osm_node_id)+'" target="_blank" rel="noopener noreferrer">OSM node '+esc(p.osm_node_id)+'</a> · hex '+esc(p.cell_id)+'</p><p>Paths exclude major roads and include a place snap of at most 250 m. No identified path within this search does not establish isolation. Raw nodes are not merged interchanges.</p>';button(box,'Zoom to this junction',()=>{if(window.innerWidth<=1024)el('mobileMap').click();map.setView([xy[1],xy[0]],Math.max(map.getZoom(),13),{animate:false});});return box;},{maxWidth:290});cluster.addLayer(marker);
    }
    add('nodes',cluster);
  }

  function drawConnectivity(){
    updateConnectivityStats();updateSelection();const byId=new Map(cellRows().map(p=>[p.cell_id,p])),field=selectedField();
    const features=(DATA.hexGrid?.features||[]).filter(f=>(byId.get(f.properties.cell_id)?.major_road_km||0)>0).map(f=>({...f,properties:byId.get(f.properties.cell_id)}));
    if(state.display==='roads'){
      if(!sectionCache)sectionCache=roadSections(data.connectivity.roads,DATA.hexGrid,cellRows());
      add('roadHalo',L.geoJSON(data.connectivity.roads,{pane:'roadPane',renderer:svgRenderer('roadPane'),interactive:false,style:{color:'#fff',weight:7.5,opacity:1}}));
      add('roads',L.geoJSON(data.connectivity.roads,{pane:'roadPane',renderer:svgRenderer('roadPane'),interactive:false,style:{color:'#a4aeb4',weight:4.5,opacity:1}}));
      add('roadSections',L.geoJSON(sectionCache,{pane:'roadPane',renderer:svgRenderer('roadPane'),interactive:false,style:f=>({color:fill(f.properties[field]),weight:4.5,opacity:1,lineCap:'round'})}));
      add('roadHits',L.geoJSON(sectionCache,{pane:'roadPane',renderer:svgRenderer('roadPane'),style:{color:'#fff',weight:18,opacity:0,className:'corridor-road-section'},bubblingMouseEvents:false,onEachFeature:bindArea}));
    }else{
      if(state.display==='grid')add('hex',L.geoJSON(fc(features),{pane:'hexPane',renderer:svgRenderer('hexPane'),style:f=>({weight:.4,color:'#fff',opacity:.8,fillOpacity:.75,fillColor:fill(f.properties[field]),className:'corridor-road-section'}),bubblingMouseEvents:false,onEachFeature:bindArea}));
      if(state.roads){add('roadHalo',L.geoJSON(data.connectivity.roads,{pane:'roadPane',renderer:svgRenderer('roadPane'),interactive:false,style:{color:'#fff',weight:4.5,opacity:.85}}));add('roads',L.geoJSON(data.connectivity.roads,{pane:'roadPane',renderer:svgRenderer('roadPane'),interactive:false,style:{color:'#385c72',weight:1.9,opacity:1}}));}
    }
    const selection=features.filter(f=>f.properties.cell_id===state.selectedCell);if(selection.length)add('selectedArea',L.geoJSON(fc(selection),{pane:'hexPane',renderer:svgRenderer('hexPane'),interactive:false,style:{color:'#275d54',weight:2,fillColor:'#275d54',fillOpacity:.1}}));
    if(focusRow())add('districtOutline',L.geoJSON(focusGeometry(),{pane:'linePane',renderer:svgRenderer('linePane'),interactive:false,style:{color:'#233c47',weight:2.5,fill:false,dashArray:'6 4'}}));
    if(state.display==='nodes'||state.nodes)drawJunctions();
  }
  function gemsRows(){return data.gems?.locations.features.filter(f=>(!state.pid||f.properties.project_id===state.pid)&&(state.relationship==='all'||f.properties.existing_map_relationship===state.relationship))||[];}
  function updateGemsCount(){
    const rows=gemsRows(),ids=new Set(rows.map(f=>f.properties.project_id));
    if(el('gemsCount')){el('gemsCount').setAttribute('aria-live','polite');el('gemsCount').textContent=(rows.length?num(rows.length)+' of '+num(data.gems.locations.features.length)+' source rows · '+ids.size+' project '+(ids.size===1?'ID':'IDs'):'No GEMS rows match these filters')+(state.gems?' · layer shown':' · layer hidden');}
    if(el('gemsLocate')){el('gemsLocate').disabled=!rows.length;el('gemsLocate').textContent=state.gems?'Locate filtered rows':'Show and locate filtered rows';}
    if(el('gemsDownload'))el('gemsDownload').disabled=!rows.length;
    if(el('gemsReset'))el('gemsReset').disabled=!state.pid&&state.relationship==='all';
  }
  function locateGems(){const rows=gemsRows();if(!rows.length)return;state.gems=true;if(el('gemsOverlay'))el('gemsOverlay').checked=true;redraw();if(window.innerWidth<=1024)el('mobileMap').click();map.fitBounds(L.latLngBounds(rows.map(f=>[f.geometry.coordinates[1],f.geometry.coordinates[0]])),{...mapPadding(),maxZoom:11,animate:false});}
  function directoryTargets(links){const targets=new Map();for(const link of links){const key=link.scope+'|'+(link.family_id||link.directory_id);if(!targets.has(key))targets.set(key,link);}return [...targets.values()];}
  function drawGems(){updateGemsCount();if(!state.gems)return;const cluster=L.markerClusterGroup({maxClusterRadius:42,showCoverageOnHover:false,spiderfyOnMaxZoom:true,clusterPane:'projectPane',iconCreateFunction:c=>L.divIcon({className:'gems-cluster',html:'<span aria-label="'+c.getChildCount()+' GEMS source rows"><b>'+c.getChildCount()+'</b><small>GEMS</small></span>',iconSize:[42,40]})});
    for(const f of gemsRows()){const p=f.properties,xy=f.geometry.coordinates;const marker=L.marker([xy[1],xy[0]],{pane:'projectPane',keyboard:true,title:p.project_id+' · GEMS source row '+p.source_row,alt:p.project_id+' · GEMS source row '+p.source_row,icon:L.divIcon({className:'gems-point',html:'<span></span>',iconSize:[24,24]})});marker.on('add',()=>marker.getElement()?.setAttribute('aria-label',p.project_id+' · GEMS source row '+p.source_row));marker.bindTooltip(esc(p.project_id)+' · GEMS');marker.bindPopup(()=>{const box=document.createElement('div');box.className='corridor-popup';box.innerHTML='<h3>'+esc(p.official_title)+'</h3><p><strong>'+esc(p.project_id)+'</strong> · GEMS source row '+esc(p.source_row)+'</p><p>Reported country: '+esc(p.source_country)+'<br>Lead practice: '+esc(p.lead_practice)+'</p><p><strong>Undated source location.</strong> Implementation status and coordinate precision not supplied. Country labels have not been independently validated.</p><p>Straight-line distance to analysed major roads: '+num(p.major_road_straight_distance_km,2)+' km. This is not road access.</p>'+(p.pre2020_closing_review?'<p>Historical project: official closing date '+esc(p.closing_date)+'. This source point has no observation date.</p>':'')+'<p><a target="_blank" rel="noopener noreferrer" href="https://projects.worldbank.org/en/projects-operations/project-detail/'+esc(p.project_id)+'">Official World Bank project</a></p>';const targets=directoryTargets(p.existing_directory_links);for(const link of targets)button(box,'Open '+(link.scope==='focal'?'linked':'context')+' directory entry'+(targets.length>1?' · '+(link.family_id||link.directory_id):''),()=>openProject(link));if(!p.existing_directory_links.length)note(box,'No existing directory match. The GEMS project ID remains a separate source record.');return box;});cluster.addLayer(marker);}add('gems',cluster);}

  function draw(name){clear();extentButton(name==='connectivity');document.body.classList.toggle('connectivity-view',name==='connectivity');document.body.classList.toggle('connectivity-satellite',name==='connectivity'&&state.satellite);if(name==='connectivity')drawConnectivity();if(name==='projects'&&data.gems)drawGems();}
  function legend(name){
    document.querySelectorAll('.corridor-key').forEach(e=>e.remove());const l=el('legend'),c=document.createElement('div');c.className='corridor-key';
    if(name==='connectivity'){

      const undefinedReason=state.metric==='reach_share'?'No qualifying mapped junctions · share unavailable':state.metric==='junction_nodes_per_10km'?'Too little mapped road for a rate':'Not defined';
      c.innerHTML='<strong>'+esc(state.display==='nodes'?'Junctions and local reach':metricTitle())+'</strong>'+(state.display==='nodes'?'<div class="corridor-key-row"><span class="connectivity-key-dot" style="background:#087f8c"></span>Local path to '+esc(placeTitle())+' ≤ '+localPathKm+' km</div><div class="corridor-key-row"><span class="connectivity-key-dot" style="background:#bd682d"></span>No path identified within '+localPathKm+' km</div>':'<div class="connectivity-key-classes">'+classes().map(x=>'<div class="corridor-key-row"><span class="corridor-key-swatch" style="background:'+x[2]+'"></span>'+esc(x[1])+'</div>').join('')+(['reach_share','junction_nodes_per_10km'].includes(state.metric)?'<div class="corridor-key-row"><span class="corridor-key-swatch" style="background:#a4aeb4"></span>'+esc(undefinedReason)+'</div>':'')+'</div>')+'<p>'+(state.display==='roads'?'Road colour = the enclosing 5 km area’s value.':state.display==='grid'?'Only areas containing a mapped major road are coloured.':'Circle number = raw junction nodes; ring = local-reach share. Groups split as you zoom.')+' Same scale in both map views.</p><p>Mapped road paths, not traffic or proof of territorial integration. OSM / Geofabrik · 27 October 2026.</p>';
    }
    else if(name==='projects'&&state.gems&&data.gems){c.innerHTML='<strong><span class="gems-key-symbol"></span> GEMS source locations</strong><p>Purple squares and clusters labelled GEMS count source rows, not projects or verified sites. Undated user-supplied coordinates; no implementation claim. Separate from the directory’s published evidence.</p>';}
    else return;
    if(name==='connectivity'){
      const note=document.createElement('p');note.textContent='Uncoloured areas inside the cluster have no major road recorded in the analysed network. '+(state.metric==='reach_share'&&state.display!=='nodes'?'Brown 0% means no qualifying local route was identified. ':'')+'Mapping completeness is unassessed.';c.appendChild(note);
      const row=focusRow();if(row){const p=document.createElement('p'),field=state.places==='urban'?'town':'place';p.innerHTML='<strong>'+esc(row.name)+'</strong> · '+num(row[field+'_reached'])+' / '+num(row.junctions)+' mapped junctions reach '+esc(placeTitle())+' within 10 km ('+(row.junctions?num(100*row[field+'_share'],1)+'%':'share unavailable')+'). Dashed outline = selected area; hex values cover the whole cell.';c.prepend(p);}
    }
    const credit=l.querySelector('.credit-note');l.insertBefore(c,name==='connectivity'?l.firstChild:(credit||null));el('mobileLegend').innerHTML=l.innerHTML;
  }
  function csvDownload(name,cols,rows){const quote=v=>{let s=v==null?'':String(v);if(typeof v!=='number'&&/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+[cols,...rows].map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function downloadGrid(){const rows=cellRows(),cols=Object.keys(rows[0]||{}).filter(k=>!/^\w+_(2|5)km_(nodes|share)$/.test(k));csvDownload(DATA.code+'_local_connectivity.csv',cols,rows.map(p=>cols.map(k=>p[k])));}
  function downloadGems(){const cols=['source_id','source_row','project_id','official_title','source_country','lead_practice','existing_map_relationship','longitude','latitude','location_date','implementation_status','coordinate_precision','major_road_straight_distance_km','closing_date','pre2020_closing_review'];csvDownload(DATA.code+'_gems_source_locations.csv',cols,gemsRows().map(f=>cols.map(k=>k==='longitude'?f.geometry.coordinates[0]:k==='latitude'?f.geometry.coordinates[1]:f.properties[k])));}
  function mapPadding(){
    if(window.innerWidth<=1024)return {paddingTopLeft:[90,55],paddingBottomRight:[90,85]};
    const right=document.querySelector('.panel').getBoundingClientRect(),left=el('projectPanel').getBoundingClientRect();
    return {paddingTopLeft:[left.width?Math.ceil(left.right)+90:50,55],paddingBottomRight:[Math.ceil(window.innerWidth-right.left)+90,55]};
  }
  function projectDetails(p,detail){
    if(!data.gems)return;
    const ids=new Set([p.project_id,...(p.records||[]).map(r=>r.project_id)]),rows=data.gems.locations.features.filter(f=>f.properties.existing_directory_links.some(l=>ids.has(l.family_id)||ids.has(l.directory_id)));
    if(!rows.length)return;
    const section=document.createElement('section');section.className='gems-details';section.innerHTML='<h4>GEMS source locations</h4><p>'+rows.length+' undated source '+(rows.length===1?'row':'rows')+' linked by exact World Bank project ID. These are additional source coordinates, separate from this directory’s published location evidence. Status and precision were not supplied.</p>';
    const groups=new Map();for(const f of rows){const id=f.properties.project_id;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(f);}
    for(const [id,items] of groups)button(section,id+' · show '+items.length+' GEMS '+(items.length===1?'row':'rows'),()=>{
      state.pid=id;state.relationship='all';state.gems=true;
      setPreset('projects',{keepContext:true}).then(()=>{
        if(window.innerWidth<=1024)el('mobileMap').click();
        map.fitBounds(L.latLngBounds(items.map(f=>[f.geometry.coordinates[1],f.geometry.coordinates[0]])),{...mapPadding(),maxZoom:11,animate:false});
      });
    });
    detail.appendChild(section);
  }
  function prepare(name){clear();extentButton(false);}
  function ready(name){if(name==='connectivity'&&initialDistrict){initialDistrict=false;if(focusRow())zoomFocus();}legend(name);}
  function setup(){
    map.on('click',e=>{if(currentView()==='connectivity'&&state.selectedCell!=null&&!e.originalEvent?.target?.closest('.corridor-road-section')){state.selectedCell=null;redraw();}});
  }
  return {load,controls,draw,legend,projectDetails,prepare,ready,setup};
};



