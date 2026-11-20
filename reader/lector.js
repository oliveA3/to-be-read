/* ------------------------------------------------------------------
   Lector integrado de "To be read" — módulo opcional.
   No se carga nunca al arrancar la app: solo cuando se abre un libro
   con el lector activado. Se apoya en el puente window.TBR que expone
   la app base (JSZip por trozos, acceso al archivo, textos, ajustes).
   ------------------------------------------------------------------ */
(() => {
'use strict';
const API = window.TBR;
if (!API) { console.warn('[lector] falta el puente TBR'); return; }
const { FS, lib, book, save, t, esc, norm, toast, CFG } = API;

const $ = (s, r) => (r || document).querySelector(s);
const SVG = (d, w) => `<svg width="${w || 21}" height="${w || 21}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  back: SVG('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  toc:  SVG('<path d="M4 6h16M4 12h16M4 18h12"/>'),
  find: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  aa:   SVG('<path d="M4 19l5.5-14L15 19M6 14h7M17 19l2.5-7 2.5 7M18 17h4"/>'),
  bm:   SVG('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
  more: SVG('<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>'),
  play: SVG('<path d="M7 4l13 8-13 8z"/>', 20),
  pause: SVG('<path d="M8 4v16M16 4v16"/>', 20),
  stop: SVG('<rect x="5" y="5" width="14" height="14" rx="2"/>', 20),
  x:    SVG('<path d="M6 6l12 12M18 6L6 18"/>', 18),
};

/* ---------- textos propios del módulo (con respaldo en los de la app) ---------- */
const X = {
  es: {
    lxAnimCurl: 'Pasar hoja', lxMode: 'Modo de lectura', lxModePage: 'Páginas', lxModeScroll: 'Desplazar',
    tabCh: 'Capítulos', tabMarks: 'Marcadores', tabNotes: 'Subrayados',
    noMarks: 'Aún no hay marcadores. Toca el marcador de arriba para guardar esta página.',
    noNotes: 'Aún no hay subrayados. Mantén pulsado un texto para subrayarlo o ponerle una nota.',
    bmAdd: 'Marcador guardado', bmDel: 'Marcador quitado', bm: 'Marcador',
    more: 'Más', listen: 'Escuchar en voz alta', stopListen: 'Detener la lectura',
    noTts: 'Este teléfono no tiene voz para leer en voz alta',
    addVer: 'Añadir otra versión (bilingüe)', delVer: 'Quitar la segunda versión',
    verPrep: 'Preparando las dos versiones…', verAdded: 'Versión añadida. Toca ES/EN para cambiar',
    verBad: 'No pude leer ese epub', verDel: 'Segunda versión quitada', verAsk: 'Elige el mismo libro en otro idioma',
    note: 'Nota', notePh: 'Escribe una nota…', save: 'Guardar', del: 'Eliminar', edit: 'Editar',
    dict: 'Diccionario', copy: 'Copiar', copied: 'Copiado', hlDel: 'Quitar',
    c_y: 'Amarillo', c_g: 'Verde', c_b: 'Azul', c_p: 'Rosa',
    relink: 'Elegir el archivo otra vez', finished: 'Llegaste al final del libro', markRead: 'Marcar como leído', notNow: 'Ahora no', markedRead: 'Marcado como leído', prevCh: 'Capítulo anterior', nextCh: 'Capítulo siguiente', speed: 'Velocidad', speaking: 'Leyendo en voz alta',
    ver: n => n === 0 ? 'Versión 1' : 'Versión 2',
  },
  en: {
    lxAnimCurl: 'Page curl', lxMode: 'Reading mode', lxModePage: 'Pages', lxModeScroll: 'Scroll',
    tabCh: 'Chapters', tabMarks: 'Bookmarks', tabNotes: 'Highlights',
    noMarks: 'No bookmarks yet. Tap the bookmark above to save this page.',
    noNotes: 'No highlights yet. Long-press some text to highlight it or add a note.',
    bmAdd: 'Bookmark saved', bmDel: 'Bookmark removed', bm: 'Bookmark',
    more: 'More', listen: 'Read aloud', stopListen: 'Stop reading',
    noTts: 'This phone has no voice to read aloud',
    addVer: 'Add another version (bilingual)', delVer: 'Remove the second version',
    verPrep: 'Preparing both versions…', verAdded: 'Version added. Tap ES/EN to switch',
    verBad: 'Couldn’t read that epub', verDel: 'Second version removed', verAsk: 'Pick the same book in another language',
    note: 'Note', notePh: 'Write a note…', save: 'Save', del: 'Delete', edit: 'Edit',
    dict: 'Dictionary', copy: 'Copy', copied: 'Copied', hlDel: 'Remove',
    c_y: 'Yellow', c_g: 'Green', c_b: 'Blue', c_p: 'Pink',
    relink: 'Pick the file again', finished: 'You reached the end of the book', markRead: 'Mark as read', notNow: 'Not now', markedRead: 'Marked as read', prevCh: 'Previous chapter', nextCh: 'Next chapter', speed: 'Speed', speaking: 'Reading aloud',
    ver: n => n === 0 ? 'Version 1' : 'Version 2',
  }
};
const isEn = () => { try { return API.I18N && API.I18N.en && API.I18N.en.back === t('back') && API.I18N.es.back !== t('back'); } catch (e) { return false; } };
const T = (k, ...a) => {
  const v = X[isEn() ? 'en' : 'es'][k];
  if (v === undefined) return t(k, ...a);
  return typeof v === 'function' ? v(...a) : v;
};

const DEF = { theme:'light', fs:18, lh:1.55, pad:22, anim:'slide', dim:0, mode:'page', rate:1 };
const CK = 'por-leer-lector';
let P = (() => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(CK) || '{}')); } catch (e) { return { ...DEF }; } })();
const savePrefs = () => { try { localStorage.setItem(CK, JSON.stringify(P)); } catch (e) {} };

/* ---------- lectura del epub ---------- */
const XML = new DOMParser();
const dirOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
/* resuelve "../Text/a.xhtml" relativo a la carpeta del OPF */
function resolve(base, rel) {
  if (!rel) return '';
  rel = rel.split('#')[0];
  if (!rel) return '';
  if (/^[a-z]+:/i.test(rel)) return rel;
  const parts = (base + rel).split('/'), out = [];
  for (const s of parts) {
    if (s === '.' || s === '') continue;
    if (s === '..') out.pop(); else out.push(s);
  }
  return out.join('/');
}
const MIME = n => {
  const e = (n.split('.').pop() || '').toLowerCase();
  return { jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', gif:'image/gif',
           svg:'image/svg+xml', webp:'image/webp' }[e] || 'application/octet-stream';
};

async function openEpub(blob) {
  await lib('lib/jszip.min.js');
  const zip = await JSZip.loadAsync(blob);
  const grab = async p => { const f = zip.file(p); return f ? await f.async('string') : ''; };

  const cx = XML.parseFromString(await grab('META-INF/container.xml'), 'application/xml');
  const rf = cx.querySelector('rootfile');
  if (!rf) throw new Error('epub');
  const opfPath = rf.getAttribute('full-path'), base = dirOf(opfPath);
  const opf = XML.parseFromString(await grab(opfPath), 'application/xml');

  /* manifiesto: id -> {href, type, props} */
  const man = new Map();
  [...opf.getElementsByTagName('item')].forEach(it => {
    man.set(it.getAttribute('id'), {
      href: resolve(base, it.getAttribute('href') || ''),
      type: it.getAttribute('media-type') || '',
      props: it.getAttribute('properties') || ''
    });
  });
  /* lomo: el orden real de lectura */
  const spine = [...opf.getElementsByTagName('itemref')]
    .map(ir => man.get(ir.getAttribute('idref')))
    .filter(x => x && /html|xml/.test(x.type));
  if (!spine.length) throw new Error('epub');

  const gmeta = n => { const e = opf.getElementsByTagNameNS('*', n)[0]; return e ? e.textContent.trim() : ''; };

  /* índice: primero el nav.xhtml de epub3, si no el NCX de epub2 */
  let toc = [];
  const navItem = [...man.values()].find(x => /nav/.test(x.props));
  if (navItem) {
    const d = XML.parseFromString(await grab(navItem.href), 'application/xhtml+xml');
    const nav = [...d.getElementsByTagName('nav')].find(n => (n.getAttribute('epub:type') || n.getAttribute('type') || '').includes('toc')) || d.querySelector('nav');
    if (nav) toc = [...nav.querySelectorAll('a')].map(a => ({
      label: (a.textContent || '').trim(),
      href: resolve(dirOf(navItem.href), a.getAttribute('href') || '')
    }));
  }
  if (!toc.length) {
    const ncx = [...man.values()].find(x => /ncx/.test(x.type));
    if (ncx) {
      const d = XML.parseFromString(await grab(ncx.href), 'application/xml');
      toc = [...d.getElementsByTagName('navPoint')].map(np => {
        const c = np.getElementsByTagName('content')[0];
        const lb = np.getElementsByTagName('text')[0];
        return { label: lb ? lb.textContent.trim() : '', href: resolve(dirOf(ncx.href), c ? c.getAttribute('src') : '') };
      });
    }
  }
  toc = toc.filter(x => x.label && x.href);
  /* a qué hoja del lomo apunta cada entrada del índice */
  const idx = new Map(spine.map((s, i) => [s.href, i]));
  toc.forEach(x => { x.i = idx.has(x.href) ? idx.get(x.href) : -1; });
  toc = toc.filter(x => x.i >= 0);

  return { zip, spine, toc, title: gmeta('title'), lang: (gmeta('language') || '').slice(0, 2).toLowerCase(), grab,
    async bin(p) { const f = zip.file(p); return f ? await f.async('blob') : null; } };
}

/* Cuerpo del capítulo ya limpio: fuera scripts, estilos propios y enlaces.
   La vista de lectura usa SIEMPRE la tipografía del lector, para que se lea igual
   en todos los libros y para no pagar el coste de estilos ajenos. */
async function bodyOf(b, item) {
  const raw = await b.grab(item.href);
  if (!raw) return null;
  let doc;
  try { doc = XML.parseFromString(raw, 'application/xhtml+xml'); } catch (e) { doc = null; }
  if (!doc || doc.getElementsByTagName('parsererror').length) doc = new DOMParser().parseFromString(raw, 'text/html');
  const body = doc.body || doc.querySelector('body');
  if (!body) return null;
  body.querySelectorAll('script,style,link,iframe,object,embed,audio,video,form,input,button').forEach(n => n.remove());
  body.querySelectorAll('*').forEach(n => {
    [...n.attributes].forEach(a => {
      const an = a.name.toLowerCase();
      if (an.startsWith('on') || an === 'style' || an === 'class' || an === 'id') n.removeAttribute(a.name);
    });
  });
  return body;
}

/* los "párrafos" que sirven de ancla para alinear dos versiones y para leer en voz alta */
const PSEL = 'p,h1,h2,h3,h4,h5,h6,li,blockquote';
const leafParas = root => [...root.querySelectorAll(PSEL)].filter(e => !e.querySelector(PSEL) && e.textContent.trim());

const urlCache = new Map();
async function chapterHtml(b, item, vid) {
  const body = await bodyOf(b, item);
  if (!body) return '';
  /* imágenes: se sacan del zip como blob y se cachean (cada versión con su propia clave) */
  const base = dirOf(item.href);
  const imgs = [...body.querySelectorAll('img,image')];
  for (const im of imgs) {
    const src = im.getAttribute('src') || im.getAttribute('xlink:href') || im.getAttribute('href');
    if (!src) { im.remove(); continue; }
    const path = resolve(base, src), key = vid + '|' + path;
    try {
      let u = urlCache.get(key);
      if (!u) {
        const bl = await b.bin(path);
        if (!bl) { im.remove(); continue; }
        u = URL.createObjectURL(new Blob([bl], { type: MIME(path) }));
        urlCache.set(key, u);
      }
      im.setAttribute('src', u);
      im.removeAttribute('xlink:href'); im.removeAttribute('href');
    } catch (e) { im.remove(); }
  }
  body.querySelectorAll('a').forEach(a => a.removeAttribute('href'));
  return body.innerHTML;
}

/* ---------- estado ---------- */
let el = null, bk = null, bks = [null, null], ver = 0, cur = null, si = 0, page = 0, pages = 1;
let busy = false, curling = false, searchTok = 0, chapHtml = '', selInfo = null, hlEdit = null, finAsked = false;
/* referencias fijas: se buscan una sola vez al construir la vista, no en cada cuadro */
let wrapEl, moveEl, colEl, dimEl, loadEl, panelEl, chEl, pctEl, dotEl, dockEl, menuEl, titleEl, bmEl, ribEl, langEl, navEl, cvEl, flapEl, flapIn;

const curBook = () => book(cur);
const verOf = x => x.v === 1 ? 1 : 0;

/* ---------- la vista ---------- */
function build() {
  el = document.createElement('div');
  el.className = 'lx';
  el.innerHTML = `
    <div class="lx-bar">
      <button type="button" class="lx-ico" data-x="close" aria-label="${esc(t('back'))}">${I.back}</button>
      <div class="lx-t" id="lxTitle"></div>
      <button type="button" class="lx-ico" data-x="bm" id="lxBm" aria-label="${esc(T('bm'))}">${I.bm}</button>
      <button type="button" class="lx-ico" data-x="toc" aria-label="${esc(t('lxToc'))}">${I.toc}</button>
      <button type="button" class="lx-ico" data-x="find" aria-label="${esc(t('lxFind'))}">${I.find}</button>
      <button type="button" class="lx-ico" data-x="set" aria-label="${esc(t('lxAa'))}">${I.aa}</button>
      <button type="button" class="lx-ico" data-x="more" aria-label="${esc(T('more'))}">${I.more}</button>
    </div>
    <div class="lx-wrap" id="lxWrap">
      <div class="lx-move" id="lxMove"><div class="lx-col" id="lxCol"></div>
        <div class="lx-chnav" id="lxNav"><button type="button" data-x="chprev">${esc(T('prevCh'))}</button><button type="button" data-x="chnext">${esc(T('nextCh'))}</button></div></div>
      <div class="lx-tap l" data-x="prev"></div>
      <div class="lx-tap r" data-x="next"></div>
      <div class="lx-rib" id="lxRib" hidden></div>
      <div class="lx-cv" id="lxCv" hidden></div>
      <div class="lx-cf" id="lxCf" hidden><div class="lx-cfi" id="lxCfi"></div></div>
      <div class="lx-dim" id="lxDim"></div>
      <div class="lx-load" id="lxLoad">${esc(t('lxLoading'))}</div>
    </div>
    <button type="button" class="lx-lang" id="lxLang" data-x="lang" hidden></button>
    <div class="lx-dock" id="lxDock"></div>
    <div class="lx-foot"><i class="lx-trk"><b id="lxDot"></b></i><span id="lxCh"></span><span id="lxPct"></span></div>
    <div class="lx-menu" id="lxMenu"></div>
    <div class="lx-panel" id="lxP"></div>`;
  document.body.appendChild(el);
  wrapEl = $('#lxWrap', el); moveEl = $('#lxMove', el); colEl = $('#lxCol', el);
  dimEl = $('#lxDim', el); loadEl = $('#lxLoad', el); panelEl = $('#lxP', el);
  chEl = $('#lxCh', el); pctEl = $('#lxPct', el); dotEl = $('#lxDot', el);
  dockEl = $('#lxDock', el); menuEl = $('#lxMenu', el); titleEl = $('#lxTitle', el);
  bmEl = $('#lxBm', el); ribEl = $('#lxRib', el); langEl = $('#lxLang', el);
  navEl = $('#lxNav', el); cvEl = $('#lxCv', el); flapEl = $('#lxCf', el); flapIn = $('#lxCfi', el);
  el.addEventListener('click', onTap);
  document.addEventListener('visibilitychange', () => { if (document.hidden && el.classList.contains('on') && bk) { clearTimeout(posT); writePos(); } });

  const w = wrapEl;
  /* tocar a los lados pasa página; mantener pulsado selecciona texto (no hay capas encima) */
  w.addEventListener('click', e => {
    const hm = e.target.closest && e.target.closest('mark.lx-hl');
    if (hm && !hasSel()) { openHlEditor(hm.dataset.id); return; }
    if (hasSel()) return;
    hideDock();
    if (P.mode === 'scroll' || e.target.closest('[data-x]')) return;
    const r = w.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (x < 0.3) go(-1); else if (x > 0.7) go(1);
  });
  /* deslizar para pasar página */
  let x0 = null, y0 = null;
  w.addEventListener('touchstart', e => { const tch = e.touches[0]; x0 = tch.clientX; y0 = tch.clientY; }, { passive: true });
  w.addEventListener('touchend', e => {
    if (x0 == null) return;
    const tch = e.changedTouches[0], dx = tch.clientX - x0, dy = tch.clientY - y0;
    x0 = null;
    if (P.mode === 'scroll' || hasSel()) return;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6) { dx < 0 ? go(1) : go(-1); }
  }, { passive: true });
  /* modo desplazar: el avance se calcula al mover el scroll */
  let raf = 0;
  w.addEventListener('scroll', () => {
    if (P.mode !== 'scroll' || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; paint(); });
  }, { passive: true });
  /* barra de subrayar al seleccionar */
  let st = null;
  document.addEventListener('selectionchange', () => {
    if (!el || !el.classList.contains('on')) return;
    clearTimeout(st);
    st = setTimeout(onSelection, 220);
  });
  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => relayout(true), 120); });
}

const hasSel = () => { const s = getSelection(); return !!(s && !s.isCollapsed && s.toString().trim()); };

function applyPrefs() {
  el.dataset.theme = P.theme;
  ['slide', 'fade', 'curl'].forEach(a => el.classList.toggle('lx-anim-' + a, P.anim === a));
  wrapEl.classList.toggle('lx-scrollmode', P.mode === 'scroll');
  const c = colEl;
  c.style.setProperty('--lx-fs', P.fs + 'px');
  c.style.setProperty('--lx-lh', P.lh);
  c.style.setProperty('--lx-pad', P.pad + 'px');
  dimEl.style.opacity = (P.dim || 0) / 100;
}

/* fracción del capítulo donde está el principio de lo que se ve */
function frac() {
  if (P.mode === 'scroll') {
    const w = wrapEl;
    return w.scrollHeight > 0 ? Math.min(0.9999, w.scrollTop / w.scrollHeight) : 0;
  }
  return pages > 1 ? page / pages : 0;
}
/* tramo [a,b) del capítulo que se ve ahora */
function viewRange() {
  if (P.mode === 'scroll') {
    const w = wrapEl, h = Math.max(1, w.scrollHeight);
    return [w.scrollTop / h, (w.scrollTop + w.clientHeight) / h];
  }
  return [page / pages, (page + 1) / pages];
}

/* El texto se reparte en columnas del ancho de la pantalla y se avanza
   moviendo el carro. Es la forma más barata de paginar: el navegador hace
   el reparto una vez y pasar página es solo un transform. */
function relayout(keepPct) {
  if (!el || !cur || !bk) return;
  curlDrop();
  const wrap = wrapEl, col = colEl;
  applyPrefs();
  if (P.mode === 'scroll') {
    const f = keepPct === true ? frac() : null;
    col.style.width = ''; col.style.columnWidth = '';
    pages = 1; page = 0;
    moveEl.style.transform = '';
    if (f != null) wrap.scrollTop = f * wrap.scrollHeight;
    paint();
    return;
  }
  const w = wrap.clientWidth, gap = P.pad * 2;
  const pct = keepPct === true && pages > 1 ? page / pages : null;
  col.style.setProperty('--lx-gap', gap + 'px');
  col.style.width = w + 'px';
  col.style.columnWidth = w - (P.pad * 2) + 'px';
  pages = Math.max(1, Math.round((col.scrollWidth + P.pad) / w));
  if (pct != null) page = Math.min(pages - 1, Math.round(pct * pages));
  page = Math.min(page, pages - 1);
  paint();
}
let lastCh = '', lastPct = -1, lastBm = null;
function paint() {
  if (P.mode !== 'scroll') moveEl.style.transform = `translate3d(${-page * wrapEl.clientWidth}px,0,0)`;
  const total = bk.spine.length;
  const ch = t('lxChapter', si + 1, total);
  if (ch !== lastCh) { chEl.textContent = ch; lastCh = ch; }
  const done = Math.min(1, (si + frac()) / total), pct = Math.round(done * 100);
  if (pct !== lastPct) { pctEl.textContent = pct + '%'; lastPct = pct; }
  dotEl.style.left = (done * 100).toFixed(2) + '%';
  paintBm();
  savePos();
}

let posT = null;
function savePos() {
  clearTimeout(posT);
  /* guardar toda la biblioteca en cada página sería pesado: se espera a que dejes de pasar páginas */
  posT = setTimeout(writePos, 5000);
}
function writePos() {
  const b = curBook();
  if (!b || !bk) return;
  b.pos = { i: si, p: +frac().toFixed(4) };
  if (ver === 1) b.pos.v = 1;
  try { save(); } catch (e) {}
}

/* Va a una posición dentro del capítulo ya pintado */
function gotoFrac(p) {
  if (P.mode === 'scroll') {
    const w = wrapEl;
    w.scrollTop = p >= 1 ? w.scrollHeight : p * w.scrollHeight;
  } else {
    page = p >= 1 ? pages - 1 : Math.max(0, Math.min(pages - 1, Math.floor(p * pages + 0.001)));
  }
  paint();
}
const paras = () => leafParas(colEl);
function elPage(e) {
  const wrap = wrapEl, w = wrap.clientWidth, wr = wrap.getBoundingClientRect();
  const r = (e.getClientRects()[0]) || e.getBoundingClientRect();
  return Math.max(0, Math.min(pages - 1, Math.floor((r.left - wr.left + page * w) / w + 0.001)));
}
function gotoPara(k) {
  const e = paras()[Math.max(0, k)];
  if (!e) return;
  if (P.mode === 'scroll') {
    const wrap = wrapEl;
    wrap.scrollTop += e.getBoundingClientRect().top - wrap.getBoundingClientRect().top - 8;
  } else page = elPage(e);
  paint();
}
/* índice del primer párrafo que se ve en pantalla */
function topPara() {
  const wrap = wrapEl, wr = wrap.getBoundingClientRect(), list = paras();
  for (let k = 0; k < list.length; k++) {
    for (const r of list[k].getClientRects()) {
      if (P.mode === 'scroll' ? (r.bottom > wr.top + 6 && r.top < wr.bottom) : (r.right > wr.left + 8 && r.left < wr.right - 8)) return k;
    }
  }
  return 0;
}

async function show(i, o) {
  o = o || {};
  if (busy) return;
  busy = true;
  const load = loadEl;
  const move = moveEl;
  si = Math.max(0, Math.min(bk.spine.length - 1, i));
  if (P.anim === 'fade') move.classList.add('lx-out');
  /* el aviso de "cargando" solo aparece si el capítulo tarda de verdad */
  const lt = setTimeout(() => { load.hidden = false; }, 180);
  let html = '';
  try { html = await chapterHtml(bk, bk.spine[si], ver); } catch (e) { html = ''; }
  clearTimeout(lt); load.hidden = true;
  curlDrop();
  chapHtml = html || `<p>${esc(t('lxEmptyCh'))}</p>`;
  const col = colEl;
  col.innerHTML = chapHtml;
  applyHl();
  page = 0;
  wrapEl.scrollTop = 0;
  relayout();
  if (o.para != null) gotoPara(o.para);
  else if (o.end) gotoFrac(1);
  else if (o.pct != null && o.pct > 0) gotoFrac(o.pct);
  const ch = bk.toc.filter(x => x.i <= si).pop();
  titleEl.textContent = (ch && ch.label) || bk.title || '';
  move.classList.remove('lx-out');
  const nav = navEl;
  nav.querySelector('[data-x="chprev"]').hidden = si <= 0;
  const last = si >= bk.spine.length - 1, cb = curBook(), fin = last && cb && API.isRead && !API.isRead(cb);
  const nx = nav.querySelector('[data-x="chnext"],[data-x="finish"]');
  nx.hidden = last && !fin;
  nx.dataset.x = last ? 'finish' : 'chnext';
  nx.textContent = last ? T('markRead') : T('nextCh');
  busy = false;
}

function go(d) {
  if (busy || P.mode === 'scroll') return;
  if (curling && curlEnd) curlEnd();
  ttsStop();
  const n = page + d;
  if (n >= 0 && n < pages) {
    if (P.anim === 'curl') return curl(d, n);
    page = n; paint(); return;
  }
  if (d > 0 && si < bk.spine.length - 1) return show(si + 1);
  if (d > 0) return askFinish();
  if (d < 0 && si > 0) return show(si - 1, { end: true });
}

/* Al llegar al final del último capítulo se ofrece marcar el libro como leído */
function askFinish(force) {
  const b = curBook();
  if (!b || !API.markRead || API.isRead(b) || (finAsked && !force)) return;
  finAsked = true;
  dock(`<span class="lx-dlbl">${esc(T('finished'))}</span>
    <button type="button" class="lx-dbtn pri" data-x="finyes">${esc(T('markRead'))}</button>
    <button type="button" class="lx-dbtn" data-x="dockx">${esc(T('notNow'))}</button>`);
}

/* ---------- animación "pasar hoja" ----------
   La hoja que sale se dobla: la parte sin doblar es una copia del capítulo
   recortada por la línea del doblez, y el triángulo doblado se dibuja como
   el reverso del papel, con su sombra. Debajo ya está la página nueva.
   La copia se prepara UNA vez por capítulo y se reutiliza, así cada página
   cuesta solo dos recortes por cuadro y ningún cálculo de maquetación. */
function clipRect(W, H, q, n, keepNeg) {
  /* recorta el rectángulo con el semiplano dot(p-q,n) <0 (o >=0 si keepNeg es falso) */
  const pts = [[0, 0], [W, 0], [W, H], [0, H]];
  const f = p => (keepNeg ? -1 : 1) * ((p[0] - q[0]) * n[0] + (p[1] - q[1]) * n[1]);
  const out = [];
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const k = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  }
  return out;
}
const poly = pts => pts.length < 3 ? 'polygon(0 0,0 0,0 0)' : 'polygon(' + pts.map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';

let curlA = null, curlB = null, curlRaf = 0, curlEnd = null;
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) { return false; } })();

/* la copia deja de servir cuando cambia el capítulo, la letra o los subrayados */
function curlDrop() {
  if (curlEnd) curlEnd();
  if (curlA) curlA.remove();
  if (curlB) curlB.remove();
  curlA = curlB = null;
  if (cvEl) { cvEl.hidden = true; flapEl.hidden = true; }
}
function curlPrep() {
  if (curlA) return true;
  /* en capítulos muy largos las copias costarían más que la animación: se pasa a deslizar */
  if (colEl.textContent.length > 60000) return false;
  const mk = () => {
    const c = moveEl.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    const nv = c.querySelector('.lx-chnav'); if (nv) nv.remove();
    c.style.cssText = 'position:absolute;inset:0;transition:none';
    return c;
  };
  curlA = mk(); cvEl.appendChild(curlA);
  curlB = mk(); flapIn.appendChild(curlB);
  return true;
}
function curl(d, n) {
  const W = wrapEl.clientWidth, H = wrapEl.clientHeight;
  if (REDUCE || !W || !H || !curlPrep()) { page = n; paint(); return; }
  if (curlEnd) curlEnd();
  const tr = `translate3d(${-page * W}px,0,0)`;
  curlA.style.transform = tr; curlB.style.transform = tr;
  cvEl.hidden = false; flapEl.hidden = false;
  cvEl.classList.add('lx-run'); flapEl.classList.add('lx-run');
  page = n; paint();                    /* la página nueva ya está debajo */
  curling = true;
  const s2 = d > 0 ? 1 : -1, cx = s2 > 0 ? W : 0, D = W + H;
  const T0 = performance.now(), DUR = window.__LXDUR || 380;
  const ease = u => 1 - Math.pow(1 - u, 3);
  curlEnd = () => {
    if (curlRaf) cancelAnimationFrame(curlRaf);
    curlRaf = 0; curlEnd = null; curling = false;
    cvEl.hidden = true; flapEl.hidden = true;
    cvEl.classList.remove('lx-run'); flapEl.classList.remove('lx-run');
  };
  const apply = u => {
    const th = (46 - 36 * u) * Math.PI / 180;
    const nx = s2 * Math.cos(th), ny = -Math.sin(th);
    const q = [cx - nx * D * u, -ny * D * u];
    cvEl.style.clipPath = poly(clipRect(W, H, q, [nx, ny], true));
    /* el reverso: el trozo doblado, reflejado respecto a la línea del doblez */
    flapIn.style.clipPath = poly(clipRect(W, H, q, [nx, ny], false));
    const nq = nx * q[0] + ny * q[1];
    flapIn.style.transform = `matrix(${1 - 2 * nx * nx},${-2 * nx * ny},${-2 * nx * ny},${1 - 2 * ny * ny},${2 * nx * nq},${2 * ny * nq})`;
    flapIn.style.setProperty('--lx-fold', (Math.atan2(-ny, -nx) * 180 / Math.PI + 90).toFixed(1) + 'deg');
  };
  const frame = now => {
    const u = ease(Math.min(1, (now - T0) / DUR));
    apply(u);
    if (u < 1) curlRaf = requestAnimationFrame(frame);
    else curlEnd();
  };
  apply(0);                              /* el primer cuadro ya sale doblado */
  curlRaf = requestAnimationFrame(frame);
}

/* ---------- marcadores ---------- */
function marksHere() {
  const b = curBook();
  if (!b || !b.marks) return [];
  const [a, z] = viewRange();
  return b.marks.filter(m => verOf(m) === ver && m.i === si && m.p >= a - 0.0005 && m.p < z - 0.0005);
}
function paintBm() {
  const on = marksHere().length > 0;
  if (on === lastBm) return;
  lastBm = on;
  bmEl.classList.toggle('on', on);
  ribEl.hidden = !on;
}
function snippetAt(p) {
  const text = (colEl.textContent || '').replace(/\s+/g, ' ');
  let at = Math.floor(p * text.length);
  const sp = text.lastIndexOf(' ', at); if (sp >= 0 && at - sp < 24) at = sp + 1;
  return text.slice(at, at + 80).trim();
}
function toggleBm() {
  const b = curBook(); if (!b) return;
  const here = marksHere();
  if (here.length) {
    b.marks = b.marks.filter(m => !here.includes(m));
    if (!b.marks.length) delete b.marks;
    toast(T('bmDel'));
  } else {
    const [a] = viewRange();
    (b.marks = b.marks || []).push({ id: 'm' + Date.now().toString(36), i: si, p: +a.toFixed(4), tx: snippetAt(a), ts: Date.now(), ...(ver ? { v: 1 } : {}) });
    toast(T('bmAdd'));
  }
  try { save(); } catch (e) {}
  paintBm();
}

/* ---------- subrayados y notas ---------- */
const HC = ['y', 'g', 'b', 'p'];
function textNodes(root) {
  const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n, pos = 0;
  while ((n = w.nextNode())) { out.push({ n, s: pos, e: pos + n.data.length }); pos += n.data.length; }
  return out;
}
function wrapRange(col, s, e, h) {
  for (const o of textNodes(col)) {
    if (o.e <= s || o.s >= e) continue;
    let n = o.n;
    const a = Math.max(s, o.s) - o.s, b = Math.min(e, o.e) - o.s;
    if (!n.data.slice(a, b).trim()) continue;
    if (a > 0) n = n.splitText(a);
    if (b - a < n.data.length) n.splitText(b - a);
    const m = document.createElement('mark');
    m.className = 'lx-hl'; m.dataset.id = h.id; m.dataset.c = h.c;
    if (h.n) m.dataset.n = '1';
    n.parentNode.insertBefore(m, n); m.appendChild(n);
  }
}
function applyHl() {
  const b = curBook(); if (!b || !b.hl) return;
  const col = colEl;
  b.hl.filter(h => verOf(h) === ver && h.i === si).forEach(h => wrapRange(col, h.s, h.e, h));
}
/* vuelve a pintar el capítulo sin perder la posición */
function repaintHl() {
  const col = colEl, p = P.mode === 'scroll' ? wrapEl.scrollTop : 0;
  col.innerHTML = chapHtml;
  applyHl();
  curlDrop();
  relayout(false);
  if (P.mode === 'scroll') wrapEl.scrollTop = p;
  paint();
}
function selOffsets() {
  const sel = getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0), col = colEl;
  if (!col.contains(r.startContainer) || !col.contains(r.endContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(col); pre.setEnd(r.startContainer, r.startOffset);
  const s = pre.toString().length, q = r.toString();
  if (!q.trim()) return null;
  return { s, e: s + q.length, q: q.replace(/\s+/g, ' ').trim() };
}
function onSelection() {
  if (!el || !el.classList.contains('on') || panelEl.classList.contains('on')) return;
  const so = selOffsets();
  if (!so) { if (!hlEdit) hideDock(); return; }
  selInfo = so; hlEdit = null;
  dockSel();
}
function colorsRow(act, cur2) {
  return `<div class="lx-cols">${HC.map(c => `<button type="button" class="lx-cdot ${c} ${cur2 === c ? 'on' : ''}" data-x="${act}" data-c="${c}" aria-label="${esc(T('c_' + c))}"></button>`).join('')}</div>`;
}
function dockSel() {
  const one = !/\s/.test(selInfo.q);
  dock(`${colorsRow('hl', null)}
    <button type="button" class="lx-dbtn" data-x="hlnote">${esc(T('note'))}</button>
    ${one ? `<button type="button" class="lx-dbtn" data-x="dict">${esc(T('dict'))}</button>` : ''}
    <button type="button" class="lx-dbtn" data-x="copy">${esc(T('copy'))}</button>`);
}
function addHl(c, note) {
  const b = curBook(); if (!b || !selInfo) return;
  const { s, e, q } = selInfo;
  /* un subrayado nuevo reemplaza a los que se le crucen */
  b.hl = (b.hl || []).filter(h => !(verOf(h) === ver && h.i === si && h.s < e && h.e > s));
  b.hl.push({ id: 'h' + Date.now().toString(36), i: si, s, e, q: q.slice(0, 160), c, ...(note ? { n: note } : {}), ts: Date.now(), ...(ver ? { v: 1 } : {}) });
  try { save(); } catch (e2) {}
  const sel = getSelection(); if (sel) sel.removeAllRanges();
  selInfo = null; hideDock();
  repaintHl();
}
function openHlEditor(id) {
  const b = curBook(), h = b && (b.hl || []).find(x => x.id === id);
  if (!h) return;
  hlEdit = h; selInfo = null;
  dock(`${colorsRow('hlc', h.c)}
    <button type="button" class="lx-dbtn" data-x="hlnote">${esc(h.n ? T('edit') : T('note'))}</button>
    <button type="button" class="lx-dbtn" data-x="hldel">${esc(T('hlDel'))}</button>
    <button type="button" class="lx-dbtn lx-dx" data-x="dockx" aria-label="x">${I.x}</button>`);
}
function noteSheet(onSave, text, onDel) {
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(T('note'))}</b></div>
    <div class="lx-nbox"><textarea id="lxNt" rows="6" placeholder="${esc(T('notePh'))}">${esc(text || '')}</textarea>
    <div class="lx-nbtns">${onDel ? `<button type="button" class="lx-dbtn" id="lxNd">${esc(T('del'))}</button>` : ''}<button type="button" class="lx-dbtn pri" id="lxNs">${esc(T('save'))}</button></div></div>`);
  $('#lxNs', el).onclick = () => { const v = $('#lxNt', el).value.trim(); closePanel(); onSave(v); };
  if (onDel) $('#lxNd', el).onclick = () => { closePanel(); onDel(); };
  setTimeout(() => { const ta = $('#lxNt', el); if (ta) ta.focus(); }, 120);
}
function dock(html) { const d = dockEl; d.innerHTML = html; d.classList.add('on'); }
function hideDock() { const d = dockEl; if (!d) return; if (tts && tts.on) { ttsDock(); return; } d.classList.remove('on'); hlEdit = null; }

/* ---------- paneles ---------- */
function panel(html) {
  const p = panelEl;
  p.innerHTML = html;
  p.classList.add('on');
  hideMenu();
}
const closePanel = () => { const p = panelEl; p.classList.remove('on'); setTimeout(() => { if (!p.classList.contains('on')) p.innerHTML = ''; }, 200); };

const when = ts => { try { return new Date(ts).toLocaleDateString(isEn() ? 'en' : 'es', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } };
const chLabel = i => { const ch = bk.toc.filter(x => x.i <= i).pop(); return (ch && ch.label) || t('lxChapter', i + 1, bk.spine.length); };

let tocTab = 'ch';
function tocPanel(tab) {
  tocTab = tab || tocTab;
  const b = curBook();
  const cuRow = bk.toc.filter(x => x.i <= si).pop();
  const marks = ((b && b.marks) || []).filter(m => verOf(m) === ver).sort((a, z) => a.i - z.i || a.p - z.p);
  const hls = ((b && b.hl) || []).filter(h => verOf(h) === ver).sort((a, z) => a.i - z.i || a.s - z.s);
  let body;
  if (tocTab === 'ch') {
    body = bk.toc.length
      ? bk.toc.map(x => `<button type="button" class="lx-item ${x === cuRow ? 'cur' : ''}" data-go="${x.i}">${esc(x.label)}</button>`).join('')
      : `<p class="lx-note">${esc(t('lxNoToc'))}</p>`;
  } else if (tocTab === 'bm') {
    body = marks.length ? marks.map(m => `<div class="lx-irow"><button type="button" class="lx-item" data-go="${m.i}" data-pct="${m.p}">${esc(m.tx || '…')}<small>${esc(chLabel(m.i))} · ${esc(when(m.ts))}</small></button><button type="button" class="lx-rm" data-rmm="${m.id}" aria-label="${esc(T('del'))}">${I.x}</button></div>`).join('')
      : `<p class="lx-note">${esc(T('noMarks'))}</p>`;
  } else {
    body = hls.length ? hls.map(h => `<div class="lx-irow"><button type="button" class="lx-item hl" data-go="${h.i}" data-hl="${h.id}"><span class="lx-q ${h.c}">${esc(h.q)}</span>${h.n ? `<em>${esc(h.n)}</em>` : ''}<small>${esc(chLabel(h.i))} · ${esc(when(h.ts))}</small></button><button type="button" class="lx-rm" data-rmh="${h.id}" aria-label="${esc(T('del'))}">${I.x}</button></div>`).join('')
      : `<p class="lx-note">${esc(T('noNotes'))}</p>`;
  }
  const tab2 = (k, lb, n) => `<button type="button" data-tab="${k}" aria-pressed="${tocTab === k}">${esc(lb)}${n ? ` <small>${n}</small>` : ''}</button>`;
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxToc'))}</b></div>
    <div class="lx-tabs">${tab2('ch', T('tabCh'))}${tab2('bm', T('tabMarks'), marks.length)}${tab2('hl', T('tabNotes'), hls.length)}</div>
    <div class="lx-plist">${body}</div>`);
}

function findPanel() {
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxFind'))}</b></div>
    <div class="lx-sbox"><input id="lxQ" type="search" autocomplete="off" placeholder="${esc(t('lxFindPh'))}"></div>
    <div class="lx-plist" id="lxR"><p class="lx-note">${esc(t('lxFindHint'))}</p></div>`);
  const q = $('#lxQ', el);
  q.focus();
  let tm = null;
  q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => runSearch(q.value.trim()), 350); });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tm); runSearch(q.value.trim()); } });
}

/* Busca capítulo a capítulo y va pintando resultados según los encuentra,
   para que no haya que esperar a recorrer el libro entero. */
async function runSearch(q) {
  const box = $('#lxR', el);
  if (!box) return;
  const tok = ++searchTok;
  if (q.length < 2) { box.innerHTML = `<p class="lx-note">${esc(t('lxFindHint'))}</p>`; return; }
  box.innerHTML = `<p class="lx-note">${esc(t('lxSearching'))}</p>`;
  const nq = norm(q), mine = bk;
  let found = 0, html = '';
  for (let i = 0; i < mine.spine.length; i++) {
    if (tok !== searchTok) return;
    let text = '';
    try {
      const raw = await mine.grab(mine.spine[i].href);
      const d = new DOMParser().parseFromString(raw, 'text/html');
      d.body.querySelectorAll('script,style').forEach(n => n.remove());
      /* textContent pega el final de un bloque con el principio del siguiente
         ("distinto.Mariela"), así que se separan antes de extraer */
      d.body.querySelectorAll('p,div,br,li,tr,h1,h2,h3,h4,h5,h6,blockquote').forEach(n => n.insertAdjacentText('afterend', ' '));
      text = (d.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (e) { continue; }
    const nt = norm(text);
    let from = 0, hits = 0, at;
    while ((at = nt.indexOf(nq, from)) >= 0 && hits < 6 && found < 120) {
      const a = Math.max(0, at - 48), b = Math.min(text.length, at + nq.length + 64);
      const frag = (a > 0 ? '… ' : '') + esc(text.slice(a, at)) + '<mark>' + esc(text.slice(at, at + nq.length)) + '</mark>' + esc(text.slice(at + nq.length, b)) + (b < text.length ? ' …' : '');
      const ch = mine.toc.filter(x => x.i <= i).pop();
      html += `<button type="button" class="lx-item" data-go="${i}" data-pct="${(at / Math.max(1, text.length)).toFixed(4)}">${frag}<small>${esc((ch && ch.label) || t('lxChapter', i + 1, mine.spine.length))}</small></button>`;
      from = at + nq.length; hits++; found++;
    }
    if (found && (i % 3 === 0 || found >= 120)) box.innerHTML = html;
    if (found >= 120) break;
    /* respiro para que la interfaz no se congele en libros largos */
    if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));
  }
  if (tok !== searchTok) return;
  box.innerHTML = found ? html : `<p class="lx-note">${esc(t('lxNoHits'))}</p>`;
}

function setPanel() {
  const seg = (name, opts, val) => `<div class="lx-seg">${opts.map(([v, lb]) =>
    `<button type="button" data-set="${name}" data-v="${v}" aria-pressed="${String(val) === String(v)}">${esc(lb)}</button>`).join('')}</div>`;
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxAa'))}</b></div>
    <div class="lx-set">
      <div class="lx-row"><span>${esc(t('lxTheme'))}</span><div class="lx-th">
        ${[['light','#fdfcfa','#22202b'],['sepia','#f3e9d6','#3b3222'],['dark','#20202a','#ddd9e4'],['amoled','#000','#cfcbd6']]
          .map(([v,bg,fg])=>`<button type="button" data-set="theme" data-v="${v}" aria-pressed="${P.theme===v}" style="background:${bg};color:${fg}">Aa</button>`).join('')}
      </div></div>
      <div class="lx-row"><span>${esc(t('lxSize'))}</span><div class="lx-range"><input type="range" id="lxFs" min="13" max="30" step="1" value="${P.fs}"><b id="lxFsV">${P.fs}</b></div></div>
      <div class="lx-row"><span>${esc(t('lxLine'))}</span><div class="lx-range"><input type="range" id="lxLh" min="12" max="22" step="1" value="${Math.round(P.lh*10)}"><b id="lxLhV">${P.lh.toFixed(1)}</b></div></div>
      <div class="lx-row"><span>${esc(t('lxMargin'))}</span><div class="lx-range"><input type="range" id="lxPd" min="10" max="46" step="2" value="${P.pad}"><b id="lxPdV">${P.pad}</b></div></div>
      <div class="lx-row"><span>${esc(t('lxDim'))}</span><div class="lx-range"><input type="range" id="lxDimR" min="0" max="70" step="5" value="${P.dim||0}"><b id="lxDimV">${P.dim||0}%</b></div></div>
      <div class="lx-row"><span>${esc(T('lxMode'))}</span>${seg('mode',[['page',T('lxModePage')],['scroll',T('lxModeScroll')]],P.mode)}</div>
      <div class="lx-row"><span>${esc(t('lxAnim'))}</span>${seg('anim',[['slide',t('lxAnimSlide')],['curl',T('lxAnimCurl')],['fade',t('lxAnimFade')],['none',t('lxAnimNone')]],P.anim)}</div>
    </div>`);
  const bind = (id, out, fn) => {
    const r = $('#' + id, el); if (!r) return;
    r.addEventListener('input', () => { fn(+r.value); applyPrefs(); $('#' + out, el).textContent = fn.label(+r.value); });
    r.addEventListener('change', () => { savePrefs(); relayout(true); });
  };
  const mk = (f, l) => { f.label = l; return f; };
  bind('lxFs','lxFsV', mk(v => { P.fs = v; }, v => v));
  bind('lxLh','lxLhV', mk(v => { P.lh = v / 10; }, v => (v / 10).toFixed(1)));
  bind('lxPd','lxPdV', mk(v => { P.pad = v; }, v => v));
  bind('lxDimR','lxDimV', mk(v => { P.dim = v; }, v => v + '%'));
}

/* menú de "más" */
function menu() {
  const b = curBook(), m = menuEl;
  if (m.classList.contains('on')) return hideMenu();
  const items = [];
  items.push(tts && tts.on ? ['tts', T('stopListen')] : ['tts', T('listen')]);
  items.push(b && b.file2 ? ['delver', T('delVer')] : ['addver', T('addVer')]);
  m.innerHTML = items.map(([a, lb]) => `<button type="button" data-x="m-${a}">${esc(lb)}</button>`).join('');
  m.classList.add('on');
}
function hideMenu() { const m = menuEl; if (m) m.classList.remove('on'); }

/* ---------- leer en voz alta ---------- */
let tts = null;
const synth = () => window.speechSynthesis || null;
function ttsStart() {
  if (!synth() || typeof SpeechSynthesisUtterance === 'undefined') { toast(T('noTts')); return; }
  ttsStop();
  tts = { on: true, k: topPara(), tok: 0, paused: false };
  ttsGo(tts.k);
}
function ttsStop() {
  if (!tts) return;
  tts.on = false; tts.tok++;
  try { synth().cancel(); } catch (e) {}
  const c = el && colEl; if (c) c.querySelectorAll('.lx-spk').forEach(n => n.classList.remove('lx-spk'));
  tts = null;
  const d = dockEl; if (d && !hlEdit && !selInfo) d.classList.remove('on');
}
function ttsDock() {
  dock(`<span class="lx-dlbl">${esc(T('speaking'))}</span>
    <button type="button" class="lx-dbtn ico" data-x="tpause" aria-label="pause">${tts && tts.paused ? I.play : I.pause}</button>
    <button type="button" class="lx-dbtn" data-x="trate">${P.rate}×</button>
    <button type="button" class="lx-dbtn ico" data-x="tstop" aria-label="stop">${I.stop}</button>`);
}
function chunks(txt) {
  const parts = txt.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*["»”)]*\s*/g) || [txt];
  const out = []; let acc = '';
  for (const p of parts) {
    if ((acc + p).length > 220 && acc) { out.push(acc.trim()); acc = ''; }
    acc += p;
  }
  if (acc.trim()) out.push(acc.trim());
  return out;
}
function ttsGo(k) {
  if (!tts || !tts.on) return;
  const list = paras();
  if (k >= list.length) {
    if (si < bk.spine.length - 1) {
      const my = ++tts.tok;
      show(si + 1).then(() => { if (tts && tts.on && tts.tok === my) ttsGo(0); });
    } else ttsStop();
    return;
  }
  tts.k = k;
  const e = list[k], my = ++tts.tok;
  colEl.querySelectorAll('.lx-spk').forEach(n => n.classList.remove('lx-spk'));
  e.classList.add('lx-spk');
  /* la página sigue a la voz */
  if (P.mode === 'scroll') { const w = wrapEl; const r = e.getBoundingClientRect(), wr = w.getBoundingClientRect(); if (r.top < wr.top || r.bottom > wr.bottom) w.scrollTop += r.top - wr.top - 24; }
  else { const n = elPage(e); if (n !== page) { page = n; paint(); } }
  ttsDock();
  const parts = chunks(e.textContent || '');
  let j = 0;
  const next = () => {
    if (!tts || !tts.on || tts.tok !== my) return;
    if (j >= parts.length) return ttsGo(k + 1);
    const u = new SpeechSynthesisUtterance(parts[j++]);
    u.lang = (bk.lang || (isEn() ? 'en' : 'es'));
    u.rate = P.rate;
    u.onend = next;
    u.onerror = ev => { if (!ev || (ev.error !== 'interrupted' && ev.error !== 'canceled')) ttsStop(); };
    try { synth().speak(u); } catch (er) { ttsStop(); }
  };
  next();
}

/* ---------- versión bilingüe ---------- */
const IDBN = 'tbr-lector';
const idb = () => new Promise((ok, ko) => {
  const r = indexedDB.open(IDBN, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('al');
  r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
});
const idbGet = async k => { try { const db = await idb(); return await new Promise(ok => { const q = db.transaction('al').objectStore('al').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); } catch (e) { return null; } };
const idbPut = async (k, v) => { try { const db = await idb(); await new Promise(ok => { const tx = db.transaction('al', 'readwrite'); if (v === null) tx.objectStore('al').delete(k); else tx.objectStore('al').put(v, k); tx.oncomplete = ok; tx.onerror = ok; }); } catch (e) {} };

const alKey = b => `${b.id}|${(b.file && b.file.name) || ''}|${(b.file2 && b.file2.name) || ''}`;
async function openVersion(v) {
  if (bks[v]) return bks[v];
  const b = curBook(), ref = v ? b.file2 : b.file;
  bks[v] = await openEpub(await FS.get(ref));
  return bks[v];
}
/* cuántos párrafos tiene cada capítulo de cada versión; se calcula una vez y se guarda */
async function getAlign(force) {
  const b = curBook(), key = alKey(b);
  if (!force) { const c = await idbGet(key); if (c && c.a && c.b) return c; }
  const count = async v => {
    const x = await openVersion(v), out = [];
    for (let i = 0; i < x.spine.length; i++) {
      let n = 0;
      try { const body = await bodyOf(x, x.spine[i]); if (body) n = leafParas(body).length; } catch (e) {}
      out.push(n);
      if (i % 5 === 4) await new Promise(r => setTimeout(r, 0));
    }
    return out;
  };
  const al = { a: await count(0), b: await count(1), ts: Date.now() };
  await idbPut(key, al);
  return al;
}
/* de (capítulo, párrafo) en una versión al equivalente en la otra */
function mapPara(al, from, i, k) {
  const A = from === 0 ? al.a : al.b, B = from === 0 ? al.b : al.a;
  const clamp = (j, kk) => ({ i: j, k: Math.max(0, Math.min(Math.max(0, B[j] - 1), kk)) });
  /* si las dos versiones tienen los mismos capítulos con texto, se emparejan uno a uno */
  const ca = A.map((c, x) => c >= 3 ? x : -1).filter(x => x >= 0), cb = B.map((c, x) => c >= 3 ? x : -1).filter(x => x >= 0);
  if (ca.length === cb.length && ca.length > 1) {
    const pos = ca.indexOf(i);
    if (pos >= 0) return clamp(cb[pos], Math.round(k / Math.max(1, A[i]) * B[cb[pos]]));
  }
  /* si no, se reparte proporcionalmente por todo el libro */
  const cum = arr => { let s = 0; return arr.map(n => (s += n) - n); };
  const cA = cum(A), cB = cum(B), tA = A.reduce((s, n) => s + n, 0) || 1, tB = B.reduce((s, n) => s + n, 0) || 1;
  const g = Math.round((cA[Math.min(i, cA.length - 1)] + k) / tA * tB);
  let j = 0; while (j < B.length - 1 && cB[j + 1] <= g) j++;
  return clamp(j, g - cB[j]);
}
function paintLang() {
  const b = curBook(), btn = langEl;
  if (!btn) return;
  btn.hidden = !(b && b.file2);
  if (b && b.file2) {
    const code = v => ((bks[v] && bks[v].lang) || (v ? 'B' : 'A')).toUpperCase();
    btn.textContent = code(ver);
    btn.setAttribute('aria-label', code(1 - ver));
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function switchVer() {
  const b = curBook();
  if (!b || !b.file2 || busy) return;
  const to = 1 - ver, move = moveEl;
  ttsStop();
  let al;
  try { al = await getAlign(); await openVersion(to); } catch (e) { toast(T('verBad')); return; }
  const m = mapPara(al, ver, si, topPara());
  writePos();
  move.style.transition = 'opacity .2s linear'; move.style.opacity = '0';
  await sleep(200);
  ver = to; bk = bks[to];
  await show(m.i, { para: m.k });
  move.style.opacity = '1';
  await sleep(210);
  move.style.transition = ''; move.style.opacity = '';
  paintLang();
  writePos();
}
function pickWeb() {
  return new Promise((ok, ko) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.epub,application/epub+zip';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return ko(new Error('cancelled'));
      try { ok(await FS.put('v2-' + cur + '-' + Date.now(), f)); } catch (e) { ko(e); }
    };
    inp.click();
  });
}
async function addVersion() {
  const b = curBook(); if (!b) return;
  toast(T('verAsk'));
  let ref;
  try {
    if (API.CAP && FS.pickNative) ref = (await FS.pickNative()).ref;
    else ref = await pickWeb();
  } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast(T('verBad')); return; }
  b.file2 = ref; bks[1] = null;
  toast(T('verPrep'));
  try {
    await openVersion(1);
    await getAlign(true);
  } catch (e) {
    FS.del(ref); delete b.file2; bks[1] = null;
    toast(T('verBad')); return;
  }
  try { save(); } catch (e) {}
  paintLang();
  toast(T('verAdded'));
}
async function delVersion() {
  const b = curBook(); if (!b || !b.file2) return;
  if (ver === 1) await switchVer();
  FS.del(b.file2);
  idbPut(alKey(b), null);
  delete b.file2; bks[1] = null;
  b.marks = (b.marks || []).filter(m => verOf(m) === 0); if (!b.marks.length) delete b.marks;
  b.hl = (b.hl || []).filter(h => verOf(h) === 0); if (!b.hl.length) delete b.hl;
  try { save(); } catch (e) {}
  paintLang();
  toast(T('verDel'));
}

/* ---------- interacción ---------- */
function onTap(e) {
  const s = e.target.closest('[data-set]');
  if (s) {
    P[s.dataset.set] = s.dataset.v;
    savePrefs();
    s.parentElement.querySelectorAll('[data-set]').forEach(b2 => b2.setAttribute('aria-pressed', String(b2.dataset.v === s.dataset.v)));
    if (s.dataset.set === 'mode') { const f = frac(); applyPrefs(); relayout(false); gotoFrac(f); } else applyPrefs();
    return;
  }
  const tb = e.target.closest('[data-tab]');
  if (tb) return tocPanel(tb.dataset.tab);
  const rm = e.target.closest('[data-rmm]');
  if (rm) { const b = curBook(); b.marks = b.marks.filter(m => m.id !== rm.dataset.rmm); if (!b.marks.length) delete b.marks; try { save(); } catch (e2) {} paintBm(); return tocPanel('bm'); }
  const rh = e.target.closest('[data-rmh]');
  if (rh) { const b = curBook(); b.hl = b.hl.filter(h => h.id !== rh.dataset.rmh); if (!b.hl.length) delete b.hl; try { save(); } catch (e2) {} repaintHl(); return tocPanel('hl'); }
  const g = e.target.closest('[data-go]');
  if (g) {
    let pct = g.dataset.pct != null ? +g.dataset.pct : null;
    let para = null;
    if (g.dataset.hl) {
      const h = (curBook().hl || []).find(x => x.id === g.dataset.hl);
      /* un subrayado se ubica por su posición en el texto del capítulo */
      if (h) pct = null, para = { s: h.s };
    }
    closePanel();
    if (para) return showAtOffset(+g.dataset.go, para.s);
    show(+g.dataset.go, { pct }); return;
  }
  const x = e.target.closest('[data-x]');
  if (!x) { hideMenu(); return; }
  const a = x.dataset.x;
  if (a !== 'more') hideMenu();
  switch (a) {
    case 'close': return close();
    case 'pclose': return closePanel();
    case 'toc': return tocPanel('ch');
    case 'find': return findPanel();
    case 'set': return setPanel();
    case 'prev': return go(-1);
    case 'next': return go(1);
    case 'bm': return toggleBm();
    case 'more': return menu();
    case 'lang': return switchVer();
    case 'chprev': return show(si - 1);
    case 'chnext': return show(si + 1);
    case 'm-tts': return tts && tts.on ? ttsStop() : ttsStart();
    case 'm-addver': return addVersion();
    case 'm-delver': return delVersion();
    case 'tpause': if (!tts) return; if (tts.paused) { tts.paused = false; ttsGo(tts.k); } else { tts.paused = true; tts.tok++; try { synth().cancel(); } catch (e2) {} ttsDock(); } return;
    case 'trate': { const rs = [0.8, 1, 1.25, 1.5, 2]; P.rate = rs[(rs.indexOf(P.rate) + 1) % rs.length]; savePrefs(); if (tts && !tts.paused) ttsGo(tts.k); else ttsDock(); return; }
    case 'tstop': return ttsStop();
    case 'dockx': hlEdit = null; return hideDock();
    case 'finyes': { const b = curBook(); if (b) { API.markRead(b); toast(T('markedRead')); } return hideDock(); }
    case 'finish': return askFinish(true);
    case 'hl': return addHl(x.dataset.c, '');
    case 'hlc': { const b = curBook(); if (hlEdit) { hlEdit.c = x.dataset.c; try { save(); } catch (e2) {} repaintHl(); openHlEditor(hlEdit.id); } return; }
    case 'hldel': { const b = curBook(); if (hlEdit) { b.hl = b.hl.filter(h => h !== hlEdit); if (!b.hl.length) delete b.hl; try { save(); } catch (e2) {} hlEdit = null; hideDock(); repaintHl(); } return; }
    case 'hlnote': {
      if (hlEdit) { const h = hlEdit; return noteSheet(v => { if (v) h.n = v; else delete h.n; try { save(); } catch (e2) {} repaintHl(); openHlEditor(h.id); }, h.n || '', h.n ? () => { delete h.n; try { save(); } catch (e2) {} repaintHl(); } : null); }
      if (selInfo) { const keep = selInfo; return noteSheet(v => { selInfo = keep; addHl('y', v); }, ''); }
      return;
    }
    case 'relink': { const b = curBook(); return API.relink(b).then(ok => { if (ok) open(curBook()); }); }
    case 'dict': return dictionary();
    case 'copy': return copySel();
  }
}
async function showAtOffset(i, off) {
  await show(i);
  const len = Math.max(1, (colEl.textContent || '').length);
  gotoFrac(off / len);
}
/* El diccionario es el del teléfono: se le pasa la palabra por el menú de compartir
   (muchas apps de diccionario y traducción aparecen ahí) y, si no se puede, se copia. */
async function dictionary() {
  const so = selInfo; if (!so) return;
  const word = so.q.replace(/^[\W_]+|[\W_]+$/g, '');
  try {
    if (API.CAP && API.CAP.Share) { await API.CAP.Share.share({ text: word, dialogTitle: T('dict') }); return; }
    if (navigator.share) { await navigator.share({ text: word }); return; }
  } catch (e) { if (/cancel|abort/i.test(String(e && (e.message || e.name)))) return; }
  copyText(word);
}
function copyText(s) {
  try { navigator.clipboard.writeText(s).then(() => toast(T('copied'))); }
  catch (e) { try { document.execCommand('copy'); toast(T('copied')); } catch (e2) {} }
}
function copySel() { if (selInfo) copyText(selInfo.q); }

const onKey = e => {
  if (!el || !el.classList.contains('on')) return;
  if (panelEl.classList.contains('on')) { if (e.key === 'Escape') closePanel(); return; }
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
};

/* mientras el lector está abierto, la lista de atrás no se desplaza
   (si no, al arrastrar en vertical se movía la página de debajo sin motivo) */
let pageY = 0;
function lockPage(on) {
  const h = document.documentElement;
  try {
    if (on) { pageY = window.scrollY || h.scrollTop || 0; h.classList.add('lx-open'); }
    else if (h.classList.contains('lx-open')) { h.classList.remove('lx-open'); window.scrollTo(0, pageY); }
  } catch (e) {}
}
function close() {
  clearTimeout(posT);
  lockPage(false);
  ttsStop();
  if (bk) writePos();
  closePanel(); hideMenu(); hideDock();
  el.classList.remove('on');
  document.removeEventListener('keydown', onKey);
  setTimeout(() => {
    urlCache.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    urlCache.clear();
    const c = colEl; if (c) c.innerHTML = '';
    curlDrop();
    bk = null; bks = [null, null]; cur = null; chapHtml = '';
  }, 300);
}

/* si el archivo no se puede abrir: aviso y, si el enlace se perdió, botón para elegirlo otra vez */
function loadErr(e) {
  const gone = /gone/.test(String(e && e.message)), ld = loadEl;
  ld.hidden = false;
  ld.innerHTML = `<div>${esc(gone ? t('fileGone') : t('lxBad'))}${gone && API.relink ? `<br><button type="button" class="lx-dbtn pri" data-x="relink" style="margin-top:14px">${esc(T('relink'))}</button>` : ''}</div>`;
}

/* ---------- entrada pública ---------- */
async function open(b) {
  if (!el) build();
  cur = b.id;
  const p0 = b.pos && typeof b.pos.i === 'number' ? b.pos : { i: 0, p: 0 };
  ver = p0.v === 1 && b.file2 ? 1 : 0;
  bks = [null, null]; selInfo = null; hlEdit = null; finAsked = false;
  applyPrefs();
  titleEl.textContent = b.title || '';
  colEl.innerHTML = '';
  loadEl.hidden = false;
  loadEl.textContent = t('lxLoading');
  el.classList.add('on');
  lockPage(true);
  document.addEventListener('keydown', onKey);
  try { bks[ver] = await openEpub(await FS.get(ver ? b.file2 : b.file)); bk = bks[ver]; }
  catch (e) {
    if (ver === 1) { ver = 0; try { bks[0] = await openEpub(await FS.get(b.file)); bk = bks[0]; } catch (e2) { loadErr(e2); return; } }
    else { loadErr(e); return; }
  }
  loadEl.hidden = true;
  paintLang();
  await show(Math.min(p0.i, bk.spine.length - 1), { pct: p0.p || 0 });
}

window.__LECTOR__ = { open, close, isOpen: () => !!(el && el.classList.contains('on')) };
})();
