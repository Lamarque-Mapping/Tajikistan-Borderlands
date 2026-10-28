
(async()=>{try{
const DATA=await parent.WBVault.json("tk_borderlands/core");const isCorridor=false;DATA.title='Tajikistan–Kyrgyzstan';document.querySelector(".panel-heading .title").textContent=DATA.title;
L.Popup.mergeOptions({autoPan:false});
const map=L.map("map",{preferCanvas:true,zoomControl:true,zoomSnap:.25});
const popupOffsets=new WeakMap();
function fitPopupInsideMap(popup){
  const element=popup.getElement();if(!element)return;
  if(!popupOffsets.has(popup))popupOffsets.set(popup,L.point(popup.options.offset));
  const original=popupOffsets.get(popup);popup.options.offset=original;popup.update();
  const bounds=map.getContainer().getBoundingClientRect(),box=element.getBoundingClientRect();
  const sidebar=document.querySelector('.panel'),side=sidebar&&sidebar.getBoundingClientRect();
  const right=side&&side.width&&side.left>bounds.left+bounds.width/2?Math.min(bounds.right,side.left):bounds.right;
  const dx=box.left<bounds.left+12?bounds.left+12-box.left:box.right>right-12?right-12-box.right:0;
  const dy=box.top<bounds.top+12?bounds.top+12-box.top:box.bottom>bounds.bottom-12?bounds.bottom-12-box.bottom:0;
  element.classList.toggle('popup-clamped',!!(dx||dy));
  if(dx||dy){popup.options.offset=L.point(original.x+dx,original.y+dy);popup.update();}
}
map.on('popupopen',event=>{map.getContainer().classList.add('has-feature-popup');fitPopupInsideMap(event.popup);});
map.on('popupclose',()=>map.getContainer().classList.remove('has-feature-popup'));
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"Tiles © Esri | Transport and places © OpenStreetMap contributors",maxZoom:18}).addTo(map);

[["maskPane",230],["rasterPane",360],["hexPane",600],["ruralAccessPane",610],["adminPane",650],["roadPane",690],["railPane",700],["linePane",710],["boundaryPane",720],["pointPane",820],["crossingPane",1050],["labelPane",1200],["clusterPane",1600],["projectPane",1650],["tooltipPane",1850],["popupPane",1900]].forEach(function(spec){
  if(!map.getPane(spec[0]))map.createPane(spec[0]);
  map.getPane(spec[0]).style.zIndex=spec[1];
});
map.getPane("maskPane").style.pointerEvents="none";
map.getPane("labelPane").style.pointerEvents="none";
map.createPane('nationalBorderPane');
map.getPane('nationalBorderPane').style.zIndex=735;
map.getPane('nationalBorderPane').style.pointerEvents='none';

const active={};
const persistentLayers={};
const svgRenderers={};
function svgRenderer(pane){return svgRenderers[pane]||(svgRenderers[pane]=L.svg({pane}));}
let currentPreset="dataHex";
let currentAcledYears=new Set();
let currentAcledTypes=new Set();
let currentHexMetric="population";
let currentLandMetric="landCoverDominant";
let currentAccessMode="motorHealth";
let currentClimateMode="riverFlood";
let currentAnalysis="healthcare";
let currentHealthMode="motor";
let currentAnalysisMetric="popGt120";
let currentContext=new Set();
function emptyFc(){return {type:"FeatureCollection",features:[]}}
function has(fc){return !!(fc&&((fc.features&&fc.features.length)||fc._count))}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}
function row(label,value){if(value===null||value===undefined||String(value).trim()==="")return "";return "<tr><th>"+esc(label)+"</th><td>"+esc(value)+"</td></tr>"}
function popup(feature,fallback,subtitle){
  const p=feature.properties||{};
  const title=p.name||p.road_name||p.adm3_name||p.adm2_name||fallback;
  let rows="";
  rows+=row("Place type",p.place_type);
  rows+=row("Population",p.population_text);
  rows+=row("Road class",p.road_class);
  rows+=row("Road",p.road_name);
  rows+=row("Reference",p.ref);
  rows+=row("Country/source",p.source_country||p.country||p.adm0_name);
  rows+=row("Region/state",p.adm1_name);
  rows+=row("District/zone",p.adm2_name);
  rows+=row("Sub-district",p.adm3_name);
  rows+=row("Service category",p.service_category);
  rows+=row("Service type",p.service_type);
  rows+=row("Infrastructure type",p.infrastructure_type);
  rows+=row("Feature class",p.fclass);
  rows+=row("Operator",p.operator);
  rows+=row("Status",p.status);
  rows+=row("Capacity",p.capacity);
  rows+=row("Fuel / technology",p.fuel);
  rows+=row("Office type",p.office_type);
  rows+=row("Data source",p.data_source);
  rows+=row("Date",p.event_date);
  rows+=row("Year",p.year);
  rows+=row("Event type",p.event_type);
  rows+=row("Subtype",p.sub_event_type);
  rows+=row("Location",p.location);
  rows+=row("Main actor",p.actor1);
  rows+=row("Other actor",p.actor2);
  rows+=row("Reported fatalities",p.fatalities);
  rows+=row("Description",p.notes);
  rows+=row("Cell",p.cell_id);
  rows+=row("Area in focus",p.area_in_focus_km2?Number(p.area_in_focus_km2).toLocaleString()+" km²":"");
  return '<div class="feature-popup-title">'+esc(title)+'</div><div class="feature-popup-subtitle">'+esc(subtitle||"")+'</div><table class="feature-popup-table">'+rows+'</table>';
}
function bind(layer,feature,title,subtitle){layer.bindPopup(popup(feature,title,subtitle),{maxWidth:320,closeButton:true,autoPan:false})}
function geo(fc,style,title,subtitle,pane){const useSvg=currentPreset!=="crossings"||(style&&style.interactive===false);return L.geoJSON(fc||emptyFc(),{renderer:useSvg?svgRenderer(pane||"linePane"):undefined,interactive:!(style&&style.interactive===false),pane:pane||"linePane",style:style,pointToLayer:function(f,ll){return L.circleMarker(ll,{radius:0,opacity:0,fillOpacity:0,interactive:false})},onEachFeature:function(f,l){if(!(style&&style.interactive===false))bind(l,f,title,subtitle)}})}
function labels(fc,css){
  const group=L.layerGroup();
  (fc.features||[]).forEach(function(f){
    if(!f.geometry||f.geometry.type!=="Point")return;
    const c=f.geometry.coordinates,p=f.properties||{},name=p.name||p.adm2_name||p.adm3_name;
    if(!name)return;
    L.marker([c[1],c[0]],{pane:"labelPane",interactive:false,icon:L.divIcon({html:'<span class="'+css+'">'+esc(name)+'</span>',className:"",iconSize:[1,1],iconAnchor:[0,0]})}).addTo(group);
  });
  return group;
}
function townIcon(kind){
  const city=kind==="city",size=30;
  return L.divIcon({html:'<span class="town-symbol '+(city?'city':'town')+'"><span class="town-core"></span></span>',className:"town-marker",iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2]});
}
function activateTownMarker(marker,name){
  const icon=marker&&marker.getElement?marker.getElement():marker&&marker._icon;
  if(!icon)return;
  icon.style.cursor="pointer";
  icon.style.pointerEvents="auto";
  icon.setAttribute("role","button");
  icon.setAttribute("aria-label","Open details for "+(name||"town or city"));
  // Leaflet must receive the town marker click.
}
function reactivateTownLayer(group){
  if(!group||!group.eachLayer)return;
  group.eachLayer(function(marker){
    const p=(marker.feature&&marker.feature.properties)||{};
    activateTownMarker(marker,p.name);
    if(marker.setZIndexOffset)marker.setZIndexOffset(5000);
  });
  if(window.requestAnimationFrame)window.requestAnimationFrame(function(){
    if(map.hasLayer(group))group.eachLayer(function(marker){
      const p=(marker.feature&&marker.feature.properties)||{};
      activateTownMarker(marker,p.name);
    });
  });
}
function townLayer(fc){
  return L.geoJSON(fc||emptyFc(),{
    pane:"pointPane",
    pointToLayer:function(f,ll){
      const p=f.properties||{},name=p.name||"Town / city";
      return L.marker(ll,{pane:"pointPane",icon:townIcon(p.place_type),interactive:true,keyboard:true,title:name,alt:name,bubblingMouseEvents:false,riseOnHover:true});
    },
    onEachFeature:function(f,l){
      bind(l,f,"Town / city","Named city or town");
      const n=(f.properties||{}).name;
      if(n)l.bindTooltip(esc(n),{className:"town-tip",direction:"top",offset:[0,-8],sticky:true});
      l.on("click",function(event){if(event&&event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);l.openPopup()});
      l.on("add",function(){activateTownMarker(l,n)});
    }
  });
}
function infrastructureIcon(kind){
  const labels={power:"⚡",airport:"✈",port:"⚓",unhcr:"U"};
  const html='<span class="infra-symbol infra-'+kind+'"><span>'+labels[kind]+'</span></span>';
  return L.divIcon({html:html,className:"",iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-10]});
}
function infrastructurePointLayer(fc,kind,title){
  return L.geoJSON(fc||emptyFc(),{pane:"pointPane",pointToLayer:function(f,ll){return L.marker(ll,{pane:"pointPane",icon:infrastructureIcon(kind),interactive:true,bubblingMouseEvents:false,riseOnHover:true,zIndexOffset:5000})},onEachFeature:function(f,l){bind(l,f,title,title)}});
}
function crossingIcon(kind){
  let html;
  if(kind==="primary")html='<span class="crossing-icon crossing-primary"><span>P</span></span>';
  else if(kind==="secondary")html='<span class="crossing-icon crossing-secondary">S</span>';
  else if(kind==="tertiary")html='<span class="crossing-icon crossing-tertiary">T</span>';
  else html='<span class="crossing-icon crossing-other"></span>';
  return L.divIcon({html:html,className:"",iconSize:[21,21],iconAnchor:[10.5,10.5],popupAnchor:[0,-9]});
}
function crossingLayer(fc,kind){return L.geoJSON(fc||emptyFc(),{pane:"crossingPane",pointToLayer:function(f,ll){return L.marker(ll,{pane:"crossingPane",icon:crossingIcon(kind),interactive:true,bubblingMouseEvents:false,riseOnHover:true,zIndexOffset:10000})},onEachFeature:function(f,l){bind(l,f,"Road–border intersection","Unverified road–border intersection; not a confirmed open border post")}})}
function conicGradient(counts,colourFn){
  const entries=Object.entries(counts).filter(item=>Number(item[1])>0),total=entries.reduce((sum,item)=>sum+item[1],0);
  if(!entries.length||total<=0)return "#374151";
  if(entries.length===1)return colourFn(entries[0][0]);
  let running=0,parts=[];
  entries.forEach(function(item){const start=running/total*100;running+=item[1];const end=running/total*100;parts.push(colourFn(item[0])+" "+start.toFixed(2)+"% "+end.toFixed(2)+"%");});
  return "conic-gradient("+parts.join(",")+")";
}
function serviceColour(category){return {schools:"#2563eb",health:"#2a9d8f",police:"#1e3a8a",markets:"#b45309"}[category]||"#374151"}
function serviceLabel(category){return {schools:"School",health:"Health facility",police:"Police",markets:"Market"}[category]||"Service point"}
function acledColour(type){
  const t=String(type||"").toLowerCase();
  if(t.includes("battle"))return "#d73027";
  if(t.includes("explosion")||t.includes("remote"))return "#f59e0b";
  if(t.includes("civilian"))return "#7c3aed";
  if(t.includes("riot"))return "#1d4ed8";
  if(t.includes("protest"))return "#16a34a";
  if(t.includes("strategic"))return "#64748b";
  return "#7f1d1d";
}
function acledTypeKey(type){
  const t=String(type||"Other"),low=t.toLowerCase();
  if(low.includes("battle"))return "Battles";
  if(low.includes("explosion")||low.includes("remote"))return "Explosions / remote violence";
  if(low.includes("civilian"))return "Violence against civilians";
  if(low.includes("riot"))return "Riots";
  if(low.includes("protest"))return "Protests";
  if(low.includes("strategic"))return "Strategic developments";
  return t||"Other";
}
function acledRadius(fatalities){const f=Number(fatalities||0);if(!Number.isFinite(f)||f<=0)return 6;if(f===1)return 7.2;return Math.max(7.2,Math.min(17,6+Math.sqrt(f)*2.15))}
function clusterRingPositions(count,center){
  // Fixed-radius rings keep large groups readable without Leaflet's spiral.
  // At eight markers per ring number, adjacent centres stay at least 42 px apart.
  const rings=[];
  for(let remaining=count,ring=1;remaining>0;ring++){
    const size=Math.min(remaining,ring*8);rings.push(size);remaining-=size;
  }
  // Avoid leaving one or two isolated markers on the outermost ring.
  if(rings.length>1){const last=rings.length-1,move=Math.max(0,Math.floor((rings[last-1]-rings[last])/2));rings[last-1]-=move;rings[last]+=move;}
  const positions=[];
  rings.forEach((size,index)=>{
    const radius=rings.length===1?Math.max(40,7*count):56*(index+1);
    const offset=-Math.PI/2+(index%2?Math.PI/size:0);
    for(let marker=0;marker<size;marker++){
      const angle=offset+marker*2*Math.PI/size;
      positions.push(L.point(center.x+radius*Math.cos(angle),center.y+radius*Math.sin(angle)));
    }
  });
  return positions;
}
function clusterGroup(kind,iconColourFn){
  if(typeof L.markerClusterGroup!=="function")return L.layerGroup();
  const group=L.markerClusterGroup({animate:false,showCoverageOnHover:false,zoomToBoundsOnClick:false,spiderfyOnEveryZoom:true,spiderfyOnMaxZoom:true,spiderfyShapePositions:clusterRingPositions,clusterPane:"clusterPane",spiderLegPolylineOptions:{weight:1.1,color:"#111827",opacity:.48},iconCreateFunction:function(cluster){
    const counts={};
    cluster.getAllChildMarkers().forEach(function(marker){const key=marker.options.wbCategory||"Other";counts[key]=(counts[key]||0)+1;});
    return L.divIcon({html:'<span class="'+kind+'-cluster-pie" style="background:'+conicGradient(counts,iconColourFn)+'">'+cluster.getChildCount()+'</span>',className:kind+'-cluster-wrap',iconSize:[44,44],iconAnchor:[22,22]});
  }});
  return group;
}
function serviceClusterLayer(){
  const group=clusterGroup("service",serviceColour);
  [["schools","schools"],["health","health"],["police","police"],["markets","markets"]].forEach(function(item){
    const key=item[0],category=item[1];
    ((DATA[key]||emptyFc()).features||[]).forEach(function(feature){if(!feature.geometry||feature.geometry.type!=="Point")return;const c=feature.geometry.coordinates;const marker=L.circleMarker([c[1],c[0]],{pane:"clusterPane",renderer:svgRenderer("clusterPane"),radius:7,color:"#fff",weight:2,opacity:1,fillColor:serviceColour(category),fillOpacity:.96,bubblingMouseEvents:false,wbCategory:category});bind(marker,feature,serviceLabel(category),serviceLabel(category));group.addLayer(marker);});
  });
  return group;
}
function singleServiceLayer(dataKey,category){
  const group=clusterGroup("service",serviceColour);
  ((DATA[dataKey]||emptyFc()).features||[]).forEach(function(feature){if(!feature.geometry||feature.geometry.type!=="Point")return;const c=feature.geometry.coordinates;const marker=L.circleMarker([c[1],c[0]],{pane:"clusterPane",renderer:svgRenderer("clusterPane"),radius:7,color:"#fff",weight:2,opacity:1,fillColor:serviceColour(category),fillOpacity:.96,bubblingMouseEvents:false,wbCategory:category});bind(marker,feature,serviceLabel(category),serviceLabel(category));group.addLayer(marker)});
  return group;
}
function filteredAcled(){return ((DATA.acled||emptyFc()).features||[]).filter(function(feature){const p=feature.properties||{},year=String(p.year||""),type=String(p.event_type||"Other");return currentAcledYears.has(year)&&currentAcledTypes.has(type)&&eventMatches(feature);})}
function acledClusterLayer(){
  const group=clusterGroup("acled",acledColour);eventMarkers.clear();
  group.on("clusterclick",event=>showEventCluster(event.layer));
  filteredAcled().forEach(function(feature){if(!feature.geometry||feature.geometry.type!=="Point")return;const c=feature.geometry.coordinates,p=feature.properties||{},key=acledTypeKey(p.event_type);const marker=L.circleMarker([c[1],c[0]],{pane:"clusterPane",renderer:svgRenderer("clusterPane"),radius:acledRadius(p.fatalities),color:"#fff",weight:2,opacity:1,fillColor:acledColour(p.event_type),fillOpacity:.92,bubblingMouseEvents:false,wbCategory:key});bindEventMarker(marker,feature);group.addLayer(marker);});
  return group;
}
function addOutsideMask(){
  const holes=[];
  function take(g){if(!g)return;if(g.type==="Polygon"&&g.coordinates[0])holes.push(g.coordinates[0].map(p=>[p[1],p[0]]));if(g.type==="MultiPolygon")g.coordinates.forEach(poly=>{if(poly[0])holes.push(poly[0].map(p=>[p[1],p[0]]))})}
  (DATA.cluster.features||[]).forEach(f=>take(f.geometry));
  if(!holes.length)return;
  L.polygon([[[-85,-180],[-85,180],[85,180],[85,-180],[-85,-180]]].concat(holes),{pane:"maskPane",stroke:false,fillColor:"#000",fillOpacity:.34,interactive:false}).addTo(map);
}
function rasterLayer(key){
  const item=(DATA.rasters||{})[key];
  if(!item||!item.url||!item.bounds)return L.layerGroup();
  return L.imageOverlay(item.url,item.bounds,{pane:"rasterPane",opacity:Number(item.opacity||.85),interactive:false,crossOrigin:false});
}
function hexToRgb(hex){const h=String(hex||"").replace("#","");return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}}
function rgbToHex(c){return "#"+[c.r,c.g,c.b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("")}
function mixColours(a,b,t){const x=hexToRgb(a),y=hexToRgb(b);return rgbToHex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t})}
function paletteColour(palette,t){
  const ramps={
    environment_rain:["#eff6ff","#93c5fd","#2563eb","#08306b"],
    environment_water:["#eff6ff","#60a5fa","#1d4ed8","#172554"],
    environment_settlement:["#f3e8ff","#c084fc","#9333ea","#581c87"],
    environment_change:["#2166ac","#92c5de","#f7f7f7","#c51b7d","#67001f"],
    population:["#eff6ff","#93c5fd","#2563eb","#08306b"],
    services:["#ecfeff","#67e8f9","#0891b2","#164e63"],
    acledEvents:["#fff7ed","#fdba74","#f97316","#9a3412"],
    fatalities:["#fffbeb","#f59e0b","#dc2626","#111827"],
    night:["#020617","#334155","#facc15","#ffffff"],
    built:["#f7f7f7","#bdbdbd","#f97316","#7c2d12"],
    access:["#1a9850","#91cf60","#fee08b","#fc8d59","#d73027"],
    flood:["#eff6ff","#93c5fd","#2563eb","#1e3a8a"],
    drought:["#ffffcc","#fed976","#fd8d3c","#bd0026","#800026"],
    healthNeed:["#ffffcc","#fed976","#fd8d3c","#e31a1c","#800026"],
    healthAccess:["#f7fcf5","#bae4b3","#74c476","#238b45","#005a32"],
    persistence:["#f3f4f6","#ddd6fe","#a78bfa","#7c3aed","#3b0764"]
  };
  const stops=ramps[palette]||ramps.population,x=Math.max(0,Math.min(.999999,Number(t)||0))*(stops.length-1),i=Math.floor(x);
  return mixColours(stops[i],stops[Math.min(stops.length-1,i+1)],x-i);
}
function metricValue(feature,meta){const raw=(feature.properties||{})[meta.property];if(raw===null||raw===undefined||raw==="")return null;const value=Number(raw);return Number.isFinite(value)?value:null}
function metricFill(feature,meta){
  const value=metricValue(feature,meta);if(value===null)return "#e5e7eb";
  if(value===0&&meta.zeroColor)return meta.zeroColor;
  if(meta.classes){const band=meta.classes.find(b=>b.max===null||value<=b.max);return band.colour;}
  const low=Number(meta.low||0),high=Number(meta.high||1);let t=high>low?(value-low)/(high-low):0;
  if(meta.transform==="sqrt")t=Math.sqrt(Math.max(0,t));
  return paletteColour(meta.palette,Math.max(0,Math.min(1,t)));
}
function formatMinutes(value){const n=Math.max(0,Number(value));if(!Number.isFinite(n))return "N/A";if(n<60)return Math.round(n)+" min";const hours=n/60;return (Math.abs(hours-Math.round(hours))<.05?Math.round(hours):hours.toFixed(1))+" h"}
function formatMetric(value,meta){if(value===null||value===undefined||!Number.isFinite(Number(value)))return "N/A";const n=Number(value);if(meta&&meta.sharedScale&&n!==0&&Math.abs(n)<.1&&["percentagePoints","percent"].includes(meta.unit))return (meta.unit==="percentagePoints"&&n>0?"+":"")+n.toFixed(6).replace(/0+$/,"")+(meta.unit==="percentagePoints"?" pp":"%");if(meta&&meta.unit==="radiance")return n.toFixed(2)+" nW/cm²/sr";if(meta&&meta.unit==="mm")return n.toFixed(1)+" mm";if(meta&&meta.unit==="months")return n.toFixed(1)+" months";if(meta&&meta.unit==="percentagePoints")return (n>0?"+":"")+n.toFixed(2)+" pp";if(meta&&meta.unit==="count")return Math.round(n).toLocaleString();if(meta&&meta.unit==="percent")return n.toFixed(1)+"%";if(meta&&meta.unit==="minutes")return formatMinutes(n);if(meta&&meta.unit==="rate10kYear")return (n>=100?Math.round(n).toLocaleString():n.toFixed(1))+" per 10,000 people/year";return n>=100?Math.round(n).toLocaleString():n.toFixed(2)}
function dominantLandLabel(code){return ((DATA.landCoverMeta||{}).classLabels||{})[String(code)]||"No sampled class"}
function metricHexLayer(meta,subtitle){
  if(!meta)return L.layerGroup();
  return L.geoJSON(DATA.hexGrid||emptyFc(),{pane:"hexPane",style:function(f){return {color:"rgba(255,255,255,.82)",weight:meta.sharedScale?.25:.7,opacity:meta.sharedScale?.35:.85,fillColor:metricFill(f,meta),fillOpacity:meta.fillOpacity??(meta.sharedScale?.9:.78)}},onEachFeature:function(f,l){const p=f.properties||{},value=metricValue(f,meta);l.bindPopup('<div class="feature-popup-title">'+esc(p.name||"5 km hex")+'</div><div class="feature-popup-subtitle">'+esc(subtitle||"5 km analysis cell")+'</div><table class="feature-popup-table">'+row(meta.label,formatMetric(value,meta))+(meta.coverageProperty?row('Valid source-area coverage',formatMetric(p[meta.coverageProperty],{unit:'percent'})):'')+row("Area in focus",p.area_in_focus_km2?Number(p.area_in_focus_km2).toLocaleString()+" km²":"")+'</table>')}});
}
function hexMetricLayer(){
  const meta=(DATA.hexMetrics||{})[currentHexMetric]||Object.values(DATA.hexMetrics||{})[0];
  if(!meta)return geo(DATA.hexGrid,{color:"#fff",weight:.75,opacity:.62,fillColor:"#fff",fillOpacity:.035},"5 km hexagon","Generated 5 km analysis cell","hexPane");
  return metricHexLayer(meta,"Generated 5 km analysis cell");
}
function accessHexLayer(){const meta=(DATA.accessHexMetrics||{})[currentAccessMode]||Object.values(DATA.accessHexMetrics||{})[0];return metricHexLayer(meta,"Mean over valid source area in this 5 km cell")}
function climateHexLayer(){const meta=(DATA.climateHexMetrics||{})[currentClimateMode]||Object.values(DATA.climateHexMetrics||{})[0];return metricHexLayer(meta,"Mean hazard value within this 5 km cell")}
function currentAnalysisGroup(){return ((DATA.analysisGroups||{})[currentAnalysis])||Object.values(DATA.analysisGroups||{})[0]||null}
function currentAnalysisMeta(){
  const group=currentAnalysisGroup();if(!group)return null;
  if(currentAnalysis==="healthcare"){
    const mode=(group.modes||{})[currentHealthMode]||Object.values(group.modes||{})[0];
    return mode?((mode.metrics||{})[currentAnalysisMetric]||Object.values(mode.metrics||{})[0]):null;
  }
  return (group.metrics||{})[currentAnalysisMetric]||Object.values(group.metrics||{})[0]||null;
}
function analysisPopupRows(properties,meta){
  let rows="";
  if(meta.analysisType==="healthcare"){
    const prefix=meta.propertyPrefix||"",mode=meta.modeLabel||"Travel";
    rows+=row("Travel mode",mode);
    rows+=row("Population analysed",formatMetric(properties[prefix+"_population_analysed"],{unit:"count"}));
    rows+=row("People within 2 hours",formatMetric(properties[prefix+"_pop_le120"],{unit:"count"}));
    rows+=row("People beyond 2 hours",formatMetric(properties[prefix+"_pop_gt120"],{unit:"count"}));
    rows+=row("Accessibility coverage",formatMetric(properties[prefix+"_coverage_pct"],{unit:"percent"}));
  }else if(meta.analysisType==="persistentViolence"){
    const periods=DATA.acledPersistencePeriods||[],counts=properties.wb_pv_period_counts||[];
    rows+=row("Active periods",formatMetric(properties.wb_pv_active_years,{unit:"count"})+" of "+periods.length);
    periods.forEach(function(period,index){rows+=row((period.shortLabel||period.label||("Period "+(index+1)))+" incidents",formatMetric(counts[index],{unit:"count"}))});
    rows+=row("Total incidents",formatMetric(properties.wb_pv_total_events,{unit:"count"}));
    rows+=row("Annualised incident rate",formatMetric(properties.wb_pv_incidents_per_10k_year,{unit:"rate10kYear"}));
    rows+=row("Reported fatalities",formatMetric(properties.wb_pv_total_fatalities,{unit:"count"}));
    rows+=row("Annualised fatality rate",formatMetric(properties.wb_pv_fatalities_per_10k_year,{unit:"rate10kYear"}));
    rows+=row("Estimated population",formatMetric(properties.wb_pv_population,{unit:"count"}));
  }
  rows+=row("Area in focus",properties.area_in_focus_km2?Number(properties.area_in_focus_km2).toLocaleString()+" km²":"");
  return rows;
}
function analysisHexLayer(){
  const meta=currentAnalysisMeta();if(!meta)return L.layerGroup();
  return L.geoJSON(DATA.hexGrid||emptyFc(),{pane:"hexPane",style:function(f){return {color:"rgba(255,255,255,.86)",weight:.75,opacity:.9,fillColor:metricFill(f,meta),fillOpacity:.82}},onEachFeature:function(f,l){const p=f.properties||{};l.bindPopup('<div class="feature-popup-title">'+esc(p.name||"5 km hex")+'</div><div class="feature-popup-subtitle">'+esc(meta.popupSubtitle||meta.label||"Analytical indicator")+'</div><table class="feature-popup-table">'+analysisPopupRows(p,meta)+'</table>')}});
}
function landHexLayer(){
  const meta=(DATA.landCoverMetrics||{})[currentLandMetric]||Object.values(DATA.landCoverMetrics||{})[0];
  if(!meta)return L.layerGroup();
  const classColours=(DATA.landCoverMeta||{}).classColors||{};
  return L.geoJSON(DATA.hexGrid||emptyFc(),{pane:"hexPane",style:function(f){const p=f.properties||{},raw=p[meta.property];let fill="#e5e7eb";if(meta.type==="categorical")fill=classColours[String(raw)]||fill;else if(raw!==null&&raw!==undefined&&raw!==""){const value=Number(raw);const t=Number.isFinite(value)?Math.max(0,Math.min(1,value/Math.max(1,Number(meta.high||100)))):0;fill=mixColours("#ffffff",meta.targetColor||"#6b7280",t)}return {color:"rgba(255,255,255,.82)",weight:.7,opacity:.86,fillColor:fill,fillOpacity:.78}},onEachFeature:function(f,l){const p=f.properties||{},raw=p[meta.property],display=meta.type==="categorical"?dominantLandLabel(raw):formatMetric(raw,{unit:"percent"});l.bindPopup('<div class="feature-popup-title">'+esc(p.name||"5 km hex")+'</div><div class="feature-popup-subtitle">ESA WorldCover 2021</div><table class="feature-popup-table">'+row(meta.label,display)+row("Area in focus",p.area_in_focus_km2?Number(p.area_in_focus_km2).toLocaleString()+" km²":"")+'</table>')}});
}

// Rural road access: SEDAC source units, independent of OCHA geometry.
const ruralAccessState={selectedId:null,sourceMetadata:null,countryLines:null};
const ruralAccessBands=[
  {upper:20,label:'0–<20%',colour:'#ffffcc'},
  {upper:40,label:'20–<40%',colour:'#c2e699'},
  {upper:60,label:'40–<60%',colour:'#78c679'},
  {upper:80,label:'60–<80%',colour:'#31a354'},
  {upper:101,label:'80–100%',colour:'#006837'}
];
function ruralAccessActive(){return currentPreset==='access'&&themeState.access==='ruralAccess';}
function ruralAccessValue(properties){const value=properties?.rai_pct;return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?value:null;}
function ruralAccessNumber(value,digits=0){return typeof value==='number'&&Number.isFinite(value)?value.toLocaleString(undefined,{maximumFractionDigits:digits}):'Not available';}
function ruralAccessName(properties){return String(properties?.NAME_2||'Unnamed source unit');}
function ruralAccessId(properties){return String(properties?.source_record_id||('sedac2023:'+properties?.__wb_source_fid));}
function ruralAccessFeatures(){return DATA.ruralAccessUnits?.features||[];}
function ruralAccessStyle(feature){
  const p=feature.properties||{},value=ruralAccessValue(p),selected=ruralAccessId(p)===ruralAccessState.selectedId;
  return {color:selected?'#142e43':'#647966',weight:selected?2.7:.75,opacity:selected?1:.85,fillColor:value==null?'#cbd5e1':ruralAccessBands.find(b=>value<b.upper).colour,fillOpacity:.84};
}
function ruralAccessLayer(){
  return L.geoJSON(DATA.ruralAccessUnits||emptyFc(),{pane:'ruralAccessPane',smoothFactor:0,renderer:svgRenderer('ruralAccessPane'),bubblingMouseEvents:false,style:ruralAccessStyle,onEachFeature:(feature,layer)=>{
    const p=feature.properties||{},value=ruralAccessValue(p),id=ruralAccessId(p);
    const label='SEDAC source unit '+ruralAccessName(p)+', '+(p.NAME_0||'country unspecified')+', '+(value==null?'rural access not available':ruralAccessNumber(value,1)+'% rural road access');
    layer.on('click',event=>{if(event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);selectRuralAccessUnit(id,document.activeElement===layer.getElement());});
    layer.on('add',()=>{
      const path=layer.getElement();if(!path)return;
      path.classList.add('rural-access-path');path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label);path.setAttribute('aria-pressed',String(id===ruralAccessState.selectedId));
      path.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectRuralAccessUnit(id,true);}else if(event.key==='Escape'){event.preventDefault();clearRuralAccessSelection();}};
    });
  }});
}
function syncRuralAccessHighlight(){
  active.ruralAccess?.eachLayer(layer=>{layer.setStyle(ruralAccessStyle(layer.feature));layer.getElement()?.setAttribute('aria-pressed',String(ruralAccessId(layer.feature.properties)===ruralAccessState.selectedId));});
}
function clearRuralAccessSelection(){
  ruralAccessState.selectedId=null;syncRuralAccessHighlight();
  const selector=document.getElementById('ruralAccessUnit');if(selector)selector.value='';
  const selection=document.getElementById('ruralAccessSelection');if(selection){selection.replaceChildren();selection.hidden=true;}
}
function selectedRuralAccessFeature(){return ruralAccessFeatures().find(feature=>ruralAccessId(feature.properties)===ruralAccessState.selectedId);}
function selectRuralAccessUnit(id,focusDetails=false){
  if(!ruralAccessActive())return;
  const feature=ruralAccessFeatures().find(candidate=>ruralAccessId(candidate.properties)===String(id));
  if(!feature){clearRuralAccessSelection();return;}
  ruralAccessState.selectedId=String(id);syncRuralAccessHighlight();renderRuralAccessSelection();
  const selector=document.getElementById('ruralAccessUnit');if(selector)selector.value=String(id);
  if(window.innerWidth<=1024){document.querySelector('.panel').classList.add('mobile-open');document.getElementById('projectPanel').classList.remove('mobile-open');document.getElementById('eventPanel').classList.remove('mobile-open');updateMobileNavigation();}
  const detail=document.getElementById('ruralAccessSelection'),view=document.querySelector('.view-options');
  if(detail&&view){const delta=detail.getBoundingClientRect().top-view.getBoundingClientRect().top;if(delta<0||delta>view.clientHeight-65)view.scrollTop+=delta-8;}
  if(focusDetails&&window.innerWidth<=1024)document.getElementById('ruralAccessClear')?.focus({preventScroll:true});
}
function locateRuralAccessUnit(){
  let selected=null;active.ruralAccess?.eachLayer(layer=>{if(ruralAccessId(layer.feature.properties)===ruralAccessState.selectedId)selected=layer;});
  if(!selected||!selected.getBounds().isValid())return;
  const mobile=window.innerWidth<=1024;if(mobile)document.getElementById('mobileMap').click();
  map.fitBounds(selected.getBounds(),{paddingTopLeft:[30,30],paddingBottomRight:mobile?[30,90]:[380,40],maxZoom:11,animate:false});
  if(mobile)document.getElementById('mobileMap').focus({preventScroll:true});
}
function renderRuralAccessSelection(){
  const box=document.getElementById('ruralAccessSelection'),feature=selectedRuralAccessFeature();if(!box)return;
  if(!feature){box.hidden=true;box.replaceChildren();return;}
  const p=feature.properties||{},value=ruralAccessValue(p),area=[p.NAME_1,p.NAME_0].filter(Boolean).join(' · ');
  const noData=value==null?'<p class="theme-note">The source has no valid rural-population denominator for this unit; its access percentage is undefined.</p>':'';
  const side=p.country_side&&p.country_side!==p.NAME_0?row('Supplied country side',p.country_side):'';
  box.innerHTML='<header><p>SEDAC source unit · GADM v3.6</p><button id="ruralAccessClear" type="button" aria-label="Clear selected source unit" title="Clear selection">×</button></header><h3>'+esc(ruralAccessName(p))+'</h3><p class="rural-access-area">'+esc(area)+'</p><div class="rural-access-value'+(value==null?' rural-access-missing':'')+'">'+(value==null?'Not available':ruralAccessNumber(value,1)+'%')+'</div><p class="rural-access-stat-label">of rural population within 2 km of an all-season road</p>'+noData+'<table>'+row('Rural population · 2020',ruralAccessNumber(p.Pop_A2_R))+row('Rural population within 2 km',ruralAccessNumber(p.Pop_A2_R2K))+row('Beyond 2 km',value==null?'Not available':ruralAccessNumber(p.beyond_pct,1)+'%')+'</table><p class="theme-note">Value applies to the whole SEDAC source unit, including any area outside this cluster.</p><button id="ruralAccessLocate" type="button">Zoom to source unit</button><details><summary>Source record details</summary><table>'+row('Source record ID',ruralAccessId(p))+row('Source country',p.NAME_0)+row('Source region',p.NAME_1)+side+row('Supplied selection tag',p.supplied_coverage_label)+row('Release',p.source_release||'2023')+'</table></details>';
  box.hidden=false;
  document.getElementById('ruralAccessClear').onclick=()=>{clearRuralAccessSelection();document.getElementById('ruralAccessUnit')?.focus({preventScroll:true});};
  document.getElementById('ruralAccessLocate').onclick=locateRuralAccessUnit;
}
function renderRuralAccessControls(box){
  const controls=document.createElement('div');controls.className='rural-access-controls';
  controls.innerHTML='<p>Share of rural population within 2 km of an all-season road.</p><label for="ruralAccessUnit">Source unit<select id="ruralAccessUnit"><option value="">Select a source unit…</option></select></label><p class="rural-access-click-note">Click a district on the map to see its rural-access percentage here.</p><section id="ruralAccessSelection" class="rural-access-selection" role="region" aria-label="Selected rural access source unit" aria-live="polite" aria-atomic="true" hidden></section><details class="rural-access-method"><summary>Method and data</summary><p>CIESIN / NASA SEDAC · SDG 9.1.1 Rural Access Index, 2023 release. The percentage uses rural population as its denominator.</p><p>WorldPop 2020 population; GHSL 2015 urban/rural classification; OpenStreetMap roads dated 31 March 2022; GADM v3.6 source boundaries. All-season status is inferred from OSM road tags; 2 km measures geographic proximity. Current road passability and travel times are not measured.</p><p>Shading and country divisions follow the same original SEDAC source units. The separate OCHA reference borders and cluster outline are hidden in this view. Names supplied as unknown remain unchanged. Missing values are grey.</p><p><a href="https://doi.org/10.7927/fcre-m572" target="_blank" rel="noopener noreferrer">Source dataset and documentation</a></p></details>';
  box.appendChild(controls);
  const selector=document.getElementById('ruralAccessUnit');
  const sorted=[...ruralAccessFeatures()].sort((a,b)=>[a.properties.NAME_0,a.properties.NAME_1,ruralAccessName(a.properties)].join('|').localeCompare([b.properties.NAME_0,b.properties.NAME_1,ruralAccessName(b.properties)].join('|'),undefined,{numeric:true}));
  for(const feature of sorted){const p=feature.properties||{},option=document.createElement('option');option.value=ruralAccessId(p);option.textContent=ruralAccessName(p)+' · '+[p.NAME_1,p.country_side||p.NAME_0].filter(Boolean).join(' · ');selector.appendChild(option);}
  selector.value=ruralAccessState.selectedId||'';selector.onchange=()=>selectRuralAccessUnit(selector.value);renderRuralAccessSelection();
}
function ruralAccessLegend(){
  return '<section class="rural-access-key"><div class="metric-title">Rural population within 2 km of an all-season road</div><div class="legend-classes">'+ruralAccessBands.map(b=>legendItem('<span class="rural-access-swatch" style="background:'+b.colour+'"></span>',b.label)).join('')+legendItem('<span class="rural-access-swatch" style="background:#cbd5e1"></span>','No data')+'</div><p>Same percentage scale in all views.</p><p>SEDAC source admin 2 units · GADM v3.6. Figures refer to the full source polygons.</p></section>';
}
map.on('click',()=>{if(ruralAccessActive()&&ruralAccessState.selectedId)clearRuralAccessSelection();});

function nationalBorderLayer(){
  // Both strokes follow the same border reference, trimmed only outside the study context.
  const borderDisplay=DATA.bordersDisplay||DATA.borders;
  const s=DATA.nationalBorderStyle||{color:'#17242d',weight:2.5,opacity:1,haloColor:'#fffdf5',haloWeight:4.5,haloOpacity:.86};
  const common={interactive:false,fill:false,lineCap:'round',lineJoin:'round'};
  return L.layerGroup([
    geo(borderDisplay,{...common,color:s.haloColor,weight:s.haloWeight,opacity:s.haloOpacity},'International border','International border','nationalBorderPane'),
    geo(borderDisplay,{...common,color:s.color,weight:s.weight,opacity:s.opacity},'International border','International border','nationalBorderPane')
  ]);
}
const defs={
  ruralAccess:()=>ruralAccessLayer(),
  ruralCountryBorders:()=>geo(ruralAccessState.countryLines||(ruralAccessState.countryLines=window.wbRuralCountryLines(DATA.ruralAccessUnits||emptyFc())),{interactive:false,color:'#314b3d',weight:2.2,opacity:.95,smoothFactor:0,className:'rural-country-border'},'Country division','SEDAC source country division','boundaryPane'),
  borders:()=>nationalBorderLayer(),
  cluster:()=>geo(DATA.cluster,{interactive:false,color:"#597768",weight:1.2,opacity:.8,dashArray:"5 5",fillOpacity:0},"Working analytical extent","Working analytical extent","boundaryPane"),
  countryLabels:()=>labels(DATA.countryLabels,"country-label"),
  admin2:()=>geo(DATA.admin2,{interactive:currentPreset==="admin",color:"#050505",weight:1.2,opacity:.82,fillOpacity:0},"District / zone","Administrative district / zone","adminPane"),
  admin3:()=>geo(DATA.admin3,{interactive:currentPreset==="admin",color:"#050505",weight:1.25,opacity:.92,dashArray:"5 4",fillOpacity:0},"Sub-district","Administrative sub-district","adminPane"),
  admin2Labels:()=>labels(DATA.admin2Labels,"admin-label"),
  admin3Labels:()=>labels(DATA.admin3Labels,"admin-label admin3-label"),
  themeHex:()=>metricHexLayer(themeMetricMeta(currentPreset),"5 km hexagonal summary"),
  hexMetric:()=>hexMetricLayer(),
  landHex:()=>landHexLayer(),
  population:()=>rasterLayer("population"),
  builtNight:()=>rasterLayer("builtNight"),
  accessHex:()=>accessHexLayer(),
  climateHex:()=>climateHexLayer(),
  analysisHex:()=>analysisHexLayer(),
  towns:()=>townLayer(DATA.towns),
  primaryRoads:()=>geo(DATA.primaryRoads,{color:"#f97316",weight:2.6,opacity:.94},"Primary road","Primary road","roadPane"),
  secondaryRoads:()=>geo(DATA.secondaryRoads,{color:"#2563eb",weight:2.05,opacity:.88},"Secondary road","Secondary road","roadPane"),
  tertiaryRoads:()=>geo(DATA.tertiaryRoads,{color:"#7c3aed",weight:1.55,opacity:.80},"Tertiary road","Tertiary road","roadPane"),
  tracks:()=>geo(DATA.tracks,{color:"#9ca3af",weight:1.25,opacity:.82,dashArray:"6 4"},"Track","Mapped track","roadPane"),
  paths:()=>geo(DATA.paths,{color:"#d1a15b",weight:1.05,opacity:.82,dashArray:"2 5"},"Path","Mapped path","roadPane"),
  railways:()=>geo(DATA.railways,{color:"#111827",weight:2.0,opacity:.9,dashArray:"7 5"},"Railway","OpenStreetMap railway","railPane"),
  powerTransmission:()=>geo(DATA.powerTransmission,{color:"#facc15",weight:2.35,opacity:.92},"Power transmission","Power transmission line","linePane"),
  pipelines:()=>geo(DATA.pipelines,{color:"#db2777",weight:2.35,opacity:.92,dashArray:"8 5"},"Oil / gas pipeline","Oil / gas pipeline","linePane"),
  powerStations:()=>infrastructurePointLayer(DATA.powerStations,"power","Power station"),
  airports:()=>infrastructurePointLayer(DATA.airports,"airport","Airport / airfield"),
  ports:()=>infrastructurePointLayer(DATA.ports,"port","Port / ferry terminal"),
  unhcrFieldSites:()=>infrastructurePointLayer(DATA.unhcrFieldSites,"unhcr","UNHCR field site"),
  primaryCrossings:()=>crossingLayer(DATA.primaryCrossings,"primary"),
  secondaryCrossings:()=>crossingLayer(DATA.secondaryCrossings,"secondary"),
  tertiaryCrossings:()=>crossingLayer(DATA.tertiaryCrossings,"tertiary"),
  otherCrossings:()=>crossingLayer(DATA.otherCrossings,"other"),
  services:()=>serviceClusterLayer(),
  marketsContext:()=>singleServiceLayer("markets","markets"),
  healthContext:()=>singleServiceLayer("health","health"),
  acled:()=>acledClusterLayer()
};
function available(k){const mapping={towns:"towns",primaryRoads:"primaryRoads",secondaryRoads:"secondaryRoads",tertiaryRoads:"tertiaryRoads",tracks:"tracks",paths:"paths",railways:"railways",primaryCrossings:"primaryCrossings",secondaryCrossings:"secondaryCrossings",tertiaryCrossings:"tertiaryCrossings",otherCrossings:"otherCrossings",powerTransmission:"powerTransmission",pipelines:"pipelines",powerStations:"powerStations",airports:"airports",ports:"ports",unhcrFieldSites:"unhcrFieldSites",marketsContext:"markets",healthContext:"health"};if(mapping[k])return has(DATA[mapping[k]]);if(["population","builtNight"].includes(k))return !!(((DATA.rasters||{})[k]||{}).url);if(k==="accessHex")return !!Object.keys(DATA.accessHexMetrics||{}).length;if(k==="climateHex")return !!Object.keys(DATA.climateHexMetrics||{}).length;if(k==="landHex")return !!Object.keys(DATA.landCoverMetrics||{}).length;if(k==="analysisHex")return !!Object.keys(DATA.analysisGroups||{}).length;return true}
function syncRendererInteractivity(){map.eachLayer(layer=>{if(layer instanceof L.Canvas&&layer._container)layer._container.style.pointerEvents=Object.keys(layer._layers||{}).length?"auto":"none";});}
function add(k){
  if(active[k]||!defs[k]||!available(k))return;
  const layer=k==="towns"?(persistentLayers.towns||(persistentLayers.towns=defs.towns())):defs[k]();
  active[k]=layer;
  layer.addTo(map);
  syncRendererInteractivity();
  if(k==="towns")reactivateTownLayer(layer);
}
function remove(k){if(!active[k])return;map.removeLayer(active[k]);delete active[k];syncRendererInteractivity();}
function clear(){Object.keys(active).forEach(remove)}
function base(){const keys=ruralAccessActive()?['ruralCountryBorders','countryLabels']:['borders','cluster','countryLabels'];Object.keys(active).filter(k=>!keys.includes(k)).forEach(remove);keys.forEach(add);}
function addRoadNetwork(){["primaryRoads","secondaryRoads","tertiaryRoads","railways"].forEach(add);if(map.getZoom()>=10)["tracks","paths"].forEach(add)}
function addCrossings(){["primaryCrossings","secondaryCrossings","tertiaryCrossings","otherCrossings"].forEach(add)}
function addInfrastructure(){["powerTransmission","pipelines","powerStations","airports","ports","unhcrFieldSites"].forEach(add)}
function syncAdmin3Labels(){if(currentPreset!=="admin"&&!currentContext.has("adminReference"))return;if(map.getZoom()>=9)add("admin3Labels");else remove("admin3Labels")}
function applyContext(){
  if(currentContext.has("majorCorridors")&&currentPreset!=="connectivity"){add("primaryRoads");add("railways")}
  if(currentContext.has("feederRoads")){add("secondaryRoads");add("tertiaryRoads")}
  if(currentContext.has("crossings"))addCrossings();
  if(currentContext.has("towns")&&!sedac.urbanActive())add("towns");
  if(currentContext.has("markets"))add("marketsContext");
  if(currentContext.has("healthFacilities"))add("healthContext");
  if(currentContext.has("infrastructure"))addInfrastructure();
  if(currentContext.has("adminReference")){add("admin2");add("admin3");add("admin2Labels");syncAdmin3Labels()}
}
function applyPresetNow(name){
  const changedView=currentPreset!==name;
  currentPreset=name;
  if(changedView)document.querySelectorAll('.view-options,.map-key').forEach(section=>section.scrollTop=0);
  const selectedView=document.querySelector('button[data-preset="'+presetGroup(name)+'"]');
  renderThemeControls(name);
  if(name==='population')document.querySelector('.view-options').scrollTop=0;
  document.getElementById('activeViewTitle').textContent=selectedView?selectedView.textContent:'Map options';
  document.getElementById('viewHint').style.display=['clean','projects','towns','services','crossings','builtup','admin','infrastructure'].includes(name)?'block':'none';
  document.getElementById('viewHint').textContent=name==='clean'?'National borders, study extent and country labels.':name==='projects'?'Use the project directory to filter organisations and outcomes.':name==='crossings'?'Towns, roads and railways. Optional unverified border-intersection points are under Add context layers.':name==='infrastructure'?'Energy networks, power stations, airports, ports and towns. Click a feature for details.':'Use the key below to interpret this view.';

  // Retain Leaflet renderers: removing and reusing a Canvas can leave it blank.
  syncRendererInteractivity();

  document.querySelectorAll("button[data-preset]").forEach(b=>b.classList.toggle("active",b.dataset.preset===presetGroup(name)));
  base();
  if(name==="dataHex")add("hexMetric");
  if(name==="landCoverHex")add("landHex");
  if(name==="population"&&!["deprivation","deprivationHex"].includes(themeState.population))add(themeState.population==="raster"?"population":"themeHex");
  if(name==="builtup")add(themeState.builtup==="raster"?"builtNight":"themeHex");
  if(name==="admin"){add("admin2");add("admin3");add("admin2Labels");syncAdmin3Labels()}
  if(name==="services")add(themeState.services==="points"?"services":"themeHex");
  if(name==="acled")add(themeState.acled==="points"?"acled":analysisActive()?"analysisHex":"themeHex");
  if(name==="towns")add("towns");
  if(name==="crossings"){addRoadNetwork();if(!sedac.urbanActive(name))add("towns")}
  if(name==="infrastructure"){addInfrastructure();add("towns")};
  if(name==="access")add(ruralAccessActive()?"ruralAccess":analysisActive()?"analysisHex":"accessHex");
  if(name==="climate")add("climateHex");
  if(name==="analysis")add("analysisHex");
  applyEnvironment(name);
  applyContext();
  document.getElementById("acledFilters").style.display=name==="acled"&&themeState.acled==="points"?"block":"none";
  document.getElementById("hexControls").style.display=name==="dataHex"?"block":"none";
  document.getElementById("landControls").style.display=name==="landCoverHex"?"block":"none";
  document.getElementById("accessControls").style.display=name==="access"&&themeState.access==='travel'?"block":"none";
  document.getElementById("climateControls").style.display=name==="climate"?"block":"none";
  document.getElementById("analysisControls").style.display=analysisActive()?"block":"none";
  corridors.draw(name);
  corridorBand.draw(name);
  sedac.draw(name);
  refreshLegend(name);
}
function legendItem(symbol,label){return '<div class="legend-row">'+symbol+' '+label+'</div>'}
function gradientLegend(meta){
  if(!meta)return '';
  const title='<div class="metric-title">'+esc(meta.label)+'</div>'+(meta.unitLabel?'<div class="scale-note">'+esc(meta.unitLabel)+'</div>':'');
  if(meta.classes)return title+'<div class="legend-classes">'+(meta.zeroLabel?legendItem('<span class="land-swatch" style="background:'+meta.zeroColor+'"></span>',esc(meta.zeroLabel)):'')+meta.classes.map(b=>legendItem('<span class="land-swatch" style="background:'+b.colour+'"></span>',esc(b.label))).join('')+'</div><p class="scale-note">'+esc(meta.scaleNote||'Same class breaks in all views.')+'</p>';
  return title+'<div class="legend-gradient" style="background:'+esc(meta.gradient||'linear-gradient(90deg,#eff6ff,#2563eb,#08306b)')+'"></div><div class="legend-scale"><span>'+esc(meta.scaleLow||formatMetric(meta.low,meta))+'</span><span>'+esc(meta.scaleHigh||formatMetric(meta.high,meta))+'</span></div>';
}
function landClassLegend(){const meta=DATA.landCoverMeta||{},labels=meta.classLabels||{},colours=meta.classColors||{};return '<div style="font-weight:800;margin-top:5px">Dominant ESA land cover</div><div class="land-class-grid">'+Object.keys(labels).map(code=>'<div class="land-class-item"><span class="land-swatch" style="background:'+esc(colours[code]||"#e5e7eb")+'"></span>'+esc(labels[code])+'</div>').join("")+'</div>'}
function refreshContextLegend(name){
  const rows=[...(ruralAccessActive()?[legendItem('<span class="swatch-line" style="border-color:#314b3d"></span>','Country divisions · SEDAC source')]:[legendItem('<span class="swatch-line" style="border-color:#17242d;border-top-width:2.5px"></span>','International borders'),legendItem('<span class="swatch-line" style="border-color:#597768;border-top-style:dashed"></span>','Working analytical extent')]),legendItem('<span class="country-label" style="position:static;display:inline;transform:none;font-size:9px">COUNTRY</span>','Country labels')];
  if(name==="dataHex")rows.push(gradientLegend((DATA.hexMetrics||{})[currentHexMetric]));
  if(name==="landCoverHex"){const meta=(DATA.landCoverMetrics||{})[currentLandMetric];if(meta&&meta.type==="categorical")rows.push(landClassLegend());else if(meta)rows.push(gradientLegend(meta))}
  if(themeMetricMeta(name))rows.push(gradientLegend(themeMetricMeta(name)));
  if(name==="population"&&themeState.population==="raster")rows.push('<div style="font-weight:800;margin-top:5px">Population-grid counts · ~1 km source</div><div class="legend-gradient" style="background:linear-gradient(90deg,rgba(239,246,255,.2),#93c5fd,#2563eb,#08306b)"></div><div class="legend-scale"><span>Lower</span><span>Higher</span></div>');
  if(name==="builtup"&&themeState.builtup==="raster")rows.push(gradientLegend(DATA.hexMetrics.builtUp));
  if(name==="access"&&themeState.access==='travel')rows.push(gradientLegend((DATA.accessHexMetrics||{})[currentAccessMode]));
  if(ruralAccessActive())rows.push(ruralAccessLegend());
  if(name==="climate")rows.push(gradientLegend((DATA.climateHexMetrics||{})[currentClimateMode]));
  if(analysisActive())rows.push(gradientLegend(currentAnalysisMeta()));
  if(name==='access')rows.push(legendItem('<span class="land-swatch" style="background:#e5e7eb"></span>',themeState.access==='coverage'?'No population with valid travel-time data':'No valid source data')+(themeState.access==='coverage'?'<p>Historical 2019 travel model paired with 2025 population. Count colours use a square-root scale; each metric has its labelled range.</p>':''));
  if(name==="admin"){rows.push(legendItem('<span class="swatch-line"></span>','District / zone boundaries'));rows.push(legendItem('<span class="swatch-dash"></span>','Sub-district boundaries'));rows.push(legendItem('<span class="admin-label" style="position:static;display:inline;transform:none">Name</span>','Administrative labels'))}
  if(name==="towns"||(name==="crossings"&&!sedac.urbanActive(name))||name==="infrastructure"){rows.push(legendItem('<span class="town-symbol city" style="width:10px;height:10px;flex:0 0 auto"><span class="town-core"></span></span>','Cities'));rows.push(legendItem('<span class="town-symbol town" style="width:8px;height:8px;flex:0 0 auto"><span class="town-core"></span></span>','Towns'))}
  if(name==="services"&&themeState.services==="points"){
    if(has(DATA.schools))rows.push(legendItem('<span class="swatch-dot" style="background:#2563eb"></span>','Schools'));
    if(has(DATA.health))rows.push(legendItem('<span class="swatch-dot" style="background:#2a9d8f"></span>','Health facilities'));
    if(has(DATA.police))rows.push(legendItem('<span class="swatch-dot" style="background:#1e3a8a"></span>','Police'));
    if(has(DATA.markets))rows.push(legendItem('<span class="swatch-dot" style="background:#b45309"></span>','Markets'));
    rows.push(legendItem('<span class="cluster-swatch" style="background:conic-gradient(#2563eb 0 25%,#2a9d8f 25% 50%,#1e3a8a 50% 75%,#b45309 75% 100%)">+</span>','Clustered service points'));
  }
  if(name==="acled"&&themeState.acled==="points"){
    const types=Array.from(new Set(((DATA.acled||emptyFc()).features||[]).map(f=>String((f.properties||{}).event_type||"Other")))).sort();
    types.forEach(type=>rows.push(legendItem('<span class="swatch-dot" style="background:'+acledColour(type)+'"></span>',type)));
    rows.push(legendItem('<span class="cluster-swatch" style="background:conic-gradient(#d73027 0 50%,#7c3aed 50% 100%)">+</span>','Clustered ACLED incidents'));
  }
  if(name==="crossings"){
    if(has(DATA.primaryRoads))rows.push(legendItem('<span class="swatch-line" style="border-color:#f97316"></span>','Primary roads'));
    if(has(DATA.secondaryRoads))rows.push(legendItem('<span class="swatch-line" style="border-color:#2563eb"></span>','Secondary roads'));
    if(has(DATA.tertiaryRoads))rows.push(legendItem('<span class="swatch-line" style="border-color:#7c3aed"></span>','Tertiary roads'));
    if(map.getZoom()>=10&&has(DATA.tracks))rows.push(legendItem('<span class="swatch-dash" style="border-color:#9ca3af"></span>','Tracks'));
    if(map.getZoom()>=10&&has(DATA.paths))rows.push(legendItem('<span class="swatch-dash" style="border-color:#d1a15b"></span>','Paths'));
    if(has(DATA.railways))rows.push(legendItem('<span class="swatch-dash" style="border-color:#111827"></span>','Railways'));
  }
  if(name==="crossings"&&currentContext.has("crossings")){
    if(has(DATA.primaryCrossings))rows.push(legendItem('<span class="crossing-icon crossing-primary" style="width:11px;height:11px"><span>P</span></span>','Primary-road crossings'));
    if(has(DATA.secondaryCrossings))rows.push(legendItem('<span class="crossing-icon crossing-secondary" style="width:11px;height:11px">S</span>','Secondary-road crossings'));
    if(has(DATA.tertiaryCrossings))rows.push(legendItem('<span class="crossing-icon crossing-tertiary" style="width:11px;height:11px">T</span>','Tertiary-road crossings'));
    if(has(DATA.otherCrossings))rows.push(legendItem('<span class="crossing-icon crossing-other"></span>','Track / path crossings'));
  }
  if(name==="infrastructure"){
    if(has(DATA.powerTransmission))rows.push(legendItem('<span class="swatch-line" style="border-color:#facc15"></span>','Power transmission'));
    if(has(DATA.powerStations))rows.push(legendItem('<span class="infra-symbol infra-power" style="width:13px;height:13px;font-size:8px">⚡</span>','Power stations'));
    if(has(DATA.pipelines))rows.push(legendItem('<span class="swatch-dash" style="border-color:#db2777"></span>','Oil / gas pipelines'));
    if(has(DATA.airports))rows.push(legendItem('<span class="infra-symbol infra-airport" style="width:12px;height:12px;font-size:7px"><span>✈</span></span>','Airports and airfields'));
    if(has(DATA.ports))rows.push(legendItem('<span class="infra-symbol infra-port" style="width:13px;height:13px;font-size:8px">⚓</span>','Ports and ferry terminals'));
    if(has(DATA.unhcrFieldSites))rows.push(legendItem('<span class="infra-symbol infra-unhcr" style="width:13px;height:13px;font-size:7px">U</span>','UNHCR field sites'));
  }
  const sedacKey=sedac.legend(name);if(sedacKey)rows.unshift(sedacKey);
  const coverageNote=sourceCoverageNote(name);if(coverageNote)rows.push(coverageNote);
  if(environmentViews.includes(name)){const reference=rows.splice(0);rows.push(environmentLegend(name));rows.push('<details class="legend-reference"><summary>Reference symbols</summary>'+reference.join('')+'</details>');}
  if(currentContext.size){
    rows.push('<div style="font-weight:850;margin-top:8px">Added context</div>');
    if(currentContext.has("majorCorridors"))rows.push(legendItem('<span class="swatch-line" style="border-color:#f97316"></span>','Primary roads / railways'));
    if(currentContext.has("feederRoads"))rows.push(legendItem('<span class="swatch-line" style="border-color:#2563eb"></span>','Secondary / tertiary roads'));
    if(currentContext.has("crossings"))rows.push(legendItem('<span class="crossing-icon crossing-primary" style="width:11px;height:11px"><span>P</span></span>','Unverified road–border intersections'));
    if(currentContext.has("towns")&&!sedac.urbanActive())rows.push(legendItem('<span class="town-symbol town" style="width:8px;height:8px;flex:0 0 auto"><span class="town-core"></span></span>','Towns and cities'));
    if(currentContext.has("markets"))rows.push(legendItem('<span class="swatch-dot" style="background:#b45309"></span>','Mapped markets'));
    if(currentContext.has("healthFacilities"))rows.push(legendItem('<span class="swatch-dot" style="background:#2a9d8f"></span>','Mapped health facilities'));
    if(currentContext.has("infrastructure"))rows.push(legendItem('<span class="infra-symbol infra-power" style="width:13px;height:13px;font-size:8px">⚡</span>','Strategic infrastructure'));
    if(currentContext.has("adminReference"))rows.push(legendItem('<span class="swatch-dash"></span>','Administrative reference'));
  }
  let source=ruralAccessActive()?'Country divisions follow the shared edges of the SEDAC source units (GADM v3.6).':'National borders: OpenStreetMap · 27 October 2026; one shared reference network. Administrative polygons: HDX/OCHA and geoBoundaries. Not verified against the 2025 agreement.';
  if(environmentViews.includes(name))source="";
  if(name==="dataHex"&&String(currentHexMetric).startsWith("environment_"))source+=" Environmental summaries use native pixel centres within each hex; rainfall is area-weighted, settlement change uses matching GHSL epochs, and missing data remain unknown. See Sources and Limitations.";
  if(name==="dataHex"||themeMetricKey(name)){
    const byMetric={
      population:' WorldPop 2025 source counts allocated by equal-area pixel overlap, divided by hex area. Density is people/km²; missing source values remain unknown.',
      serviceCount:' © OpenStreetMap contributors; mapped service points counted within each 5 km hex.',
      acledEvents5y:' Armed Conflict Location & Event Data (ACLED); event counts within each 5 km hex for '+esc(DATA.acledYearRange||'the complete dated source period')+'.',
      acledFatalities5y:' Armed Conflict Location & Event Data (ACLED); reported fatalities summed within each 5 km hex for '+esc(DATA.acledYearRange||'the complete dated source period')+'.',
      nightLights:' Earth Observation Group, Colorado School of Mines, VIIRS Nighttime Lights, August 2026 average radiance.',
      builtUp:' JRC GHSL GHS-BUILT-S R2023A, satellite-derived 2018. Mean built-up land share from valid 100 m cells within each 5 km hex; zero is valid. This is not a population count.'
    };
    source+=byMetric[themeMetricKey(name)||currentHexMetric]||' Selected source aggregated to catchment-clipped 5 km hexes.';
  }
  if(name==="landCoverHex")source+=' European Space Agency, ESA WorldCover 10 m 2021 v200, sampled and aggregated to 5 km hexes.';
  if(name==="population"&&themeState.population==="raster")source+=' WorldPop 2025 constrained population surface, approximately 1 km resolution.';
  if(name==="builtup"&&themeState.builtup==="raster")source+=' JRC GHSL GHS-BUILT-S R2023A, satellite-derived 2018. Native 10 m values averaged to 100 m; image generalised for display. Built-up land share, not a building inventory or population count.';
  if(name==="access"&&themeState.access==='travel')source+=' Malaria Atlas Project accessibility to healthcare (2019) and accessibility to cities (2015), aggregated to 5 km hexes. Values are modelled minutes.';
  if(ruralAccessActive())source+=' Rural access shading: CIESIN / NASA SEDAC, SDG 9.1.1, 2023 release; WorldPop 2020, GHSL 2015, OSM 31 March 2022 and GADM v3.6.';
  if(name==="climate")source+=currentClimateMode==="drought"?' Global Drought Hazard based on SPEI, 25-year return period, aggregated to 5 km hexes.':' WRI Aqueduct Floods historical river-inundation hazard, 25-year return period, aggregated to 5 km hexes.';
  if(analysisActive())source+=currentAnalysis==="healthcare"?' WorldPop 2025 constrained population estimates weighted by Malaria Atlas Project healthcare accessibility (2019), aggregated to common travel-time bands in 5 km hexes.':' Armed Conflict Location & Event Data Project (ACLED); all supplied event types, including protests and riots, for '+esc(DATA.acledYearRange||'the complete dated source period')+'. Active periods record at least one included event in each calendar year; 2025 is partial.';
  if(sedac.urbanActive(name))source+=' JRC GHS-UCDB R2024A v1.2, 2025 urban-centre footprints and modelled population; whole source footprints, not clipped census counts.';else if(name==="towns"||name==="crossings")source+=' © OpenStreetMap contributors, via OSM-derived country extracts.';
  if(name==="services")source+=' © OpenStreetMap contributors, via OSM-derived points of interest. Service-count hexes summarise mapped points; the directory is not a complete inventory of functioning facilities.';
  if(name==="acled")source+=' Armed Conflict Location & Event Data Project (ACLED), Political Violence and Protest Event Data; dated source coverage '+esc(DATA.acledYearRange||"unknown")+(themeState.acled==='points'?'. Dot size is scaled by reported fatalities.':'. Hex summaries use the full supplied 2018–2025 period.');
  if(name==="crossings")source+=' Tracks and paths appear from zoom level 10; zoom in for local connections. Crossing points are calculated road–border intersections, not verified border posts.';
  if(name==="infrastructure")source+=' © OpenStreetMap contributors · 27 October 2026. Completeness and operational status are unverified.';
  if(["majorCorridors","feederRoads","towns","markets","healthFacilities"].some(key=>currentContext.has(key)))source+=' Added transport, settlement and service context: © OpenStreetMap contributors.';
  if(currentContext.has("crossings"))source+=' Crossing context is derived from OpenStreetMap roads and the shared OSM national-boundary reference; points are calculated intersections, not verified border posts.';
  if(currentContext.has("infrastructure"))source+=' Strategic-infrastructure context: © OpenStreetMap contributors · 27 October 2026.';
  if(currentContext.size)source+=' Added context layers are visual references and do not change the selected analytical values.';
  document.getElementById("legend").innerHTML=rows.join("")+'<div class="source-note">'+source+'</div><div class="credit-note">Mapping by Hugh Lamarque</div>';
}
function openMainView(name){
  // Subject buttons always start with the first visible sub-tab. Sub-tab clicks
  // still preserve the user's chosen settings within that subject.
  if(themeChoices[name])themeState[name]=(themeChoices[name].find(([key])=>!DATA.unavailable?.[key])||themeChoices[name][0])[0];
  if(name==='environment')environmentTheme=Object.keys(environmentThemes)[0];
  if(name==='transport'){transportTheme=Object.keys(transportThemes)[0];sedac.state.townSource='osm';sedac.state.town=null;}
  parent.WBVault.clearViewParameters();
  return setPreset(name);
}
document.querySelectorAll("button[data-preset]").forEach(b=>b.addEventListener("click",()=>{if(!b.disabled)openMainView(b.dataset.preset)}));
function sourcesVisible(){return document.getElementById("wbSourcesOverlay").classList.contains("wb-visible")}
function openSources(){const overlay=document.getElementById("wbSourcesOverlay"),button=document.getElementById("wbOpenSourcesButton");overlay.classList.add("wb-visible");overlay.setAttribute("aria-hidden","false");button.classList.add("wb-sources-open");button.textContent="Close data sources";document.getElementById("wbSourcesClose").focus()}
function closeSources(){const overlay=document.getElementById("wbSourcesOverlay"),button=document.getElementById("wbOpenSourcesButton");overlay.classList.remove("wb-visible");overlay.setAttribute("aria-hidden","true");button.classList.remove("wb-sources-open");button.textContent="Data sources & limitations"}
document.getElementById("wbOpenSourcesButton").addEventListener("click",function(event){event.stopPropagation();if(sourcesVisible())closeSources();else openSources()});
document.getElementById("wbSourcesClose").addEventListener("click",closeSources);
document.getElementById("wbSourcesOverlay").addEventListener("click",function(event){if(event.target===this)closeSources()});
document.addEventListener("keydown",function(event){if(event.key==="Escape"&&sourcesVisible())closeSources()});
function setupAcledFilters(){
  const features=((DATA.acled||emptyFc()).features||[]),years=Array.from(new Set(features.map(f=>String((f.properties||{}).year||"")).filter(Boolean))).sort().reverse(),types=Array.from(new Set(features.map(f=>String((f.properties||{}).event_type||"Other")))).sort();
  currentAcledYears=new Set(years);currentAcledTypes=new Set(types);
  function addPill(box,value,set,colour){const button=document.createElement("button");button.type="button";button.className="filter-pill active";button.setAttribute("aria-pressed","true");button.innerHTML='<span class="filter-dot" style="background:'+colour+'"></span><span>'+esc(value)+'</span>';button.addEventListener("click",function(event){event.stopPropagation();if(button.classList.toggle("active"))set.add(value);else set.delete(value);button.setAttribute("aria-pressed",String(button.classList.contains("active")));updateEventResults();});box.appendChild(button)}
  const yearBox=document.getElementById("acledYearFilters"),typeBox=document.getElementById("acledTypeFilters");yearBox.innerHTML="";typeBox.innerHTML="";
  years.forEach(year=>addPill(yearBox,year,currentAcledYears,"#111827"));types.forEach(type=>addPill(typeBox,type,currentAcledTypes,acledColour(type)));
}
function setupChoiceControls(){
  function fillButtons(id,items,current,change){const box=document.getElementById(id);box.innerHTML="";Object.keys(items||{}).forEach(function(key){const button=document.createElement("button");button.type="button";button.dataset.choice=key;button.textContent=(key.startsWith('environment_')&&environmentLabels[key.slice(12)])||items[key].shortLabel||items[key].label||key;button.classList.toggle("active",key===current);button.addEventListener("click",function(event){event.stopPropagation();box.querySelectorAll("button").forEach(item=>item.classList.toggle("active",item===button));change(key)});box.appendChild(button)})}
  const hexItems=DATA.hexMetrics||{};if(!hexItems[currentHexMetric])currentHexMetric=Object.keys(hexItems)[0]||"population";
  const landItems=DATA.landCoverMetrics||{};if(!landItems[currentLandMetric])currentLandMetric=Object.keys(landItems)[0]||"landCoverDominant";
  const accessItems=DATA.accessHexMetrics||{};
  const climateItems=DATA.climateHexMetrics||{};
  if(!accessItems[currentAccessMode])currentAccessMode=Object.keys(accessItems)[0]||"walkingHealth";
  if(!climateItems[currentClimateMode])currentClimateMode=Object.keys(climateItems)[0]||"drought";

  fillButtons("landMetricButtons",landItems,currentLandMetric,function(value){currentLandMetric=value;if(currentPreset==="landCoverHex"){remove("landHex");add("landHex");refreshLegend("landCoverHex")}});
  fillButtons("accessModeButtons",accessItems,currentAccessMode,function(value){currentAccessMode=value;if(currentPreset==="access"&&themeState.access==='travel'){remove("accessHex");add("accessHex");refreshLegend("access")}});
  fillButtons("climateModeButtons",climateItems,currentClimateMode,function(value){currentClimateMode=value;if(currentPreset==="climate"){remove("climateHex");add("climateHex");refreshLegend("climate")}});
}
function setupAnalysisControls(){
  const groups=DATA.analysisGroups||{},select=document.getElementById("analysisSelect"),modeBox=document.getElementById("healthModeButtons"),metricBox=document.getElementById("analysisMetricButtons");
  select.innerHTML="";
  Object.keys(groups).forEach(function(key){const option=document.createElement("option");option.value=key;option.textContent=groups[key].label||key;select.appendChild(option)});
  if(!groups[currentAnalysis])currentAnalysis=Object.keys(groups)[0]||"healthcare";
  select.value=currentAnalysis;
  function makeButtons(box,items,current,onChange){box.innerHTML="";Object.keys(items||{}).forEach(function(key){const item=items[key],button=document.createElement("button");button.type="button";button.textContent=item.shortLabel||item.label||key;button.classList.toggle("active",key===current);button.addEventListener("click",function(event){event.stopPropagation();box.querySelectorAll("button").forEach(candidate=>candidate.classList.toggle("active",candidate===button));onChange(key)});box.appendChild(button)})}
  function redrawAnalysis(){if(analysisActive()){remove("analysisHex");add("analysisHex");refreshLegend(currentPreset)}}
  function renderChoices(){
    const group=groups[currentAnalysis]||{};
    document.getElementById("healthModeControls").style.display=currentAnalysis==="healthcare"?"block":"none";
    if(currentAnalysis==="healthcare"){
      if(!(group.modes||{})[currentHealthMode])currentHealthMode=group.defaultMode||Object.keys(group.modes||{})[0]||"motor";
      const mode=group.modes[currentHealthMode]||{};
      if(!(mode.metrics||{})[currentAnalysisMetric])currentAnalysisMetric=group.defaultMetric||Object.keys(mode.metrics||{})[0]||"popGt120";
      makeButtons(modeBox,group.modes,currentHealthMode,function(value){currentHealthMode=value;const nextMode=group.modes[value]||{};if(!(nextMode.metrics||{})[currentAnalysisMetric])currentAnalysisMetric=group.defaultMetric||Object.keys(nextMode.metrics||{})[0];renderChoices();redrawAnalysis()});
      makeButtons(metricBox,mode.metrics,currentAnalysisMetric,function(value){currentAnalysisMetric=value;redrawAnalysis()});
    }else{
      const metrics=group.metrics||{};
      if(!metrics[currentAnalysisMetric])currentAnalysisMetric=group.defaultMetric||Object.keys(metrics)[0]||"activeYears";
      modeBox.innerHTML="";
      makeButtons(metricBox,metrics,currentAnalysisMetric,function(value){currentAnalysisMetric=value;redrawAnalysis()});
    }
  }
  select.style.display="none";select.previousElementSibling&&(select.previousElementSibling.style.display="none");
  select.addEventListener("change",function(){currentAnalysis=select.value;currentAnalysisMetric=(groups[currentAnalysis]||{}).defaultMetric||"activeYears";renderChoices();redrawAnalysis()});
  renderChoices();
}
function setupContextControls(){
  document.querySelectorAll('#contextMenu input[type="checkbox"]').forEach(function(input){input.addEventListener("change",function(event){event.stopPropagation();if(input.checked)currentContext.add(input.value);else currentContext.delete(input.value);setPreset(currentPreset,{keepContext:true})})});
}
// Included in the authenticated map script's closure, alongside DATA and map.
const PROJECT_OUTCOMES=DATA.projectOutcomes;
let projectFamilies=[],projectFiltered=[],projectMarkers=new Map(),projectLayer=null,projectShown=80;
let projectRecords=[],projectContextPromise=null,projectContextLoaded=false,projectFilterSerial=0;
let projectsReady=false,projectsPromise=null;
let projectExcelBusy=false,projectExcelPromise=null,projectSearchTimer;
const pEl=id=>document.getElementById(id);
const pEscape=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pURL=u=>{try{const v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:'';}catch(_){return '';}};
const pDate=v=>v||'Not reported';
const pOutcome=id=>(PROJECT_OUTCOMES[id]||{}).label||'Unclassified';
const pColour=id=>(PROJECT_OUTCOMES[id]||{}).colour||'#60716a';
const pScopeLabel=p=>p.scope_group==='local'?'Specific published location evidence':p.scope_group==='area'?'Area or uncertain location reference':p.scope_group==='documented'?'Documented local relevance · no mapped site coordinates':p.scope_group==='regional'?'Regional context · no local placement':'Country context · no local placement';
const pUnique=(items,key)=>[...new Map(items.map(item=>[key(item),item])).values()];
const pWbgId=operation=>[operation.institution,operation.official_id].filter(Boolean).join(' · ');
const pPlain=value=>String(value||'').replace(/_/g,' ').replace(/^\p{L}/u,letter=>letter.toUpperCase());
function projectSourceLabel(url){
  try{const host=new URL(url).hostname.toLowerCase();
    if(/(^|\.)(d-portal\.org|iatistandard\.org|iatiregistry\.org)$/.test(host))return 'IATI activity';
    if(/(^|\.)ifc\.org$/.test(host))return 'IFC disclosure';
    if(/(^|\.)miga\.org$/.test(host))return 'MIGA project';
    if(host==='projects.worldbank.org')return 'World Bank project';
    if(/(^|\.)worldbank\.org$/.test(host))return 'World Bank source';
    if(/(^|\.)undp\.org$/.test(host))return 'UNDP project source';
  }catch(_){}
  return 'Published source';
}
function projectSourceURLs(p){return [...new Set([...(p.source_urls||[]),...(p.wbg_operations||[]).map(o=>o.source_url),...(p.wbg_evidence||[]).map(e=>e.source_url)].filter(pURL))];}
function projectOrganisationNames(p){
  const names=new Set([p.organisation,...(p.records||[]).map(r=>r.organisation),...(p.wbg_operations||[]).map(o=>o.institution)].filter(Boolean));
  for(const o of p.organisations||[]){
    const name=String(o.name||''),ref=String(o.ref||'');
    if(/world bank|international development association|international bank for reconstruction/i.test(name)||['44000','XI-IATI-WBTF'].includes(ref))names.add('World Bank');
    if(/international finance corporation|^IFC$/i.test(name))names.add('IFC');
    if(/multilateral investment guarantee agency|^MIGA$/i.test(name))names.add('MIGA');
  }
  return [...names];
}
function syncProjectOrganisationOptions(){
  const select=pEl('projectOrg'),selected=select.value;
  const names=[...new Set([...(DATA.projectOrganisations||[]),...projectFamilies.flatMap(projectOrganisationNames)])].sort((a,b)=>a.localeCompare(b));
  select.replaceChildren();
  for(const [value,label] of [['','All organisations'],...names.map(name=>[name,name]),['__giz','GIZ · including implementing partner']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);}
  select.value=selected;
}
function projectWbgExportText(p){
  if(!(p.wbg_operations||[]).length&&!(p.wbg_evidence||[]).length)return '';
  return ['WBG sources (reviewed '+(p.wbg_research_date||'date not reported')+')',...(p.wbg_operations||[]).map(o=>[pWbgId(o),o.title,o.status,o.operation_type,o.temporal_scope,o.cluster_link_scope,o.associated_component,o.association_basis].filter(Boolean).join(' · ')),...(p.wbg_evidence||[]).map(e=>[e.project_key,e.place,e.evidence_summary,pPlain(e.delivery_status),pPlain(e.evidence_role),e.source_title,e.source_date,e.page].filter(Boolean).join(' · '))].join('\n');
}
function projectWbgDetails(p){
  const operations=p.wbg_operations||[],evidence=p.wbg_evidence||[];if(!operations.length&&!evidence.length)return '';
  const shown=new Set();
  const entry=e=>'<div class="project-wbg-evidence"><p><strong>'+pEscape(e.place||'Published geographical evidence')+'</strong></p><p>'+pEscape(e.evidence_summary||'')+'</p>'+(e.delivery_status||e.evidence_role?'<p class="project-wbg-meta">'+pEscape([pPlain(e.delivery_status),pPlain(e.evidence_role)].filter(Boolean).join(' · '))+'</p>':'')+'<p>'+(pURL(e.source_url)?'<a target="_blank" rel="noopener noreferrer" href="'+pEscape(pURL(e.source_url))+'">'+pEscape(e.source_title||'Source document')+'</a>':pEscape(e.source_title||'Source document'))+([e.source_date,e.page].filter(Boolean).length?'<br><span class="project-wbg-meta">'+pEscape([e.source_date,e.page].filter(Boolean).join(' · '))+'</span>':'')+'</p></div>';
  let body=operations.map(o=>{
    const items=evidence.filter(e=>e.project_key===o.key);items.forEach(e=>shown.add(e));
    const meta=[o.operation_type,o.status].filter(Boolean).join(' · ');
    const dates=[o.approval_date?'Approved '+o.approval_date:'',o.start_date?'Started '+o.start_date:'',o.end_date?'End '+o.end_date:''].filter(Boolean).join(' · ');
    return '<section class="project-wbg-operation"><h4>'+(pURL(o.source_url)?'<a target="_blank" rel="noopener noreferrer" href="'+pEscape(pURL(o.source_url))+'">'+pEscape(pWbgId(o))+'</a>':pEscape(pWbgId(o)))+'</h4><p>'+pEscape(o.title||'')+'</p><p class="project-wbg-meta">'+pEscape(meta)+(dates?'<br>'+pEscape(dates):'')+([o.temporal_scope,o.cluster_link_scope].filter(Boolean).length?'<br>'+pEscape([o.temporal_scope,o.cluster_link_scope].filter(Boolean).join(' · ')):'')+'</p>'+(o.association_basis?'<p><strong>Associated component: '+pEscape(o.associated_component||'Named component')+'</strong><br>'+pEscape(o.association_basis)+'</p>':'')+items.map(entry).join('')+'</section>';
  }).join('');
  body+=evidence.filter(e=>!shown.has(e)).map(e=>'<section class="project-wbg-operation"><h4>'+pEscape(e.project_key||'WBG source')+'</h4>'+entry(e)+'</section>').join('');
  return '<details class="project-wbg"><summary>WBG evidence'+(operations.length?' · '+operations.length+' operation'+(operations.length===1?'':'s'):'')+'</summary>'+body+(p.wbg_research_date?'<div class="project-wbg-operation"><p class="project-wbg-meta">Sources reviewed '+pEscape(p.wbg_research_date)+'. Named target areas do not establish completed delivery or a verified site.</p></div>':'')+'</details>';
}
// Ordinary words reviewed in the publisher's output labels. Unknown uppercase
// tokens retain their spelling, so acronyms and programme names are not damaged.
const projectTitleWords=new Set(('access accessing achievement action activities admin administrative adol adoles adolesce adolescent adolescents adoption against among and andhumanitarian andresponse assistance at available basic behav behavior behavioral behaviour behavioural birth budgets capabilities capacities capacity care caring chain change adaptive child sensitive childhood children climate closed clusters cold communication communications communities community comp component construction coordination costs crises cross cutting decision making defecation deficiencies deliver delivernutrition delivery demand deployment design detection development devlpmnt devt dietary diets displacement drinking early earlylearning earning education effective emegency emergencies emergency enabling end ending engagement enhanced enhancement enhancing enrolment environment equipment equitable essential evaluation every evidence exploitation facilities families field finance financi financial for formal foundational framework funds gender responsive generation governance harmful has health high quality human humanitarian hygiene hygieneeducation immunization improve improved in inclusive inclusivebasic increase info information institutions instruct integrated joint justice knowledge learing learning learningoutcomes legal lifecycle local malnutrition managed management marriage maternal micronutrient monitoring mortality multisectoral national neonatal nets newborn non staff norms nutrition of on open operational operations oportunities oppor opportunities other out outcomes output oversight package pathways pediatric planning plansand policies policy positive practices preparedness prev prevention primary program programme programmes project promote protection protectionfrom protective provision public quality reduced registration reporting resilience resilient resourc response retention rural safe safely safety salaries salary sanitation school age schools secondary sector sectoral security sensitive service services shock skilling skills social sources specific staff stakeholders stewardship streghten strengthened strengthenin strengthening stunting supply support system systems technical through to transferable treatment urban use vaccine violence wasting water with women worker young').split(' '));
function projectDisplayName(project){
  const raw=String(project.project_name||'').trim();if(!raw)return 'Unnamed project';
  if(/^USAID redacted this field in accordance with the exceptions outlined in the Foreign Aid Transparency and Accountability Act of 2016\.$/i.test(raw))return 'Project name not disclosed';
  let title=raw.replace(/^This activity will contribute to achieving results for the\s+/i,'');
  const wrapped=title!==raw;
  if(wrapped)title=title.replace(/^\d{3}\s+/,'');
  const withoutCode=title.replace(/^(?:OUTPUT|OUTCOME)\s+\d+(?:\.\d+)*(?:\s*[:–—-]\s*|\s+)/i,'');
  if(!wrapped&&withoutCode===title)return raw;
  title=withoutCode.replace(/\s+output\.?$/i,'').trim();
  if(!title)return raw;
  title=title.replace(/\bHIV-AIDS\b/gi,'HIV/AIDS').replace(/\s+-\s+/g,' – ');
  title=title.replace(/\b[A-Z][A-Z0-9]*\b/g,word=>projectTitleWords.has(word.toLowerCase())?word.toLowerCase():word);
  return title.replace(/^\p{L}/u,letter=>letter.toUpperCase());
}
function projectLocations(p,scope=pEl('projectScope').value){
  const locations=[...(p.mapped_locations||[]),...(p.broad_locations||[])];
  if(scope==='local')return locations.filter(l=>l.map_coordinates&&l.representative===false);
  if(scope==='area')return locations.filter(l=>l.map_coordinates&&l.representative!==false);
  return locations;
}
function projectGroup(records){
  const groups=new Map();
  for(const p of records){const id=p.family_id||p.project_id;if(!groups.has(id))groups.set(id,{...p,project_id:id,records:[],outcomes:[],mapped_locations:[],broad_locations:[],organisations:[],countries:[],source_urls:[],documents:[],issues:[],iati_ids:[]});groups.get(id).records.push(p);}
  return [...groups.values()].map(g=>{
    const parent=g.records.find(p=>p.project_id===g.project_id);if(parent){g.project_name=parent.project_name;g.description=parent.description;g.status=parent.status;g.classification_status=parent.classification_status;g.start_date=parent.start_date;g.end_date=parent.end_date;}
    for(const field of ['outcomes','countries','source_urls','issues','iati_ids'])g[field]=[...new Set(g.records.flatMap(p=>p[field]||[]))];
    for(const field of ['mapped_locations','broad_locations']){const seen=new Set();g[field]=g.records.flatMap(p=>p[field]||[]).filter(l=>{const id=JSON.stringify([l.map_coordinates,l.name,l.precision_label]);if(seen.has(id))return false;seen.add(id);return true;});}
    g.organisations=g.records.flatMap(p=>p.organisations||[]);g.documents=g.records.flatMap(p=>p.documents||[]);
    g.wbg_operations=pUnique(g.records.flatMap(p=>p.wbg_operations||[]),o=>o.key||pWbgId(o));
    g.wbg_evidence=pUnique(g.records.flatMap(p=>p.wbg_evidence||[]),e=>e.evidence_id||JSON.stringify([e.project_key,e.place,e.source_url,e.page]));
    g.wbg_source_labels=[...new Set(g.records.flatMap(p=>p.wbg_source_labels||[]))];
    g.wbg_documented=g.records.some(p=>p.wbg_documented);
    g.documented_local=g.records.some(p=>p.documented_local);
    g.geographic_evidence=pUnique(g.records.flatMap(p=>p.geographic_evidence||[]),e=>[e.place,e.excerpt,e.source_url].join('|'));
    g.wbg_research_date=g.records.map(p=>p.wbg_research_date).filter(Boolean).sort().at(-1)||'';
    const refs=projectLocations(g,'mapped').filter(l=>l.map_coordinates);
    g.scope_group=refs.some(l=>l.representative===false)?'local':refs.length?'area':(g.wbg_documented||g.documented_local)?'documented':g.records.some(p=>p.scope_group==='regional')?'regional':'national';
    g._search=[g.project_name,projectDisplayName(g),g.description,...projectOrganisationNames(g),...g.organisations.map(o=>o.name),...g.mapped_locations.map(l=>l.name),...g.broad_locations.map(l=>l.name),...g.wbg_operations.flatMap(o=>[o.official_id,o.title]),...g.wbg_evidence.flatMap(e=>[e.place,e.evidence_summary])].join(' ').toLocaleLowerCase();
    return g;
  }).sort((a,b)=>(b.project_id==='XM-DAC-41114-PROJECT-01006109')-(a.project_id==='XM-DAC-41114-PROJECT-01006109')||(b.organisation==='UNDP')-(a.organisation==='UNDP')||projectDisplayName(a).localeCompare(projectDisplayName(b)));
}
function projectMatches(p){
  const q=pEl('projectSearch').value.trim().toLocaleLowerCase(),outcome=pEl('projectOutcome').value,org=pEl('projectOrg').value,period=pEl('projectPeriod').value,scope=pEl('projectScope').value;
  if(q&&!p._search.includes(q))return false;if(outcome==='unclassified'&&p.outcomes.length)return false;if(outcome&&outcome!=='unclassified'&&!p.outcomes.includes(outcome))return false;
  if(org==='__giz'&&!p.records.some(r=>r.organisation==='GIZ'||(r.organisations||[]).some(o=>/\bgiz\b|internationale zusammenarbeit/i.test(o.name))))return false;
  if(org&&org!=='__giz'&&!projectOrganisationNames(p).includes(org)&&!p.records.some(r=>org==='FCDO'&&(r.organisations||[]).some(o=>o.role==='1'&&/fcdo|foreign,? commonwealth|GB-GOV-1/i.test(o.name+' '+o.ref))))return false;
  if(scope==='mapped'&&!['local','area'].includes(p.scope_group))return false;
  if(scope==='documented'&&!(p.wbg_documented||p.documented_local))return false;
  if(scope==='relevant'&&!['local','area','documented'].includes(p.scope_group))return false;
  if(['local','area'].includes(scope)&&!projectLocations(p,scope).length)return false;
  if(['national','regional'].includes(scope)&&p.scope_group!==scope)return false;
  const statuses=[...p.records.map(r=>r.status),...(p.wbg_operations||[]).map(o=>o.status)].map(value=>String(value||'').toLowerCase());
  if(period==='active'&&!statuses.includes('active'))return false;
  if(period==='planned'&&!statuses.some(value=>['planned','pipeline','proposed','pending'].includes(value)))return false;
  if(period==='closed'&&!statuses.some(value=>['closed','finalising','completed'].includes(value)))return false;
  return true;
}
const projectDisplayedOutcome=p=>p.outcomes.includes(pEl('projectOutcome').value)?pEl('projectOutcome').value:p.outcomes[0];
function projectHover(p){
  return '<div class="project-tooltip-title">'+pEscape(projectDisplayName(p))+'</div><div class="project-tooltip-org">'+pEscape(p.organisation||'Organisation not reported')+'</div>';
}
function projectIcon(p,loc){return L.divIcon({className:'project-pin-wrap',html:'<div class="project-pin '+(loc.representative!==false?'area':'')+'" style="--outcome:'+pColour(projectDisplayedOutcome(p))+';background:'+pColour(projectDisplayedOutcome(p))+'"></div>',iconSize:[21,21],iconAnchor:[10,10]});}
function projectClusterIcon(cluster){
  const markers=cluster.getAllChildMarkers(),families=new Map();markers.forEach(m=>families.set(m.options.projectId,m.options.outcome));
  const counts={};for(const c of families.values())counts[c||'unclassified']=(counts[c||'unclassified']||0)+1;
  let start=0;const stops=Object.entries(counts).map(([c,n])=>{const end=start+100*n/families.size;const v=pColour(c)+' '+start+'% '+end+'%';start=end;return v;});
  return L.divIcon({className:'project-cluster-wrap',html:'<div class="project-cluster" style="background:conic-gradient('+stops.join(',')+')"><span>'+families.size+'</span></div>',iconSize:[39,39]});
}
function ensureProjectLayer(){
  if(projectLayer)return;
  projectLayer=L.markerClusterGroup({clusterPane:'projectPane',maxClusterRadius:48,zoomToBoundsOnClick:false,spiderfyOnEveryZoom:true,spiderfyOnMaxZoom:true,spiderfyShapePositions:clusterRingPositions,showCoverageOnHover:false,removeOutsideVisibleBounds:true,animate:false,chunkedLoading:false,iconCreateFunction:projectClusterIcon});
  for(const p of projectFamilies){const markers=[];for(const loc of [...p.mapped_locations,...p.broad_locations]){
    if(!loc.map_coordinates)continue;const [x,y]=loc.map_coordinates;
    const m=L.marker([y,x],{pane:'projectPane',icon:projectIcon(p,loc),projectId:p.project_id,projectLocation:loc,locationEvidence:loc.representative===false?'local':'area',outcome:projectDisplayedOutcome(p),alt:projectDisplayName(p),keyboard:true,zIndexOffset:1800});
    m.bindTooltip(projectHover(p),{direction:'top',offset:[0,-10],sticky:true,opacity:1,className:'project-hover-tooltip'});
    m.on('click',()=>showProject(p.project_id,false));markers.push(m);
  }projectMarkers.set(p.project_id,markers);}
}
function hideProjectLayer(){
  if(!projectLayer)return;
  if(map.hasLayer(projectLayer))map.removeLayer(projectLayer);
  projectLayer.clearLayers();
}
function closeProjectDetails(){
  pEl('projectDetail').style.display='none';
  pEl('projectPanel').classList.remove('project-detail-open');
}
function projectMapIsVisible(){
  return projectsReady&&viewReady&&requestedPreset==='projects'&&currentPreset==='projects'&&pEl('projectOverlay').checked;
}
function renderProjectMap(){
  if(!projectMapIsVisible()){hideProjectLayer();return;}
  ensureProjectLayer();projectLayer.clearLayers();
  refreshLegend(currentPreset);
  if(!map.hasLayer(projectLayer))map.addLayer(projectLayer);
  for(const p of projectFiltered)for(const marker of projectMarkers.get(p.project_id)||[]){marker.options.outcome=projectDisplayedOutcome(p);marker.setIcon(projectIcon(p,marker.options.projectLocation));}
  const scope=pEl('projectScope').value;
  projectLayer.addLayers(projectFiltered.flatMap(p=>(projectMarkers.get(p.project_id)||[]).filter(m=>!['local','area'].includes(scope)||m.options.locationEvidence===scope)));
}
function renderProjectList(){
  const box=pEl('projectList');box.replaceChildren();
  for(const p of projectFiltered.slice(0,projectShown)){
    const b=document.createElement('button');b.type='button';b.className='project-row';
    b.innerHTML='<span class="project-name">'+pEscape(projectDisplayName(p))+'</span><span class="project-org">'+pEscape(p.organisation)+'</span><span class="project-tags">'+(p.outcomes.length?p.outcomes:['unclassified']).map(id=>'<span class="project-tag" style="border-left:3px solid '+pColour(id)+'">'+pEscape(pOutcome(id))+'</span>').join('')+'</span><span class="project-scope">'+pEscape(pScopeLabel(p))+' · '+pEscape(p.status)+'</span>';
    b.addEventListener('click',()=>showProject(p.project_id,true));box.appendChild(b);
  }
  if(projectFiltered.length>projectShown){const b=document.createElement('button');b.id='projectMore';b.textContent='Show next 80';b.onclick=()=>{projectShown+=80;renderProjectList();};box.appendChild(b);}
  if(!projectFiltered.length){const empty=document.createElement('p');empty.className='project-empty';empty.textContent='No projects match these filters. Try all working areas, or include country-wide and regional records.';box.appendChild(empty);}
}
async function loadProjectContext(){
  const manifest=await parent.WBVault.json(DATA.code+'/project_context');
  if(Array.isArray(manifest))return manifest;
  if(manifest.format!=='iati-context-parts-v1'||!Array.isArray(manifest.parts))throw new Error('Unrecognised project context format');
  const records=(await Promise.all(manifest.parts.map(name=>parent.WBVault.json(DATA.code+'/'+name)))).flat();
  if(records.length!==manifest.records)throw new Error('Incomplete project context download');
  return records;
}
async function filterProjects(){
  const ticket=++projectFilterSerial;
  closeProjectDetails();closeMapOverlays();hideProjectLayer();
  pEl('projectDownload').disabled=true;
  pEl('projectExcel').disabled=true;
  if(['all','national','regional'].includes(pEl('projectScope').value)&&!projectContextLoaded){
    pEl('projectCount').textContent='Loading country and regional records…';
    try{
      if(!projectContextPromise)projectContextPromise=loadProjectContext().then(records=>{projectRecords.push(...records);projectFamilies=projectGroup(projectRecords);syncProjectOrganisationOptions();projectContextLoaded=true;}).catch(e=>{projectContextPromise=null;throw e;});
      await projectContextPromise;
    }catch(e){if(ticket===projectFilterSerial)pEl('projectCount').textContent='Wider records could not load. Change the geographical filter to retry.';return false;}
  }
  if(ticket!==projectFilterSerial)return false;
  projectShown=80;projectFiltered=projectFamilies.filter(projectMatches);
  const specific=projectFiltered.filter(p=>projectLocations(p).some(l=>l.map_coordinates&&l.representative===false)).length;
  const areaOnly=projectFiltered.filter(p=>{const refs=projectLocations(p).filter(l=>l.map_coordinates);return refs.length&&!refs.some(l=>l.representative===false);}).length;
  const references=projectFiltered.reduce((n,p)=>n+projectLocations(p).filter(l=>l.map_coordinates).length,0);
  const documentaryOnly=projectFiltered.filter(p=>(p.wbg_documented||p.documented_local)&&!projectLocations(p).some(l=>l.map_coordinates)).length;
  pEl('projectCount').textContent=projectFiltered.length.toLocaleString()+' project families · '+specific+' with specific published coordinates · '+areaOnly+' with area references only'+(documentaryOnly?' · '+documentaryOnly+' documented without mapped coordinates':'')+' · '+references+' map references';
  renderProjectList();renderProjectMap();pEl('projectDownload').disabled=false;pEl('projectExcel').disabled=projectExcelBusy;
  return true;
}

function projectMoney(row){
  const value=Number(row.amount);return pEscape(row.currency)+' '+(Number.isFinite(value)?value.toLocaleString('en-GB',{maximumFractionDigits:2}):pEscape(row.amount));
}
function projectFinancialText(p){
 const lines=[];
 for(const r of p.records||[p]){
  const f=r.financials||{},transactions=f.transactions||[],budgets=f.budgets||[];
  if(!transactions.length&&!budgets.length)continue;
  lines.push(r.project_id+' — '+r.project_name);
  for(const t of transactions)lines.push(t.type+': '+t.currency+' '+t.amount+'; '+(t.from_date||'date not reported')+' to '+(t.through_date||'date not reported'));
  for(const b of budgets.slice(-3))lines.push(b.type+' budget: '+b.currency+' '+b.amount+'; '+b.period_start+' to '+b.period_end);
 }
 return lines.length?lines.join('\n')+'\nWhole published activities, not borderland allocations. Do not add parent/child records, transaction types, currencies or donor/implementer reports.':'No comparable financial values were published in the retrieved records.';
}
function projectFinanceDetails(p){
 const records=(p.records||[p]).filter(r=>(r.financials?.transactions||[]).length||(r.financials?.budgets||[]).length);
 if(!records.length)return '<h4>Published funding</h4><p>No usable budget or transaction values in these records.</p>';
 return '<h4>Published funding</h4><p class="project-finance-note">Whole activity amounts in their original currencies. These are not estimates of spending in the borderlands. Commitments, disbursements and expenditure are separate measures; parent, output and donor records can overlap.</p>'+records.map((r,i)=>{
  const f=r.financials,transactions=f.transactions||[],budgets=f.budgets||[];
  const body=transactions.map(t=>'<tr><th>'+pEscape(t.type)+'</th><td>'+projectMoney(t)+'<small>'+(t.from_date?pEscape(t.from_date)+' – ':'')+pEscape(t.through_date||'Dates not published')+'</small></td></tr>').join('');
  const budgetRows=budgets.slice(-3).map(b=>'<tr><th>'+pEscape(b.type)+' budget</th><td>'+projectMoney(b)+'<small>'+pEscape(b.period_start)+' – '+pEscape(b.period_end)+'</small></td></tr>').join('');
  return '<details class="project-finance"'+(records.length===1?' open':'')+'><summary>'+pEscape(r.project_name)+'<small>'+pEscape(r.project_id)+'</small></summary><table>'+body+budgetRows+'</table><p>Transactions through 28 October 2026; negative adjustments retained. The latest three reported budget entries are shown.</p></details>';
 }).join('');
}
function projectEvidenceDetails(p){
 const items=p.geographic_evidence||[];
 if(!items.length)return '';
 return '<h4>Named-area evidence</h4><p>These are references in the publisher’s narrative or location fields. They may describe intended, historical or wider activity. An Osh-region reference does not establish a site in the restricted study portion.</p>'+items.map(e=>'<div class="project-evidence"><strong>'+pEscape(e.place)+'</strong><p>'+pEscape(e.excerpt)+'</p><small>'+pEscape(e.basis)+' · <a target="_blank" rel="noopener noreferrer" href="'+pEscape(pURL(e.source_url))+'">IATI record</a></small></div>').join('');
}
function projectDocuments(p){
 const docs=pUnique((p.documents||[]).filter(d=>pURL(d.url)),d=>d.url);
 return docs.length?'<details class="project-documents"><summary>Publisher documents · '+docs.length+'</summary>'+docs.map(d=>'<p><a target="_blank" rel="noopener noreferrer" href="'+pEscape(pURL(d.url))+'">'+pEscape(d.title||'Publisher document')+'</a></p>').join('')+'</details>':'';
}

function showProject(id,zoom){
  const p=projectFamilies.find(p=>p.project_id===id);if(!p)return;const detail=pEl('projectDetail');
  const links=projectSourceURLs(p);
  const locations=projectLocations(p);
  detail.innerHTML='<button type="button" id="projectBack">← Project list</button><h3>'+pEscape(projectDisplayName(p))+'</h3><p><strong>'+pEscape(p.organisation)+'</strong><br>'+pEscape(p.status)+' · '+pEscape(pDate(p.start_date))+' – '+pEscape(pDate(p.end_date))+'</p><div class="project-tags">'+p.outcomes.map(c=>'<span class="project-tag">'+pEscape(pOutcome(c))+'</span>').join('')+'</div><p>'+pEscape(p.description||'No description published.')+'</p><h4>Geographical evidence</h4><p>'+pEscape(pScopeLabel(p))+'. '+(locations.length?'These references are evidence about the published locations or named areas, not independently verified field sites.':'The source does not establish a location in this cluster. No pin has been placed.')+'</p><div id="projectLocations"></div>'+projectEvidenceDetails(p)+projectFinanceDetails(p)+projectWbgDetails(p)+'<h4>Classification and dates</h4><p>'+pEscape(p.classification_status==='Sam register'?'Working areas follow Sam Sager’s register, matched by official project ID.':'Working areas are provisional, based on the published narrative and sector codes.')+' Dates and status are as reported by the publisher; “active” may be out of date.</p>'+(p.records.length>1?'<p>'+p.records.length+' explicitly related activity records are grouped here. Dates above follow the parent record where available.</p>':'')+(p.issues.length?'<ul>'+p.issues.map(v=>'<li>'+pEscape(v)+'</li>').join('')+'</ul>':'')+projectDocuments(p)+'<h4>Sources</h4><p>'+links.map((u,i)=>'<a target="_blank" rel="noopener noreferrer" href="'+pEscape(pURL(u))+'">'+pEscape(projectSourceLabel(u))+(links.length>1?' '+(i+1):'')+'</a>').join('<br>')+'</p><p>Source checked: '+pEscape(p.retrieved)+'. Publisher update: '+pEscape(p.publisher_updated||'not supplied')+'.</p><p class="project-record-ids">'+pEscape(p.iati_ids.join(' · '))+'</p>';
  setProjectPanelVisible(true);
  detail.style.display='block';detail.scrollTop=0;pEl('projectPanel').classList.add('mobile-open','project-detail-open');document.querySelector('.panel').classList.remove('mobile-open');pEl('projectBack').onclick=closeProjectDetails;
  const implementers=[...new Set(p.organisations.filter(o=>o.role==='4').map(o=>o.name).filter(Boolean))];
  if(implementers.length){const note=document.createElement('p');note.textContent='Reported implementing organisations: '+implementers.join('; ');detail.insertBefore(note,detail.querySelector('h4'));}
  for(const loc of locations){const b=document.createElement('button');b.type='button';b.className='project-location';b.textContent=(loc.name||loc.area_name||'Published location')+' · '+loc.precision_label;b.disabled=!loc.map_coordinates;b.onclick=()=>{const xy=loc.map_coordinates;map.setView([xy[1],xy[0]],Math.max(map.getZoom(),loc.representative?8:10));L.popup().setLatLng([xy[1],xy[0]]).setContent('<strong>'+pEscape(projectDisplayName(p))+'</strong><p>'+pEscape(loc.name||loc.area_name||'Published location')+'<br>'+pEscape(loc.precision_label)+'</p>').openOn(map);};pEl('projectLocations').appendChild(b);}
  if(zoom){const points=locations.filter(l=>l.map_coordinates).map(l=>[l.map_coordinates[1],l.map_coordinates[0]]);if(points.length)map.fitBounds(L.latLngBounds(points),{paddingTopLeft:window.innerWidth>1024&&!document.body.classList.contains('directory-hidden')?[375,45]:[25,25],paddingBottomRight:window.innerWidth>1024?[360,45]:[25,100],maxZoom:10});}
  corridors.projectDetails(p,detail);
}
function downloadProjects(){
  const cols=['project_id','family_id','project_name','organisation','working_areas','start_date','end_date','status','scope','location_name','longitude','latitude','location_precision','representative','classification','source_url','source_checked','wbg_operation_ids','wbg_institutions','wbg_evidence','wbg_reviewed','published_financial_values','financial_scope'];
  const cell=v=>{let s=String(v==null?'':v);if(typeof v!=='number'&&/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const rows=[cols];for(const p of projectFiltered){for(const r of p.records){const locs=projectLocations(r);if(['local','area'].includes(pEl('projectScope').value)&&!locs.length)continue;for(const l of (locs.length?locs:[{}])){const xy=l.map_coordinates||['',''];rows.push([r.project_id,p.project_id,r.project_name,r.organisation,r.outcomes.map(pOutcome).join(' | '),r.start_date,r.end_date,r.status,r.scope_group,l.name||l.area_name||'',xy[0],xy[1],l.precision_label||'No local placement',l.representative==null?'':l.representative,r.classification_status,projectSourceURLs(r).join(' | '),r.retrieved,(r.wbg_operations||[]).map(o=>o.official_id).join(' | '),[...new Set((r.wbg_operations||[]).map(o=>o.institution))].join(' | '),projectWbgExportText(r),r.wbg_research_date||'',projectFinancialText(r),'Whole activity; repeated location rows are not additive']);}}}
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=DATA.code+'_projects_filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function projectExportSnapshot(){
  const label=id=>{const e=pEl(id);return e.options[e.selectedIndex].textContent;};
  const scope=pEl('projectScope').value,projects=[],locations=[],activityIds=new Set();
  const unique=values=>[...new Set(values.filter(Boolean))];
  for(const p of projectFiltered){
    const refs=projectLocations(p,scope),records=p.records||[p];
    records.forEach(r=>activityIds.add(r.project_id));
    projects.push([p.project_name,p.organisation,p.outcomes.length?p.outcomes.map(pOutcome).join('\n'):'Unclassified',p.status,p.start_date||'',p.end_date||'',p.countries.join(', '),refs.length,p.project_id,unique(records.flatMap(r=>r.iati_ids||[])).join('\n'),p.classification_status||'',unique(records.map(r=>r.retrieved)).join('\n'),projectSourceURLs(p).join('\n'),[p.description||'',projectWbgExportText(p),projectFinancialText(p)].filter(Boolean).join('\n\n')]);
    const seen=new Set();
    for(const loc of refs){
      const identity=l=>JSON.stringify([l.map_coordinates||null,l.name||l.area_name||'',l.precision_label||'',l.representative]);
      const id=identity(loc);if(seen.has(id))continue;seen.add(id);
      const owners=records.filter(r=>projectLocations(r,scope).some(l=>identity(l)===id));
      const xy=loc.map_coordinates||[];
      locations.push([p.project_name,loc.name||loc.area_name||'Published location',loc.precision_label||'Not reported',!loc.map_coordinates?'No coordinates — documentary area':loc.representative==null?'Not reported':loc.representative?'Yes — broad / uncertain reference':'No — specific published coordinates',typeof xy[0]==='number'?xy[0]:null,typeof xy[1]==='number'?xy[1]:null,p.project_id,owners.map(r=>r.project_id).join('\n'),unique([...owners.flatMap(projectSourceURLs),loc.source_url]).filter(pURL).join('\n')]);
    }
    // Match the deduplicated rows in Locations, including any non-mapped references.
    projects[projects.length-1][7]=seen.size;
  }
  return {cluster:DATA.title||document.title,code:DATA.code,exported:new Date().toISOString(),filters:{search:pEl('projectSearch').value.trim(),outcome:label('projectOutcome'),organisation:label('projectOrg'),period:label('projectPeriod'),geography:label('projectScope')},projects,locations,activityCount:activityIds.size};
}
function loadProjectExcel(){
  if(!projectExcelPromise)projectExcelPromise=(async()=>{
    if(!window.WBProjectExcel)await new Promise((resolve,reject)=>{
      const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();reject(new Error('Excel download timed out. Please try again.'));},30000);
      script.src='export/xlsx_export.js?v=2026-09-09.5';script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Excel tools could not load. Please try again.'));};document.head.appendChild(script);
    });
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),30000);
    try{const response=await fetch('export/xlsx_template.json?v=2026-09-09.5',{signal:abort.signal});if(!response.ok)throw new Error('Excel template could not load. Please try again.');return await response.json();}
    finally{clearTimeout(timer);}
  })().catch(error=>{projectExcelPromise=null;throw error;});
  return projectExcelPromise;
}
async function downloadProjectsExcel(){
  if(projectExcelBusy)return;
  const button=pEl('projectExcel'),status=pEl('projectExportStatus');
  projectExcelBusy=true;button.disabled=true;button.textContent='Preparing…';status.textContent='Preparing Excel…';
  try{
    clearTimeout(projectSearchTimer);
    if(!await filterProjects())throw new Error('The filters changed or records could not load. Please try the export again.');
    const snapshot=projectExportSnapshot(); // Freeze the selection before any asynchronous download.
    const template=await loadProjectExcel();
    const blob=window.WBProjectExcel.workbook(template,snapshot),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=DATA.code+'_projects_'+snapshot.exported.slice(0,10)+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    status.textContent='Downloaded '+snapshot.projects.length.toLocaleString()+' project families.';
  }catch(error){status.textContent=error.name==='AbortError'?'Excel download timed out. Please try again.':error.message||'Excel export failed. Please try again.';}
  finally{projectExcelBusy=false;button.disabled=pEl('projectDownload').disabled;button.textContent='Download Excel';}
}
async function ensureProjects(){
  if(projectsReady)return;
  if(!projectsPromise)projectsPromise=setupProjects().catch(error=>{projectsPromise=null;pEl('projectCount').textContent='Projects could not load. Select Project work to retry.';throw error;});
  return projectsPromise;
}
async function setupProjects(){
  const records=await parent.WBVault.json(DATA.code+'/projects');projectRecords=records;projectFamilies=projectGroup(records);
  for(const [id,v] of Object.entries(PROJECT_OUTCOMES)){const o=document.createElement('option');o.value=id;o.textContent=v.label;pEl('projectOutcome').appendChild(o);}const unc=document.createElement('option');unc.value='unclassified';unc.textContent='Unclassified';pEl('projectOutcome').appendChild(unc);
  syncProjectOrganisationOptions();
  pEl('projectSearch').addEventListener('input',()=>{clearTimeout(projectSearchTimer);pEl('projectExcel').disabled=true;pEl('projectDownload').disabled=true;projectSearchTimer=setTimeout(filterProjects,180);});
  for(const id of ['projectOutcome','projectOrg','projectPeriod','projectScope'])pEl(id).addEventListener('change',filterProjects);
  pEl('projectOverlay').onchange=()=>{renderProjectMap();refreshLegend(currentPreset);};pEl('projectDownload').onclick=downloadProjects;pEl('projectReset').onclick=()=>{pEl('projectSearch').value='';pEl('projectOutcome').value='';pEl('projectOrg').value='';pEl('projectPeriod').value='all';pEl('projectScope').value='relevant';pEl('projectOverlay').checked=true;pEl('projectDetail').style.display='none';filterProjects();};
  projectsReady=true;pEl('projectFilters').disabled=false;pEl('projectReset').disabled=false;
  pEl('projectExcel').onclick=downloadProjectsExcel;
  await filterProjects();
}
function syncDirectoryToggle(button,visible,label){
  const title=(visible?'Hide ':'Show ')+label;
  button.innerHTML='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 5 5 5-5 5"/></svg>';
  button.title=title;button.setAttribute('aria-label',title);button.setAttribute('aria-expanded',String(visible));
}
function setProjectPanelVisible(visible){
  document.body.classList.toggle('directory-hidden',!visible);
  pEl('projectPanel').classList.toggle('mobile-open',visible&&window.innerWidth<=1024);
  pEl('directoryToggle').hidden=requestedPreset!=='projects';
  syncDirectoryToggle(pEl('directoryToggle'),visible,'project directory');
  if(visible&&window.innerWidth<=1024)document.querySelector('.panel').classList.remove('mobile-open');
  updateMobileNavigation();
}
function updateMobileNavigation(){
  const projects=pEl('projectPanel').classList.contains('mobile-open')||eEl('eventPanel').classList.contains('mobile-open'),views=document.querySelector('.panel').classList.contains('mobile-open');
  for(const [id,on] of [['mobileProjects',projects],['mobileLayers',views],['mobileMap',!projects&&!views]])pEl(id).setAttribute('aria-pressed',String(on));
  document.body.classList.toggle('mobile-panel-open',projects||views);
  pEl('mobileProjects').textContent=requestedPreset==='acled'?'Events':'Projects';
  if(projects||views)pEl('mobileKey').open=false;
}
function setupProjectNavigation(){
  setProjectPanelVisible(false);
  pEl('projectFilterMore').open=window.innerWidth>1024;
  window.addEventListener('resize',()=>{if(window.innerWidth>1024)pEl('projectFilterMore').open=true;updateMobileNavigation();});
  pEl('mobileProjects').onclick=()=>{
    if(requestedPreset==='acled'){if(themeState.acled!=='points'){selectThemeMode('acled','points');return;}setEventPanelVisible(!eEl('eventPanel').classList.contains('mobile-open'));return;}
    if(requestedPreset!=='projects'||!viewReady){setPreset('projects');return;}
    setProjectPanelVisible(!pEl('projectPanel').classList.contains('mobile-open'));
  };
  pEl('mobileLayers').onclick=()=>{document.querySelector('.panel').classList.toggle('mobile-open');pEl('projectPanel').classList.remove('mobile-open');eEl('eventPanel').classList.remove('mobile-open');updateMobileNavigation();};
  const returnToMap=()=>{document.querySelector('.panel').classList.remove('mobile-open');pEl('projectPanel').classList.remove('mobile-open');eEl('eventPanel').classList.remove('mobile-open');updateMobileNavigation();};
  pEl('mobileMap').onclick=returnToMap;
  for(const id of ['mobileViewsClose','mobileProjectsClose'])pEl(id).onclick=()=>{returnToMap();pEl('mobileMap').focus({preventScroll:true});};
  pEl('directoryToggle').onclick=()=>{
    if(requestedPreset!=='projects'||!viewReady){setPreset('projects');return;}
    setProjectPanelVisible(document.body.classList.contains('directory-hidden'));
  };
}
function refreshLegend(name){
  refreshContextLegend(name);
  corridors.legend(name);
  corridorBand.legend(name);
  if(!projectMapIsVisible()){pEl('mobileLegend').innerHTML=pEl('legend').innerHTML;return;}
  const legend=pEl('legend'), section=document.createElement('div');section.className='project-legend';
  const outcomes={...PROJECT_OUTCOMES,unclassified:{label:'Unclassified',colour:'#60716a'}};
  section.innerHTML='<strong>Development projects</strong>'+Object.entries(outcomes).map(([id,v])=>'<div class="project-legend-row"><span class="project-dot" style="background:'+v.colour+'"></span>'+pEscape(v.label)+'</div>').join('')+'<div class="project-note">Numbers count distinct project families, not verified sites. Filled circles show specific published coordinates; hollow diamonds show area references or uncertain location precision. Country-wide and regional records without local evidence are available in the directory.</div>';
  legend.appendChild(section);
  const credit=legend.querySelector('.credit-note');if(credit)legend.appendChild(credit);
  pEl('mobileLegend').innerHTML=legend.innerHTML;
  corridors.legend(name);
}

// All environmental layers participate in the same cancellable view lifecycle.
const environmentLabels={rain2025:'Annual rainfall · 2025',rain202609:'Monthly rainfall · September 2026',built2000:'Built-up area · 2000',built2020:'Built-up area · 2020',builtChange:'Built-up change · 2000–2020',water_any:'Area with any water · 2024',water_seasonal:'Seasonal water area · 2024',water_permanent:'Permanent water area · 2024',waterOccurrence:'Water detection frequency · 1984–2024',waterSeasonality:'Months with water · 2024'};
const environmentViews=['rainfall','surfaceWater','groundwater','waterpoints','settlement'];
const environmentState={rainfall:'rain2025',surfaceWater:'water_any',settlement:'builtChange',display:'hex',waterPresence:'all'};
const aquiferTypes={U:['Unconsolidated sediments','#3b82f6'],CSF:['Sedimentary · fracture flow','#e69b42'],CSI:['Sedimentary · pore flow','#5da56f'],CSIF:['Sedimentary · mixed flow','#9564ad'],CSK:['Sedimentary · karst','#36a9a2'],CSFK:['Sedimentary · fracture / karst','#36a9a2'],CSIFK:['Sedimentary · mixed / karst','#36a9a2'],I:['Igneous / volcanic','#bc5656'],V:['Volcanic','#de5959'],IV:['Igneous / volcanic','#de5959'],'U/CSI':['Unconsolidated / sedimentary pore flow','#489da3'],B:['Basement','#9c7865']};
function aquiferInfo(code){return aquiferTypes[String(code||'').split('-')[0].trim().toUpperCase()]||['Aquifer class unspecified','#b5b5b5'];}
function productivityLabel(code){const text=String(code||'');if(!/^(?:U(?:\/CSI)?|CS[FIK]+|B|I|IV|V)-/.test(text))return 'Not classified in source';const raw=text.split('-').slice(1).join('-');const labels={VH:'Very high',H:'High',M:'Moderate',LM:'Low to moderate',L:'Low',VL:'Very low'};return raw.replace(/\b(VH|VL|LM|H|M|L)\b/g,k=>labels[k]).replaceAll('(V)',' (variable)').replaceAll('(*)',' (see original legend)')||'Unspecified';}
function selectedEnvironmentKey(name){return environmentState[name];}
function environmentMeta(name){const meta=(DATA.environmentMetrics||{})[selectedEnvironmentKey(name)];if(!meta)return meta;if(environmentState.display!=='raster')return meta;const out={...meta,...meta.rasterScale};delete out.classes;delete out.zeroLabel;return out;}
function environmentGroups(name){
  if(name==='waterpoints'||name==='groundwater')return [name];
  if(!environmentViews.includes(name))return [];
  return environmentState.display==='raster'?['raster_'+selectedEnvironmentKey(name)]:['hexes'];
}
function environmentChoices(name){
  if(name==='rainfall')return ['rain2025','rain202609'];
  if(name==='settlement')return ['built2000','built2020','builtChange'];
  if(name==='surfaceWater')return environmentState.display==='raster'?['waterOccurrence','waterSeasonality']:['water_any','water_seasonal','water_permanent','waterOccurrence'];
  return [];
}
function normaliseEnvironmentChoice(name){const keys=environmentChoices(name);if(keys.length&&!keys.includes(environmentState[name]))environmentState[name]=keys[0];}
function environmentNote(name){
  if(name==='rainfall')return 'CHIRPS v3 · rainfall in millimetres. Annual 2025 and September 2026 cover different periods; these are totals, not rainfall anomalies. The same annual scale (0–3,000 mm) and separate monthly scale (0–400 mm) apply in all views. Values above the scale maximum use the darkest colour.';
  if(name==='surfaceWater')return 'JRC Global Surface Water · occurrence 1984–2024; seasonality 2024. Hex water-area shares use observed pixels only. Missing observations are unknown.';
  if(name==='settlement')return 'GHSL R2023A · modelled 2000 and 2020 epochs. Change is in percentage points of built-up area, not population growth or recent construction. Hexes use common classes that distinguish small changes; raster overviews use a separate, cluster-specific range. Neither display measures recent construction.';
  if(name==='groundwater')return 'BGS / Africa Groundwater Atlas · 1:5 million regional hydrogeology. Colour shows aquifer type; select a polygon for productivity and geology. This does not establish local groundwater availability.';
  if(name==='waterpoints')return 'WPdx · contributed records with incomplete and uneven geographic coverage. Blank areas do not establish an absence of water sources. Observations describe water presence on the assessment date, not present-day functionality or water quality. Djibouti has no country export in this release.';
  return '';
}
function waterpointSelection(){return ((DATA.waterpoints||emptyFc()).features||[]).filter(f=>environmentState.waterPresence==='all'||(f.properties||{}).water_present===environmentState.waterPresence);}
function waterpointCoverage(){
  const names={KE:'Kenya',ET:'Ethiopia',UG:'Uganda',SS:'South Sudan',SO:'Somalia',DJ:'Djibouti'},all={},chosen={};
  for(const f of (DATA.waterpoints||emptyFc()).features||[]){const key=f.properties.country||'Unknown';all[key]=(all[key]||0)+1;}
  for(const f of waterpointSelection()){const key=f.properties.country||'Unknown';chosen[key]=(chosen[key]||0)+1;}
  const rows=Object.keys(all).sort((a,b)=>(names[a]||a).localeCompare(names[b]||b)).map(key=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+esc(names[key]||key)+'</span><span>'+(chosen[key]||0).toLocaleString()+' / '+all[key].toLocaleString()+'</span></div>').join('');
  return '<div class="water-coverage" style="margin-top:14px;padding:12px 13px;background:#f7f1df;border:1px solid #dccd9f;border-radius:7px;font-size:13px;line-height:1.55"><strong>Incomplete geographic coverage</strong><p style="margin:5px 0 9px">Blank areas mean no displayed WPdx records, not an absence of water sources.</p>'+(rows?'<div style="margin-bottom:5px">Records by reported country<br><span style="color:#626d62">Matching filters / all in this cluster</span></div>'+rows:'<p>No WPdx records in this release for this cluster.</p>')+'</div>';
}
function environmentColour(p){return p.water_present==='Yes'?'#237c77':p.water_present==='No'?'#bf6540':'#87918e';}
function groundwaterLayer(){return L.geoJSON(DATA.groundwater||emptyFc(),{pane:'hexPane',style:f=>({color:'#fff',weight:.7,fillColor:aquiferInfo(f.properties.aquifer_code)[1],fillOpacity:.68}),onEachFeature:(f,l)=>{const p=f.properties||{},label=aquiferInfo(p.aquifer_code)[0];l.bindTooltip(esc(label),{sticky:true});l.bindPopup('<div class="feature-popup-title">'+esc(label)+'</div><div class="feature-popup-subtitle">BGS regional hydrogeology · 1:5 million</div><table class="feature-popup-table">'+row('Mapped productivity',productivityLabel(p.aquifer_code))+row('Source code',p.aquifer_code)+row('Geology',p.geology)+row('Country',p.country)+'</table><p>Regional classification; no local yield or water-quality measurement.</p>');}});}
function waterClusterIcon(c){
  const counts={Yes:0,No:0,Unknown:0};for(const marker of c.getAllChildMarkers())counts[marker.options.waterPresence||'Unknown']++;
  const total=c.getChildCount(),yes=100*counts.Yes/total,no=yes+100*counts.No/total;
  const background='conic-gradient(#237c77 0 '+yes+'%,#bf6540 '+yes+'% '+no+'%,#87918e '+no+'% 100%)';
  const label=total+' locations: '+counts.Yes+' water present, '+counts.No+' absent, '+counts.Unknown+' unknown';
  return L.divIcon({html:'<span title="'+label+'" aria-label="'+label+'" style="display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:'+background+';border:2px solid white;box-shadow:0 1px 5px #0005"><span style="display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:white;color:#193f35;font:700 11px Arial">'+total+'</span></span>',className:'waterpoint-cluster',iconSize:[38,38]});
}
function waterpointsLayer(){
  const group=L.markerClusterGroup({clusterPane:'clusterPane',maxClusterRadius:40,disableClusteringAtZoom:13,chunkedLoading:true,showCoverageOnHover:false,iconCreateFunction:waterClusterIcon});
  for(const f of waterpointSelection()){
    const p=f.properties||{},coordinates=f.geometry.coordinates;
    let link='';try{const url=new URL(p.source_url);if(['https:','http:'].includes(url.protocol))link='<p><a href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">Original source</a></p>';}catch(e){}
    const marker=L.circleMarker([coordinates[1],coordinates[0]],{pane:'pointPane',renderer:svgRenderer('pointPane'),waterPresence:p.water_present,radius:5,color:'#fff',weight:1,fillColor:environmentColour(p),fillOpacity:.95});
    marker.bindTooltip('<strong>'+esc(p.water_source)+'</strong><br>Assessed '+esc(p.report_date||'date unknown'),{direction:'top'});
    marker.bindPopup('<div class="feature-popup-title">'+esc(p.water_source)+'</div><div class="feature-popup-subtitle">'+esc(p.source)+'</div><table class="feature-popup-table">'+row('Assessment date',p.report_date||'Unknown')+row('Water present when assessed',p.water_present)+row('Technology',p.water_technology)+row('WPdx cleaned status',p.clean_status||'Unspecified')+row('Assessment records at this coordinate',p.assessment_records)+'</table>'+link+'<p>Latest dated record at this coordinate. Conditions may have changed.</p>');group.addLayer(marker);
  }return group;
}
defs.environment=()=>environmentState.display==='raster'?rasterLayer(selectedEnvironmentKey(currentPreset)):metricHexLayer(environmentMeta(currentPreset),'Native-pixel summary within this 5 km hex');
defs.groundwater=groundwaterLayer;
defs.waterpoints=waterpointsLayer;
function applyEnvironment(name){
  const panel=document.getElementById('environmentControls');panel.style.display=environmentViews.includes(name)?'block':'none';
  if(!environmentViews.includes(name))return;
  if(name==='groundwater'||name==='waterpoints')add(name);else add('environment');
  renderEnvironmentControls(name);
}
function renderEnvironmentControls(name){
  const box=document.getElementById('environmentControls');box.innerHTML='';
  function select(label,value,options,onChange){
    const title=document.createElement('div');title.className='environment-control-title';title.textContent=label;box.appendChild(title);
    const group=document.createElement('div');group.className='environment-choices';group.setAttribute('role','group');group.setAttribute('aria-label',label);
    for(const [key,text] of options){const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-pressed',String(key===value));button.addEventListener('click',()=>{onChange(key);normaliseEnvironmentChoice(name);setPreset(name,{keepContext:true});});group.appendChild(button);}box.appendChild(group);
  }
  if(['rainfall','surfaceWater','settlement'].includes(name)){
    select('Display',environmentState.display,[['hex','5 km hexagons'],['raster','Raster overview']],v=>environmentState.display=v);
    select('Indicator',environmentState[name],environmentChoices(name).map(k=>[k,environmentLabels[k]||DATA.environmentMetrics[k].label]),v=>environmentState[name]=v);
  }
  if(name==='waterpoints'){
    select('Water present when assessed',environmentState.waterPresence,[['all','All observations'],['Yes','Reported present'],['No','Reported absent'],['Unknown','Unknown']],v=>environmentState.waterPresence=v);
  }
  if(name==='waterpoints'){const coverage=document.createElement('div');coverage.innerHTML=waterpointCoverage();box.appendChild(coverage);}
  const about=document.createElement('details');about.className='environment-about';const summary=document.createElement('summary');summary.textContent='About this layer';about.appendChild(summary);const note=document.createElement('p');note.textContent=environmentNote(name);about.appendChild(note);box.appendChild(about);
}
function environmentLegend(name){
  if(name==='groundwater'){
    const keys=[...new Set(((DATA.groundwater||emptyFc()).features||[]).map(f=>String(f.properties.aquifer_code||'').split('-')[0]))].sort();
    const categories=[...new Map(keys.map(k=>{const info=aquiferInfo(k);return [info[0],info];})).values()];return categories.map(([label,colour])=>legendItem('<span class="swatch-dot" style="background:'+colour+'"></span>',esc(label))).join('')+(keys.length?'':'<p>No mapped aquifer polygons in this cluster.</p>');
  }
  if(name==='waterpoints'){
    const selection=waterpointSelection(),count=selection.length,dates=selection.map(f=>f.properties.report_date).filter(Boolean).sort();
    return ['Yes','No','Unknown'].map(k=>legendItem('<span class="swatch-dot" style="background:'+environmentColour({water_present:k})+'"></span>',k==='Yes'?'Water reported present':k==='No'?'Water reported absent':'Presence unknown')).join('')+'<p>'+count.toLocaleString()+' matching locations'+(dates.length?' · selected assessments: '+esc(dates[0])+' to '+esc(dates[dates.length-1]):(count?' · assessment dates unknown':''))+'</p><p>Cluster ring colours show the mix of reported water presence.</p>'+(count?'':'<p>No matching records. This does not mean that supplies are absent.</p>');
  }
  if(environmentViews.includes(name))return gradientLegend(environmentMeta(name))+(environmentState.display==='hex'?legendItem('<span class="swatch-dot" style="background:#e5e7eb"></span>','No valid source data'):'<p>Generalised raster overview. '+(name==='rainfall'?'Same period-specific scale in all views.': 'Transparent areas have no valid source observation; pale areas include zero or low values.')+'</p>');
  return '';
}

// The map menu represents subjects. Display geometry is chosen within each subject.
const environmentThemes={landCoverHex:'Land cover',rainfall:'Rainfall',surfaceWater:'Surface water',groundwater:'Groundwater',waterpoints:'Water points',climate:'River flood risk',heat:'Historical humid heat'};
let environmentTheme='landCoverHex';
const transportThemes={crossings:'Towns & transport',corridorBand:'Population near primary roads',connectivity:'Local road connectivity',infrastructure:'Energy & infrastructure'};
let transportTheme='crossings';
const themeState={population:'population',services:'points',acled:'points',access:'travel',builtup:'nightLights'};
const themeChoices={
 population:[['population','Population · 5 km hexagons'],['raster','Population surface'],['deprivation','Deprivation · raster'],['deprivationHex','Deprivation · hexagons']],
 services:[['points','Mapped service locations'],['serviceCount','Service counts · 5 km hexagons']],
 acled:[['points','Individual events'],['acledEvents5y','Event counts · 5 km hexagons'],['acledFatalities5y','Reported fatalities · 5 km hexagons'],['persistence','Recurring events · 5 km hexagons']],
 access:[['travel','Mean travel times'],['coverage','Population access to healthcare'],['ruralAccess','Rural road access']],
 builtup:[['nightLights','Night-time lights · 5 km hexagons'],['epochs','Settlement change · 2000–2020'],['builtUp','Built-up · 2018 · 5 km hexagons'],['raster','Built-up surface · 2018']]
};
function presetGroup(name){if(environmentThemes[name])return 'environment';if(transportThemes[name])return 'transport';if(name==='settlement')return 'builtup';return name;}
function resolvePreset(name){if(name==='environment')return environmentTheme;if(name==='transport')return 'crossings';if(name==='builtup'&&themeState.builtup==='epochs')return 'settlement';return name;}
function themeMetricKey(name){const key=themeState[presetGroup(name)];return ['population','serviceCount','acledEvents5y','acledFatalities5y','nightLights','builtUp'].includes(key)?key:null;}
function themeMetricMeta(name){const key=themeMetricKey(name);if(!key)return null;const meta=(DATA.hexMetrics||{})[key];if(!meta)return null;const labels={population:'Population density · people/km² · 2025',nightLights:'Mean night-time radiance · August 2026',builtUp:'Built-up land share · 2018'};return {...meta,label:labels[key]||meta.label};}
function analysisActive(){return (currentPreset==='access'&&themeState.access==='coverage')||(currentPreset==='acled'&&themeState.acled==='persistence');}
function thematicGroups(name){
 if(name==='access'&&themeState.access==='ruralAccess')return ['ruralAccess'];
 if(name==='population')return themeState.population==='deprivationHex'?['sedac','grdiHex']:themeState.population==='deprivation'?['sedac']:themeState.population==='raster'?['raster_population']:['hexes'];
 if(name==='services')return themeState.services==='points'?['services']:['hexes'];
 if(name==='acled')return themeState.acled==='points'?['acled']:['hexes'];
 if(name==='builtup')return themeState.builtup==='raster'?['raster_builtNight']:['hexes'];
 return null;
}
function selectThemeMode(name,key){
 themeState[name]=key;
 if(name==='access'&&key==='coverage'){currentAnalysis='healthcare';currentAnalysisMetric=(DATA.analysisGroups.healthcare||{}).defaultMetric;setupAnalysisControls();}
 if(name==='acled'&&key==='persistence'){currentAnalysis='persistentViolence';currentAnalysisMetric=(DATA.analysisGroups.persistentViolence||{}).defaultMetric;setupAnalysisControls();}
 return setPreset(name,{keepContext:true});
}
function renderThemeControls(name){
 const box=document.getElementById('themeControls'),group=presetGroup(name);box.innerHTML='';
 if(group==='environment'||group==='transport'){
  const isEnvironment=group==='environment';
  if(isEnvironment)environmentTheme=name;else transportTheme=name;
  const buttons=document.createElement('div');buttons.className='environment-choices '+(isEnvironment?'environment-theme-choices':'transport-theme-choices');buttons.setAttribute('role','group');buttons.setAttribute('aria-label',isEnvironment?'Environmental layer':'Infrastructure view');
  for(const [key,text] of Object.entries(isEnvironment?environmentThemes:transportThemes)){
   const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-pressed',String(key===name));if(DATA.unavailable?.[key]){button.disabled=true;button.dataset.unavailable='true';button.title=DATA.unavailable[key];button.textContent+=' · unavailable';}
   button.addEventListener('click',()=>{if(isEnvironment)environmentTheme=key;else transportTheme=key;return setPreset(key,{keepContext:true});});buttons.appendChild(button);
  }
  box.appendChild(buttons);
  corridors.controls(name,box);corridorBand.controls(name,box);sedac.controls(name,box);return;
 }
 if(!themeChoices[group]){corridors.controls(name,box);return;}
 const title=document.createElement('div');title.textContent='Show';title.className='environment-control-title';box.appendChild(title);
 const buttons=document.createElement('div');buttons.className='environment-choices theme-choices';buttons.setAttribute('role','group');buttons.setAttribute('aria-label','Show '+({builtup:'settlements and lights',acled:'recorded events',access:'accessibility'}[group]||group));
 for(const [key,text] of themeChoices[group]){
  const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-pressed',String(key===themeState[group]));if(DATA.unavailable?.[key]){button.disabled=true;button.title=DATA.unavailable[key];button.textContent+=' · unavailable';}
  button.addEventListener('click',()=>selectThemeMode(group,key));buttons.appendChild(button);
 }
 box.appendChild(buttons);
 if(group==='builtup'&&['builtUp','raster'].includes(themeState.builtup)){const note=document.createElement('p');note.className='theme-note';note.textContent='Satellite-derived built-up surface in 2018 · share of land covered by buildings.';box.appendChild(note);}
 sedac.controls(name,box);
 if(group==='access'&&themeState.access==='ruralAccess')renderRuralAccessControls(box);
 if(group==='acled'&&themeState.acled!=='points'){
  const note=document.createElement('p');note.className='theme-note';note.textContent='Hex summaries cover 1 January 2018–28 October 2025. Year and event-type filters apply to Individual events.';box.appendChild(note);
 }
}

function prepareTheme(name){
 const group=name==='access'&&themeState.access==='coverage'?'healthcare':name==='acled'&&themeState.acled==='persistence'?'persistentViolence':null;
 if(group&&currentAnalysis!==group){currentAnalysis=group;currentAnalysisMetric=(DATA.analysisGroups[group]||{}).defaultMetric;setupAnalysisControls();}
}

function sourceCoverageNote(name){
 if(!['acled','services','crossings','infrastructure'].includes(name))return '';
 let all=[],shown=[],field='source_country';
 let note='OpenStreetMap coverage and tagging are uneven. Missing mapped features do not establish an absence of roads or services.';
 if(name==='acled'){
  note='Recorded events within 1 January 2018–28 October 2025. Uneven reporting and location precision affect coverage; blank areas do not establish an absence of violence.';
  if(themeState.acled==='points'){all=(DATA.acled||emptyFc()).features||[];shown=filteredAcled();field='country';}
 }else if(name==='services'&&themeState.services==='points'){
  all=['schools','health','police','markets'].flatMap(k=>(DATA[k]||emptyFc()).features||[]);shown=all;
 }
 const total={},selected={};for(const f of all){const k=f.properties[field]||'Unspecified';total[k]=(total[k]||0)+1;}for(const f of shown){const k=f.properties[field]||'Unspecified';selected[k]=(selected[k]||0)+1;}
 const rows=Object.keys(total).sort().map(k=>'<div style="display:flex;justify-content:space-between;gap:12px"><span>'+esc(k)+'</span><span>'+(selected[k]||0).toLocaleString()+' / '+total[k].toLocaleString()+'</span></div>').join('');
 return '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #ccd6ce;font-size:12px;line-height:1.5"><strong>Coverage of published records</strong><p style="margin:5px 0 8px">'+note+'</p>'+(rows?'<details><summary>Country counts · selected / total</summary>'+rows+'</details>':'')+'</div>';
}

// One filtered record set drives the map, event list and totals.
const eventState={ready:false,query:'',country:'',fatalities:'all',from:'',to:'',cluster:null,selected:null,shown:60};
const eventMarkers=new Map();let eventSelectionLayer=null;
const eEl=id=>document.getElementById(id);
function eventDate(value){if(!value)return 'Date not reported';const d=new Date(String(value).slice(0,10)+'T12:00:00Z');return Number.isNaN(+d)?String(value):d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}
function eventMatches(feature){const p=feature.properties||{},date=String(p.event_date||'').slice(0,10),fatalities=Number(p.fatalities);return (!eventState.country||p.country===eventState.country)&&(!eventState.from||date>=eventState.from)&&(!eventState.to||date<=eventState.to)&&(eventState.fatalities==='all'||(p.fatalities!=null&&p.fatalities!==''&&(eventState.fatalities==='fatal'?fatalities>0:fatalities===0)))&&(!eventState.query||[p.location,p.country,p.adm1_name,p.adm2_name,p.adm3_name,p.actor1,p.actor2,p.notes,p.event_type,p.sub_event_type].join(' ').toLocaleLowerCase().includes(eventState.query));}
function eventSort(a,b){return String((b.properties||{}).event_date||'').localeCompare(String((a.properties||{}).event_date||''))||a._eventIndex-b._eventIndex;}
function setEventPanelVisible(visible){const activeView=requestedPreset==='acled'&&themeState.acled==='points';eEl('eventPanel').hidden=!activeView;eEl('eventPanel').classList.toggle('mobile-open',visible&&activeView&&window.innerWidth<=1024);eEl('eventPanel').style.display=visible&&activeView&&window.innerWidth>1024?'flex':'';if(!visible&&window.innerWidth>1024)eEl('eventPanel').hidden=true;document.body.classList.toggle('event-panel-open',visible&&activeView);eEl('eventDirectoryToggle').hidden=!activeView;syncDirectoryToggle(eEl('eventDirectoryToggle'),visible&&activeView,'event directory');if(visible&&activeView&&window.innerWidth<=1024){document.querySelector('.panel').classList.remove('mobile-open');eEl('projectPanel').classList.remove('mobile-open');}updateMobileNavigation();}
function setupEventPanel(){if(eventState.ready||!((DATA.acled||{}).features||[]).length)return;eventState.ready=true;
 const features=DATA.acled.features;features.forEach((f,i)=>f._eventIndex=i);
 for(const country of [...new Set(features.map(f=>(f.properties||{}).country).filter(Boolean))].sort()){const option=document.createElement('option');option.value=country;option.textContent=country;eEl('eventCountry').appendChild(option);}
 const dates=features.map(f=>String((f.properties||{}).event_date||'').slice(0,10)).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();for(const id of ['eventFrom','eventTo']){eEl(id).min=dates[0]||'';eEl(id).max=dates.at(-1)||'';}
 eEl('eventPeriod').textContent=DATA.acledYearRange||'1 January 2018–28 October 2025';eEl('eventFilters').disabled=false;
 let searchTimer; eEl('eventSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{eventState.query=eEl('eventSearch').value.trim().toLocaleLowerCase();updateEventResults();},160);});
 for(const [id,key] of [['eventCountry','country'],['eventFatalities','fatalities'],['eventFrom','from'],['eventTo','to']])eEl(id).addEventListener('change',()=>{eventState[key]=eEl(id).value;updateEventResults();});
 eEl('eventReset').onclick=()=>{clearTimeout(searchTimer);Object.assign(eventState,{query:'',country:'',fatalities:'all',from:'',to:''});for(const id of ['eventSearch','eventCountry','eventFrom','eventTo'])eEl(id).value='';eEl('eventFatalities').value='all';currentAcledYears.clear();features.forEach(f=>currentAcledYears.add(String((f.properties||{}).year||'')));currentAcledTypes.clear();features.forEach(f=>currentAcledTypes.add(String((f.properties||{}).event_type||'Other')));document.querySelectorAll('#acledFilters .filter-pill').forEach(b=>{b.classList.add('active');b.setAttribute('aria-pressed','true');});updateEventResults();};
 eEl('eventAll').onclick=()=>{eventState.cluster=null;eventState.shown=60;closeEventDetail();renderEventResults();};
 eEl('eventPanelClose').onclick=()=>setEventPanelVisible(false);eEl('eventDirectoryToggle').onclick=()=>setEventPanelVisible(!document.body.classList.contains('event-panel-open'));
 L.DomEvent.disableClickPropagation(eEl('eventPanel'));L.DomEvent.disableScrollPropagation(eEl('eventPanel'));
}
function closeEventDetail(){if(eventSelectionLayer){map.removeLayer(eventSelectionLayer);eventSelectionLayer=null;}eEl('eventPanel').classList.remove('event-detail-open');document.body.classList.remove('event-detail-reading');if(eventState.selected){const old=eventMarkers.get(eventState.selected);if(old)old.setStyle({color:'#fff',weight:2});}eventState.selected=null;eEl('eventDetail').hidden=true;eEl('eventListView').hidden=false;}
function updateEventResults(){eventState.cluster=null;eventState.shown=60;closeEventDetail();if(currentPreset==='acled'&&themeState.acled==='points'&&viewReady&&requestedPreset==='acled'){remove('acled');add('acled');refreshLegend('acled');}renderEventResults();}
function renderEventResults(){if(!eventState.ready)return;const all=filteredAcled(),features=eventState.cluster?all.filter(f=>eventState.cluster.has(f)):all;const deaths=all.reduce((sum,f)=>sum+(Number((f.properties||{}).fatalities)||0),0),total=DATA.acled.features.length;
 eEl('eventCount').innerHTML='<strong>'+all.length.toLocaleString()+'</strong> of '+total.toLocaleString()+' events<br>'+deaths.toLocaleString()+' reported fatalities';
 const years=new Set(DATA.acled.features.map(f=>String((f.properties||{}).year||''))),types=new Set(DATA.acled.features.map(f=>String((f.properties||{}).event_type||'Other')));eEl('eventFilterBadge').textContent=eventState.from||eventState.to||currentAcledYears.size!==years.size||currentAcledTypes.size!==types.size?'· filtered':'';
 eEl('eventListHeading').textContent=eventState.cluster?features.length.toLocaleString()+' events in selected cluster':'Events · newest first';eEl('eventAll').hidden=!eventState.cluster;eEl('eventListHint').textContent=eventState.cluster?'Select an event below or on the expanded map cluster.':'Select a cluster or an event on the map.';
 const list=eEl('eventList');list.replaceChildren();for(const feature of [...features].sort(eventSort).slice(0,eventState.shown)){const p=feature.properties||{},button=document.createElement('button');button.type='button';button.className='event-row';button.innerHTML='<span class="event-row-top"><time>'+esc(eventDate(p.event_date))+'</time><span>'+esc(p.fatalities==null?'Not reported':p.fatalities+' fatalities')+'</span></span><span class="event-row-place">'+esc(p.location||'Location not reported')+'</span><span class="event-row-type"><i class="event-type-dot" style="background:'+acledColour(p.event_type)+'"></i>'+esc(p.event_type||'Unclassified event')+'</span><span class="event-row-country">'+esc([p.adm2_name,p.country].filter(Boolean).join(' · '))+'</span>';button.addEventListener('click',()=>showEvent(feature,true));list.appendChild(button);}
 if(features.length>eventState.shown){const more=document.createElement('button');more.type='button';more.id='eventMore';more.textContent='Show next 60 events';more.onclick=()=>{eventState.shown+=60;renderEventResults();};list.appendChild(more);}
 if(!features.length){const p=document.createElement('p');p.className='event-empty';p.textContent=eventState.from&&eventState.to&&eventState.from>eventState.to?'The start date is after the end date. Adjust the date range.':'No events match these filters. Change the filters or select Reset.';list.appendChild(p);}
}
function showEventCluster(cluster){eventState.cluster=new Set(cluster.getAllChildMarkers().map(m=>m.options.eventFeature).filter(Boolean));eventState.shown=60;closeEventDetail();renderEventResults();setEventPanelVisible(true);eEl('eventPanel').querySelector('.event-content').scrollTop=0;}
function locateEvent(feature){
  const marker=eventMarkers.get(feature);if(!marker)return;
  // Many records share approximate coordinates. Do not force their cluster
  // apart by zooming to street level, where imagery may be unavailable.
  const point=marker.getLatLng();map.stop();
  map.setView(point,Math.min(12,Math.max(10,map.getZoom())),{animate:false});
  const left=window.innerWidth>1024?eEl('eventPanel').getBoundingClientRect().right+24:25;
  const right=window.innerWidth>1024?window.innerWidth-document.querySelector('.panel').getBoundingClientRect().left+24:25;
  map.panInside(point,{paddingTopLeft:[left,40],paddingBottomRight:[right,window.innerWidth>1024?40:85],animate:false});
  if(eventSelectionLayer)map.removeLayer(eventSelectionLayer);
  eventSelectionLayer=L.circleMarker(point,{pane:'clusterPane',renderer:svgRenderer('clusterPane'),radius:25,color:'#fff',weight:3,fill:false,interactive:false}).addTo(map);
}
function showEvent(feature,locate){closeEventDetail();eventState.selected=feature;const p=feature.properties||{};setEventPanelVisible(true);eEl('eventListView').hidden=true;const detail=eEl('eventDetail');detail.hidden=false;eEl('eventPanel').classList.add('event-detail-open');document.body.classList.add('event-detail-reading');detail.innerHTML='<div class="event-detail-actions"><button type="button" id="eventBack">← Events</button><button type="button" id="eventLocate">Locate on map</button></div><p class="event-detail-kicker">'+esc(eventDate(p.event_date))+'</p><h3 class="event-detail-type">'+esc(p.event_type||'Event')+'</h3><p class="event-detail-subtype">'+esc(p.sub_event_type||'')+'</p><p class="event-detail-place">'+esc(p.location||'Location not reported')+'</p><p class="event-detail-area">'+esc([...new Set([p.adm3_name,p.adm2_name,p.adm1_name,p.country].filter(Boolean))].join(' · '))+'</p><div class="event-detail-fatalities"><strong>'+esc(p.fatalities==null?'Not reported':p.fatalities)+'</strong> reported fatalities</div>'+[['Main actor',p.actor1],['Other actor',p.actor2]].filter(([,v])=>v).map(([label,value])=>'<p class="event-detail-label">'+label+'</p><p class="event-detail-value">'+esc(value)+'</p>').join('')+'<p class="event-detail-label">Event account</p><p class="event-detail-notes">'+esc(p.notes||'No narrative was included in this export.')+'</p><p class="event-detail-source">'+esc(p.data_source||'Armed Conflict Location & Event Data (ACLED)')+'<br>Locations follow the published record and may be approximate. A recorded zero does not establish that nobody died.</p>';
 eEl('eventBack').onclick=()=>{closeEventDetail();};eEl('eventLocate').onclick=()=>{if(window.innerWidth<=1024)setEventPanelVisible(false);locateEvent(feature);};eEl('eventPanel').querySelector('.event-content').scrollTop=0;const marker=eventMarkers.get(feature);if(marker){marker.setStyle({color:'#142e43',weight:4});marker.bringToFront();}if(locate)locateEvent(feature);
}
function bindEventMarker(marker,feature){marker.options.eventFeature=feature;eventMarkers.set(feature,marker);const p=feature.properties||{};marker.bindTooltip(esc(p.location||'Event')+' · '+esc(eventDate(p.event_date)),{direction:'top',opacity:1});marker.on('click',()=>showEvent(feature,false));marker.on('add',()=>{const path=marker.getElement();if(!path)return;path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label','Event: '+(p.location||'Unknown location')+', '+eventDate(p.event_date)+', '+(p.event_type||'Event'));path.classList.add('event-marker');path.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showEvent(feature,false);}};});}

const lazyPromises=new Map();let presetSerial=0,requestedPreset='clean',viewReady=false;
const PRESET_GROUPS={corridorBand:['corridorBand'],clean:[],projects:[],connectivity:['hexes','connectivity'],dataHex:['hexes'],landCoverHex:['hexes'],acled:['acled'],services:['services'],admin:['admin'],population:['raster_population'],towns:['towns'],builtup:['raster_builtNight'],crossings:['roads','crossings','towns','sedac'],heat:['sedac'],infrastructure:['infrastructure','towns'],access:['hexes'],climate:['hexes'],analysis:['hexes']};
const CONTEXT_GROUPS={majorCorridors:['roads'],feederRoads:['roads'],crossings:['crossings'],towns:['towns'],markets:['services'],healthFacilities:['services'],infrastructure:['infrastructure'],adminReference:['admin']};
function closeMapOverlays(){
  map.closePopup();
  const tooltips=[];
  map.eachLayer(layer=>{if(layer instanceof L.Tooltip)tooltips.push(layer);});
  tooltips.forEach(tooltip=>map.closeTooltip(tooltip));
}
async function ensureGroup(group){
  if(await corridorBand.load(group))return;
  if(await sedac.load(group))return;
  if(await corridors.load(group))return;
  if(lazyPromises.has(group))return lazyPromises.get(group);
  const promise=(async()=>{
    if(group.startsWith('raster_')){const key=group.slice(7);if((DATA.rasters||{})[key]&&DATA.rasters[key]._asset)DATA.rasters[key].url=await parent.WBVault.blob(DATA.rasters[key]._asset);return;}

    if(group==='ruralAccess'){
      const document=await parent.WBVault.json(DATA.code+'/ruralAccess');
      if(document.format!=='wb-rural-access-v1'||document.code!==DATA.code||document.ruralAccessUnits?.type!=='FeatureCollection'||!Array.isArray(document.ruralAccessUnits.features))throw new Error('Invalid rural-access source data');
      const ids=new Set();for(const feature of document.ruralAccessUnits.features){const p=feature.properties||{},id=ruralAccessId(p);if(ids.has(id)||p.__wb_source_fid==null)throw new Error('Invalid rural-access source record identity');ids.add(id);if(p.rai_pct!=null&&ruralAccessValue(p)==null)throw new Error('Invalid rural-access percentage');}
      DATA.ruralAccessUnits=document.ruralAccessUnits;ruralAccessState.sourceMetadata=document.source_metadata||{};return;
    }
    const asset=(DATA.lazyGroups||{})[group];if(!asset)return;
    Object.assign(DATA,await parent.WBVault.json(asset));
    if(group==='acled'){setupAcledFilters();setupEventPanel();}
  })();lazyPromises.set(group,promise);
  promise.catch(()=>{if(lazyPromises.get(group)===promise)lazyPromises.delete(group);});return promise;
}
async function setPreset(name,options={}){
  name=resolvePreset(name);if(DATA.unavailable?.[name]){const b=document.getElementById("viewLoading");b.textContent=DATA.unavailable[name];b.style.display="block";setTimeout(()=>b.style.display="none",5000);return;}prepareTheme(name);
  const ticket=++presetSerial,box=document.getElementById('viewLoading');
  if(typeof normaliseEnvironmentChoice==='function')normaliseEnvironmentChoice(name);
  requestedPreset=name;viewReady=false;
  box.style.display='none';
  const loadingTimer=setTimeout(()=>{if(ticket===presetSerial){box.textContent='Loading view…';box.style.display='block';}},180);
  document.getElementById('contextMenu').inert=true;
  try{
    const groups=new Set([...(thematicGroups(name)||PRESET_GROUPS[name]||[]),...(typeof environmentGroups==='function'?environmentGroups(name):[])]);
    if(options.keepContext)for(const c of currentContext)for(const g of CONTEXT_GROUPS[c]||[])groups.add(g);
    if(name==='crossings'&&map.getZoom()>=10)groups.add('minorRoads');
    await Promise.all([...groups].map(ensureGroup).concat(name==='projects'?[ensureProjects()]:[]));
    if(ticket!==presetSerial)return;
    // Keep the old view intact during loading, then replace layers and controls together.
    clearRuralAccessSelection();corridors.prepare(name);sedac.prepare();
    if(!options.keepContext){
      currentContext.clear();
      document.querySelectorAll('#contextMenu input[type="checkbox"]').forEach(input=>input.checked=false);
    }
    map.stop();closeMapOverlays();hideProjectLayer();closeProjectDetails();closeEventDetail();
    setProjectPanelVisible(name==='projects');
    setEventPanelVisible(name==='acled'&&themeState.acled==='points');
    pEl('projectOverlay').checked=name==='projects'&&(options.keepContext?pEl('projectOverlay').checked:true);
    viewReady=true;applyPresetNow(name);
    if(name==='acled'&&themeState.acled==='points')renderEventResults();
    if(name==='projects')renderProjectMap();
    corridors.ready(name);box.style.display='none';
  }catch(e){if(ticket===presetSerial){viewReady=false;box.textContent='This view could not be loaded. Click the view again to retry.';box.style.display='block';console.error('View failed:',name,e);}}
  finally{clearTimeout(loadingTimer);if(ticket===presetSerial)document.getElementById('contextMenu').inert=false;}
}

async function syncRoadDetail(){
  if(!viewReady||requestedPreset!=='crossings'||currentPreset!=='crossings')return;
  if(map.getZoom()<10){remove('tracks');remove('paths');refreshLegend(currentPreset);return;}
  const ticket=presetSerial;
  try{
    await ensureGroup('minorRoads');
    if(ticket!==presetSerial||!viewReady||requestedPreset!=='crossings'||currentPreset!=='crossings'||map.getZoom()<10)return;
    add('tracks');add('paths');refreshLegend(currentPreset);
  }catch(e){if(ticket!==presetSerial||requestedPreset!=='crossings')return;const box=document.getElementById('viewLoading');box.textContent='Local roads could not load. Select Towns & infrastructure to retry.';box.style.display='block';}
}
const corridorBand=window.createWBCorridorBand({map,DATA,svgRenderer,refreshLegend});
const corridors=window.createWBCorridors({DATA,map,svgRenderer,setPreset,currentView:()=>viewReady?currentPreset:null,openProject:async link=>{
  await ensureProjects();
  if(link.scope==='context'){pEl('projectScope').value='all';await filterProjects();}
  const match=projectFamilies.find(p=>p.project_id===link.family_id||p.records.some(r=>r.project_id===link.directory_id));
  if(match)showProject(match.project_id,false);
}});
const sedac=window.createWBSEDAC({DATA,map,svgRenderer,setPreset,currentView:()=>viewReady?currentPreset:null,populationMode:()=>themeState.population,showSidebar:()=>{if(window.innerWidth<=1024&&!document.querySelector('.panel').classList.contains('mobile-open'))document.getElementById('mobileLayers').click();}});
map.on('zoomend',syncRoadDetail);

if(![DATA.schools,DATA.health,DATA.police,DATA.markets].some(has)){const b=document.querySelector('[data-preset="services"]');if(b)b.disabled=true}
if(!has(DATA.acled)){const b=document.querySelector('[data-preset="acled"]');if(b)b.disabled=true}
if(![DATA.towns,DATA.primaryRoads,DATA.secondaryRoads,DATA.tertiaryRoads,DATA.tracks,DATA.paths,DATA.railways,DATA.primaryCrossings,DATA.secondaryCrossings,DATA.tertiaryCrossings,DATA.otherCrossings,DATA.powerTransmission,DATA.powerStations,DATA.pipelines,DATA.airports,DATA.ports,DATA.unhcrFieldSites].some(has)){const b=document.querySelector('[data-preset="transport"]');if(b)b.disabled=true}
if(!((DATA.rasters||{}).population||{}).url){const b=document.querySelector('[data-preset="population"]');if(b)b.disabled=true}
if(!((DATA.rasters||{}).builtNight||{}).url){const b=document.querySelector('[data-preset="builtup"]');if(b)b.disabled=true}
// Rural-access assets are available even if travel-time hex metrics are absent.
if(!Object.keys(DATA.accessHexMetrics||{}).length&&!['moyale_borana','mandera_triangle','karamoja','dikhil'].includes(DATA.code)){const b=document.querySelector('[data-preset="access"]');if(b)b.disabled=true}
if(!Object.keys(DATA.climateHexMetrics||{}).length){const b=document.querySelector('[data-preset="climate"]');if(b)b.disabled=true}
if(!Object.keys(DATA.landCoverMetrics||{}).length){const b=document.querySelector('[data-preset="landCoverHex"]');if(b)b.disabled=true}
if(!Object.keys(DATA.analysisGroups||{}).length){const b=document.querySelector('[data-preset="analysis"]');if(b)b.disabled=true}
map.on("zoomend",syncAdmin3Labels);
setupAcledFilters();
setupChoiceControls();
setupAnalysisControls();
setupContextControls();
const fitPadding=window.innerWidth>1024?{paddingTopLeft:[20,28],paddingBottomRight:[360,28]}:{paddingTopLeft:[20,20],paddingBottomRight:[20,65]};
map.fitBounds(DATA.bounds,fitPadding);
addOutsideMask();
setupProjectNavigation();
corridors.setup();
document.querySelectorAll(".panel,#projectPanel").forEach(e=>e.inert=false);
base();
const startView=new URLSearchParams(parent.location.search).get('view')||(isCorridor?'crossings':'clean');for(const [key,reason] of Object.entries(DATA.unavailable||{})){const b=document.querySelector('[data-preset="'+key+'"]');if(b){b.disabled=true;b.dataset.unavailable='true';b.title=reason;b.textContent+=' · unavailable';}}
if(startView==='ruralAccess')themeState.access='ruralAccess';
if(['deprivation','deprivationHex'].includes(startView))themeState.population=startView;
if(startView==='urban')sedac.state.townSource='ucdb';
if(startView==='heat'){const t=new URLSearchParams(parent.location.search).get('heatThreshold');if(['28','30','32'].includes(t))sedac.state.threshold=t;}
await setPreset(startView==='ruralAccess'?'access':['deprivation','deprivationHex'].includes(startView)?'population':startView==='urban'?'crossings':['projects','crossings','corridorBand','connectivity','population','services','acled','landCoverHex','builtup','admin','climate','access','surfaceWater'].includes(startView)?startView:'clean');
window.setupWBMapExport({map,DATA,isReady:()=>viewReady});
if(startView==='urban'){const id=new URLSearchParams(parent.location.search).get('settlement');if(id)sedac.selectTown(id,true);}
if(startView==='ruralAccess'){const unit=new URLSearchParams(parent.location.search).get('unit');if(unit&&ruralAccessFeatures().some(f=>ruralAccessId(f.properties)===unit)){selectRuralAccessUnit(unit);locateRuralAccessUnit();}}

}catch(error){const b=document.getElementById("viewLoading");if(b){b.textContent="The map could not finish loading. Reopen it from All maps to retry.";b.style.display="block";}console.error(error);}})();
