(async()=>{
 try {
  const d=await parent.WBVault.json('tk_borderlands/grdiHex'),s=d.summary;
  const n=(v,k=1)=>Number(v).toLocaleString('en-GB',{maximumFractionDigits:k});
  const body=document.getElementById('deprivationAnalysisBody');
  const summary=document.createElement('dl');summary.className='deprivation-summary';
  for(const [label,value] of [
   ['Area-weighted mean index',n(s.area_mean)],
   ['Study area with source values',n(100*s.mapped_area_share)+'%'],
   ['Hexes with source values',n(s.with_data,0)+' / '+n(s.hexes,0)]
  ]){
   const stat=document.createElement('div');stat.className='deprivation-stat';
   const term=document.createElement('dt');term.textContent=label;
   const figure=document.createElement('dd');figure.textContent=value;
   stat.append(term,figure);summary.appendChild(stat);
  }
  const note=document.createElement('p');note.className='scope-note';
  note.textContent='0–100 relative composite index. Higher values indicate greater deprivation. Hex averages cover mapped parts only.';
  body.replaceChildren(summary,note);
  window.WBAnalysisExport.register('deprivation',()=>window.WBAnalysisExport.saveCSV(
   'deprivation',['cell_id','mean_index','source_coverage_pct','mapped_km2','hex_km2','source'],
   d.features.map(f=>{const p=f.properties;return[p.cell_id,p.mean,p.coverage_pct,p.mapped_km2,p.hex_km2,'GRDI v1.10 · 2025 release'];}),
   'undp-relative-deprivation-hexes.csv'
  ));
 }catch(e){
  document.getElementById('deprivationAnalysisBody').textContent='Relative deprivation could not load. Reopen Analysis to retry.';
  console.error(e);
 }
})();
