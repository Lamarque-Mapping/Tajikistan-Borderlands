'use strict';
(async()=>{
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=(v,k=1)=>Number.isFinite(v)?v.toLocaleString('en-GB',{minimumFractionDigits:k,maximumFractionDigits:k}):'—';
 try{
  const data=await parent.WBVault.json('analysis/deprivation');
  if(data.format!=='undp-grdi-analysis-v1')throw Error('Unexpected deprivation data');
  function render(){
   const scope=window.UNDPAnalysisScope||{level:'district',country:'Tajikistan'};
   const level=scope.level,country=level==='cluster'?'':scope.country;
   const rows=data.units.filter(u=>u.level===level&&(!country||u.country===country)).sort((a,b)=>$('deprivationSort').value==='name'?a.label.localeCompare(b.label):(b.mean??-1)-(a.mean??-1));
   const aggregate=data.units.find(u=>u.key===(country?'country:'+country:'cluster:tk_borderlands'));
   const title=country?country+' · study portion':'Whole study area';
   $('deprivationScope').textContent=title;
   const valid=rows.filter(r=>Number.isFinite(r.mean));
   const stats=[['Area-weighted mean index',n(aggregate?.mean)],['Estimated source coverage',n(aggregate?.coverage_pct)+'%'],['Areas with an estimate',valid.length+' / '+rows.length]];
   $('deprivationSummary').innerHTML=stats.map(([label,value])=>'<div class="deprivation-stat"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('');
   $('deprivationCount').textContent=rows.length+' '+(level==='district'?'district portions':level==='country'?'country portions':'study area')+' · same 0–100 scale';
   $('deprivationChart').innerHTML=rows.map(r=>{
    const has=Number.isFinite(r.mean),colour=!has?'#b5bec8':r.mean<=20?'#c4b5fd':r.mean<=40?'#a78bfa':r.mean<=60?'#8b6bc5':r.mean<=80?'#7044aa':'#4c1d95';
    return '<div class="deprivation-row" data-unit="'+esc(r.key)+'"><div class="area-label">'+esc(r.label)+'<small>'+esc(r.country||'Whole study area')+(r.area_km2<25?' · small study portion':'')+'</small></div><div class="deprivation-metric" aria-label="'+esc(r.label+': '+(has?n(r.mean)+' mean relative deprivation index':'no estimate'))+'"><div class="deprivation-track" aria-hidden="true">'+(has?'<i style="width:'+Math.max(0,Math.min(100,r.mean))+'%;background:'+colour+'"></i>':'')+'</div><strong>'+n(r.mean)+'</strong></div><div class="deprivation-coverage">'+n(r.coverage_pct)+'%</div></div>';
   }).join('')||'<p class="empty">No areas are available for this selection.</p>';
   const fields=['area_id','area','country','geography_level','mean_index','source_coverage_pct','mapped_area_km2','area_km2','hexes_with_data','source','method'];
   window.WBAnalysisExport.register('deprivation',()=>window.WBAnalysisExport.saveCSV('deprivation',fields,rows.map(r=>[r.key,r.label,r.country,r.level,r.mean,r.coverage_pct,r.mapped_km2,r.area_km2,r.hexes_with_data,data.source,data.method]),'undp-relative-deprivation-'+level+'-'+(country||'all').replace(/\s+/g,'-')+'.csv'));
  }
  $('deprivationSort').addEventListener('change',render);
  document.addEventListener('undp:analysis-scope',render);
  render();
 }catch(error){$('deprivationChart').textContent='Relative deprivation could not load. Reopen Analysis to retry.';console.error(error);}
})();
