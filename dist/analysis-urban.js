'use strict';
(async()=>{
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=(v,d=0)=>Number.isFinite(v)?v.toLocaleString('en-GB',{maximumFractionDigits:d}):'—';
 try{
  const data=await parent.WBVault.json('tk_borderlands/urbanCentres');
  if(data.format!=='undp-urban-centres-v1')throw Error('Unexpected urban-centre data');
  function render(){
   const country=$('urbanCountry').value,rows=data.records.filter(r=>!country||r.country===country),max=Math.max(1,...rows.map(r=>r.population_2025));
   $('urbanCount').textContent=rows.length+' urban centres · whole source footprints';
   $('urbanChart').innerHTML=rows.map(r=>'<div class="built-row"><div class="area-label"><a target="_top" href="?view=urban&amp;settlement='+encodeURIComponent(r.id)+'#map=borderland">'+esc(r.name)+' ↗</a><small>'+esc(r.country)+' · '+number(r.source_area_km2,1)+' km² source footprint</small></div><div class="number-bar"><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:'+(100*r.population_2025/max)+'%;background:#397e6e"></div></div><span class="bar-value">'+number(r.population_2025)+'</span></div><div class="change-value">'+number(r.footprint_in_study_pct,1)+'%<small>of footprint area</small></div></div>').join('')||'<p class="empty">No selected urban centres in this country.</p>';
   const fields=['id','name','country','population_2025','source_area_km2','footprint_in_study_pct','longitude','latitude','reference_year','source','selection','population_basis'];
   window.WBAnalysisExport.register('urban-settlements',()=>window.WBAnalysisExport.saveCSV('urban-settlements',fields,rows.map(r=>fields.map(k=>r[k])),'ucdb-urban-centres-2025-'+(country||'all')+'.csv'));
  }
  $('urbanCountry').addEventListener('change',render);render();
 }catch(error){$('urbanCount').textContent='Urban centres could not load. Reopen Analysis to retry.';console.error(error);}
})();
