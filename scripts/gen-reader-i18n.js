/* Saca de www/index.html los textos que el módulo del lector le pide a la app.
   Se usa para generar (y comprobar en las pruebas) la tabla de textos de www/reader.html. */
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function needed(){
  const lx=fs.readFileSync(path.join(ROOT,'reader/lector.js'),'utf8');
  const xs=lx.slice(lx.indexOf('const X = {'),lx.indexOf('const isEn ='));
  const own=new Set();
  for(const m of xs.matchAll(/(?:^|[,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/gm))own.add(m[1]);
  /* textos que la propia pagina del lector usa, ademas de los que pide el modulo */
  const need=new Set(['fileRelinked']);
  for(const m of lx.matchAll(/\b[tT]\('([A-Za-z0-9_]+)'/g))if(!own.has(m[1]))need.add(m[1]);
  return [...need].sort();
}
function i18n(){
  const h=fs.readFileSync(path.join(ROOT,'www/index.html'),'utf8');
  const a=h.indexOf('const pl=(n,a,b)'),b=h.indexOf('function t(k,...a)');
  const src=h.slice(a,b);
  return new Function(src+';return I18N;')();
}
function table(){
  const I=i18n(),need=needed(),out={es:[],en:[]},falta=[];
  for(const k of need){
    /* claves que el modulo arma sobre la marcha (t('c_'+color)) y resuelve con sus propios textos */
    if(I.es[k]===undefined&&I.en[k]===undefined)continue;
    if(I.es[k]===undefined||I.en[k]===undefined){falta.push(k);continue}
    for(const l of ['es','en']){
      const v=I[l][k];
      out[l].push('  '+k+':'+(typeof v==='function'?v.toString():JSON.stringify(v)));
    }
  }
  return {falta,need,js:'const I18N={\n es:{\n'+out.es.join(',\n')+'\n },\n en:{\n'+out.en.join(',\n')+'\n }\n};'};
}
module.exports={needed,i18n,table};
if(require.main===module){const r=table();
  if(r.falta.length)console.error('OJO, sin traducir en la app: '+r.falta.join(', '));
  console.log(r.js)}

/* node scripts/gen-reader-i18n.js --write : vuelve a escribir la tabla de textos dentro de www/reader.html
   (hacerlo cuando reader/lector.js empiece a pedir textos nuevos de la app) */
if(require.main===module&&process.argv.includes('--write')){
  const rp=path.join(ROOT,'www/reader.html');
  let h=fs.readFileSync(rp,'utf8');
  const a=h.indexOf('const I18N={'),b=h.indexOf('\n\nlet CFG=');
  if(a<0||b<0)throw new Error('no encuentro la tabla de textos en reader.html');
  h=h.slice(0,a)+table().js+h.slice(b);
  fs.writeFileSync(rp,h);console.error('reader.html actualizado');
}
