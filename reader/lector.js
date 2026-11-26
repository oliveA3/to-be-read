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
const SVG = (d, w) => `<svg width="${w || 21}" height="${w || 21}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  back: SVG('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  toc:  SVG('<path d="M3 6h11M3 12h11M3 18h11"/><circle cx="19" cy="6" r=".9" fill="currentColor"/><circle cx="19" cy="12" r=".9" fill="currentColor"/><circle cx="19" cy="18" r=".9" fill="currentColor"/>'),
  find: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  findbk: SVG('<path d="M2.5 9.5c2.1-.9 4.4-.9 6.3.4V21c-1.9-1.2-4.2-1.2-6.3-.3z"/><path d="M8.8 9.9c1.9-1.3 4.1-1.4 6-.6V20c-2-.8-4.1-.7-6 .9"/><circle cx="16" cy="8" r="4.3" fill="var(--lx-bar,#fff)"/><path d="M19.2 11.2l3 3"/>', 20),
  aa:   SVG('<path d="M3 6c2.6-1 5.4-1 8 .6V20c-2.6-1.6-5.4-1.6-8-.6z"/><path d="M11 6.6c2-1.2 4-1.4 6-.9"/><path d="M20.5 9.5l-7.7 7.7-3 .6.6-3 7.7-7.7a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2z" fill="var(--lx-bar,#fff)"/><path d="M17.4 8.6l2.1 2.1"/>'),
  rot:  SVG('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 9a8 8 0 0 1 3-4M21 15a8 8 0 0 1-3 4"/>'),
  bm:   SVG('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
  chk: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18),
  chev: SVG('<path d="M9 6l6 6-6 6"/>', 16),
  dl: SVG('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', 18),
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
    swapHere: 'Cambiar de versión desde aquí', addWidget: 'Añadir widget al escritorio', widgetAsk: 'Confirma en el cuadro de Android para colocarlo', widgetNo: 'Tu pantalla de inicio no permite añadirlo sola. Añade el widget «To be read» desde la lista de widgets y mostrará este libro', widgetBad: 'No se pudo crear el widget', qcard: 'Tarjeta', qMeta: 'Mostrar título y autor', qShare: 'Compartir', qSave: 'Guardar', qSaved: 'Imagen guardada en Descargas', qBad: 'No se pudo crear la imagen', markAs: 'Marcar como…', stUnread: 'Por leer', stReading: 'Leyendo', stRead: 'Leído', stDropped: 'Abandonado', markedAs: x => `Marcado como «${x}»`, covSave: 'Guardar portada', covSaved: 'Portada guardada en Descargas', covBad: 'No se pudo guardar la portada', lxFg: 'Color de letra', lxFont: 'Tipo de letra', fgAuto: 'Del tema', lxParas: 'Párrafos', parInd: 'Con sangría', parSp: 'Separados', tr: 'Traducir', tabLooks: 'Búsquedas', noLooks: 'Aquí saldrán las palabras y frases que busques en el diccionario o traduzcas.', kD: 'Diccionario', kT: 'Traducción', noTr: 'No hay ninguna app de traducción. Texto copiado', again: 'Buscar otra vez', lxCols: 'Columnas en horizontal', colsTwo: 'Dos', colsOne: 'Una', bright: 'Brillo', brAuto: 'Auto', noDict: 'No hay ninguna app de diccionario. Palabra copiada', about: 'Acerca del documento', share: 'Compartir archivo', pageOf: (a, b) => `${a} de ${b}`, orient: 'Girar pantalla', needApk: 'Esto necesita la última versión de la app (instala el APK nuevo)', shareBad: 'No se pudo compartir el archivo',
    aTitle: 'Título', aAuthor: 'Autor', aPub: 'Editorial', aLang: 'Idioma', aDate: 'Fecha', aId: 'Identificador', aSubj: 'Temas', aDesc: 'Descripción', aRights: 'Derechos', aVer: 'Versión de EPUB', aCh: 'Capítulos', aFile: 'Archivo', aSize: 'Tamaño', aNone: 'Este archivo no trae datos', addVer: 'Añadir otra versión (bilingüe)', delVer: 'Quitar la segunda versión',
    verPrep: 'Preparando las dos versiones…', verAdded: 'Versión añadida. Toca ES/EN para cambiar',
    verBad: 'No pude leer ese epub', verDel: 'Segunda versión quitada', verAsk: 'Elige el mismo libro en otro idioma',
    note: 'Nota', notePh: 'Escribe una nota…', save: 'Guardar', del: 'Eliminar', edit: 'Editar',
    dict: 'Diccionario', copy: 'Copiar', copied: 'Copiado', hlDel: 'Quitar',
    c_y: 'Amarillo', c_g: 'Verde', c_b: 'Azul', c_p: 'Rosa',
    relink: 'Elegir el archivo otra vez', finished: 'Llegaste al final del libro', markRead: 'Marcar como leído', notNow: 'Ahora no', finT: '¡Felicidades!', finSub: 'Terminaste este libro', finTime: 'Tiempo leído', finDaysAll: 'Días en total', finDaysRd: 'Días leyendo', finHl: 'Subrayados', finRate: 'Tu valoración', finNotePh: 'Un comentario sobre el libro (opcional)', finDone: 'Listo', finHr: 'h', finLess: '<1 min', schT: 'Modo según la hora', schOff: 'Apagado', schSys: 'Del sistema', schTime: 'Horario', schFrom: 'De noche, desde / hasta', schNight: 'Tema de noche', schBr: 'Brillo de noche', schNoBr: 'sin cambios', schHint: 'De día vuelve a tu tema y brillo de siempre.', srPrev: 'Resultado anterior', srNext: 'Resultado siguiente', srList: 'Volver a la lista de resultados', srExit: 'Salir de la búsqueda', markedRead: 'Marcado como leído', prevCh: 'Capítulo anterior', nextCh: 'Capítulo siguiente', speed: 'Velocidad', speaking: 'Leyendo en voz alta',
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
    swapHere: 'Switch version from here', addWidget: 'Add widget to home screen', widgetAsk: 'Confirm in the Android dialog to place it', widgetNo: 'Your home screen can’t add it automatically. Add the “To be read” widget from the widget list and it will show this book', widgetBad: 'Couldn’t create the widget', qcard: 'Card', qMeta: 'Show title and author', qShare: 'Share', qSave: 'Save', qSaved: 'Image saved to Downloads', qBad: 'Couldn’t create the image', markAs: 'Mark as…', stUnread: 'To read', stReading: 'Reading', stRead: 'Read', stDropped: 'Dropped', markedAs: x => `Marked as “${x}”`, covSave: 'Save cover', covSaved: 'Cover saved to Downloads', covBad: 'Couldn’t save the cover', lxFg: 'Text colour', lxFont: 'Font', fgAuto: 'From theme', lxParas: 'Paragraphs', parInd: 'Indented', parSp: 'Spaced', tr: 'Translate', tabLooks: 'Lookups', noLooks: 'Words and phrases you look up in the dictionary or translate will show up here.', kD: 'Dictionary', kT: 'Translation', noTr: 'No translator app found. Text copied', again: 'Look up again', lxCols: 'Columns in landscape', colsTwo: 'Two', colsOne: 'One', bright: 'Brightness', brAuto: 'Auto', noDict: 'No dictionary app found. Word copied', about: 'About document', share: 'Share file', pageOf: (a, b) => `${a} of ${b}`, orient: 'Rotate screen', needApk: 'This needs the latest app version (install the new APK)', shareBad: 'Could not share the file',
    aTitle: 'Title', aAuthor: 'Author', aPub: 'Publisher', aLang: 'Language', aDate: 'Date', aId: 'Identifier', aSubj: 'Subjects', aDesc: 'Description', aRights: 'Rights', aVer: 'EPUB version', aCh: 'Chapters', aFile: 'File', aSize: 'Size', aNone: 'This file has no data', addVer: 'Add another version (bilingual)', delVer: 'Remove the second version',
    verPrep: 'Preparing both versions…', verAdded: 'Version added. Tap ES/EN to switch',
    verBad: 'Couldn’t read that epub', verDel: 'Second version removed', verAsk: 'Pick the same book in another language',
    note: 'Note', notePh: 'Write a note…', save: 'Save', del: 'Delete', edit: 'Edit',
    dict: 'Dictionary', copy: 'Copy', copied: 'Copied', hlDel: 'Remove',
    c_y: 'Yellow', c_g: 'Green', c_b: 'Blue', c_p: 'Pink',
    relink: 'Pick the file again', finished: 'You reached the end of the book', markRead: 'Mark as read', notNow: 'Not now', finT: 'Congratulations!', finSub: 'You finished this book', finTime: 'Time read', finDaysAll: 'Days in total', finDaysRd: 'Days reading', finHl: 'Highlights', finRate: 'Your rating', finNotePh: 'A comment about the book (optional)', finDone: 'Done', finHr: 'h', finLess: '<1 min', schT: 'Mode by time of day', schOff: 'Off', schSys: 'System', schTime: 'Schedule', schFrom: 'Night, from / to', schNight: 'Night theme', schBr: 'Night brightness', schNoBr: 'unchanged', schHint: 'By day it goes back to your usual theme and brightness.', srPrev: 'Previous result', srNext: 'Next result', srList: 'Back to the results list', srExit: 'Leave search', markedRead: 'Marked as read', prevCh: 'Previous chapter', nextCh: 'Next chapter', speed: 'Speed', speaking: 'Reading aloud',
    ver: n => n === 0 ? 'Version 1' : 'Version 2',
  }
};
const isEn = () => { try { return API.I18N && API.I18N.en && API.I18N.en.back === t('back') && API.I18N.es.back !== t('back'); } catch (e) { return false; } };
const T = (k, ...a) => {
  const v = X[isEn() ? 'en' : 'es'][k];
  if (v === undefined) return t(k, ...a);
  return typeof v === 'function' ? v(...a) : v;
};

const DEF = { theme:'light', fs:18, lh:1.55, pad:22, anim:'slide', dim:0, mode:'page', rate:1, cols:2, bright:null, paras:'indent', fg:'', font:'serif', sch:'off', schA:'20:00', schB:'07:00', schTh:'dark', schBr:25, schS:'', dayTh:'', dayBr:null };
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
  /* portada: la que declara el OPF (epub2: meta cover; epub3: cover-image) o, si no, una imagen que se llame "cover" */
  let coverIt = null;
  try {
    const cm = [...opf.getElementsByTagName('meta')].find(m => m.getAttribute('name') === 'cover');
    coverIt = cm && man.get(cm.getAttribute('content'));
    if (!coverIt || !/image/.test(coverIt.type)) coverIt = [...man.values()].find(x => /cover-image/.test(x.props));
    if (!coverIt) coverIt = [...man.values()].find(x => /image/.test(x.type) && /cover|portada/i.test(x.href));
  } catch (e) { coverIt = null; }

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
  toc.forEach(x => { if (junkLabel(x.label)) x.junk = true; });

  const all = n => [...opf.getElementsByTagNameNS('*', n)].map(e => e.textContent.trim()).filter(Boolean);
  /* tamaño de cada hoja del lomo: sirve para repartir el progreso del libro (si no se sabe, todas pesan igual) */
  const w = spine.map(sp => { try { const f = zip.file(sp.href); const n = f && f._data && f._data.uncompressedSize; return n > 0 ? n : 1; } catch (e) { return 1; } });
  const meta = {
    title: gmeta('title'), creators: all('creator'), publisher: gmeta('publisher'), date: gmeta('date'),
    ids: all('identifier'), description: gmeta('description'), subjects: all('subject'), rights: gmeta('rights'),
    lang: all('language')[0] || '', version: (opf.documentElement && opf.documentElement.getAttribute('version')) || ''
  };
  return { zip, spine, toc, w, meta, size: blob && blob.size || 0, cover: coverIt || null, title: gmeta('title'), lang: (gmeta('language') || '').slice(0, 2).toLowerCase(), grab,
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
  body.querySelectorAll('script,style,link,iframe,object,embed,audio,video,form,input,button,noscript,template').forEach(n => n.remove());
  /* lo que el libro esconde (hidden, display:none) también se quita: al no cargar sus estilos, saldría a la vista
     (típico: la misma portada otra vez en pequeño, o un marcador para lectores antiguos) */
  body.querySelectorAll('[hidden],[style]').forEach(n => {
    if (n.hasAttribute('hidden') || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(n.getAttribute('style') || '')) n.remove();
  });
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
      if (im.tagName.toLowerCase() === 'image') { im.removeAttribute('xlink:href'); im.setAttribute('href', u); }
      else { im.setAttribute('src', u); im.removeAttribute('xlink:href'); im.removeAttribute('href'); im.removeAttribute('srcset'); }
    } catch (e) { im.remove(); }
  }
  /* la misma imagen dos veces seguidas, sin texto en medio (grande y otra vez pequeña debajo): se deja una sola */
  const seen = [...body.querySelectorAll('img,image')].filter(x => x.isConnected);
  let prev = null;
  for (const im of seen) {
    const u = im.getAttribute('src') || im.getAttribute('href');
    if (prev && prev.u === u && im.isConnected && prev.el.isConnected) {
      let gap = '';
      try { const r = body.ownerDocument.createRange(); r.setStartAfter(prev.el); r.setEndBefore(im); gap = r.toString().replace(/\s|&nbsp;|\u00a0/g, ''); } catch (e) { gap = 'x'; }
      if (!gap) {
        let rm = im;
        while (rm.parentElement && rm.parentElement !== body && !rm.parentElement.contains(prev.el) && rm.parentElement.children.length === 1 && !rm.parentElement.textContent.trim()) rm = rm.parentElement;
        const svg = im.closest('svg');
        if (svg && !svg.contains(prev.el) && svg.querySelectorAll('image').length === 1) rm = svg.parentElement && svg.parentElement !== body && !svg.parentElement.contains(prev.el) && svg.parentElement.children.length === 1 && !svg.parentElement.textContent.trim() ? svg.parentElement : svg;
        rm.remove(); continue;
      }
    }
    prev = { u, el: im };
  }
  body.querySelectorAll('a').forEach(a => a.removeAttribute('href'));
  return body.innerHTML;
}

/* ---------- estado ---------- */
let el = null, bk = null, bks = [null, null], ver = 0, cur = null, si = 0, page = 0, pages = 1;
let busy = false, curling = false, searchTok = 0, sr = null, lastS = null, srEl = null, srHl = false, chapHtml = '', selInfo = null, hlEdit = null, finAsked = false;
/* referencias fijas: se buscan una sola vez al construir la vista, no en cada cuadro */
let wrapEl, moveEl, colEl, dimEl, loadEl, panelEl, authEl, chapEl, pgEl, pctEl, trkEl, segsEl, dotEl, dockEl, menuEl, titleEl, bmEl, ribEl, langEl, navEl, cvEl, cviEl, csEl, flapEl, flapIn, fshEl;
let trkW = 0, fadeA = null;

const curBook = () => book(cur);
const hasContent = h => /<(img|image|svg|video|table|hr)\b/i.test(h) || h.replace(/<[^>]*>/g, '').replace(/&nbsp;|\s/g, '').length > 3;
let openedAt = 0, uiWas = false;
const verOf = x => x.v === 1 ? 1 : 0;

/* ---------- la vista ---------- */
function build() {
  el = document.createElement('div');
  el.className = 'lx';
  el.innerHTML = `
    <div class="lx-bar">
      <button type="button" class="lx-ico" data-x="close" aria-label="${esc(t('back'))}">${I.back}</button>
      <div class="lx-t"><b id="lxTitle"></b><small id="lxAuthor"></small><small id="lxChap"></small></div>
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
      <div class="lx-csh" id="lxCs"></div>
      <div class="lx-cv" id="lxCv"><div class="lx-cvi" id="lxCvi"></div></div>
      <div class="lx-cf" id="lxCf"><div class="lx-cfi" id="lxCfi"><i class="lx-fsh" id="lxFsh"></i></div></div>
      <div class="lx-dim" id="lxDim"></div>
      <div class="lx-load" id="lxLoad">${esc(t('lxLoading'))}</div>
      <div class="lx-bpill" id="lxBpill"></div>
    </div>
    <button type="button" class="lx-lang" id="lxLang" data-x="lang" hidden></button>
    <div class="lx-srb" id="lxSr" hidden>
      <button type="button" class="lx-ico" data-x="srprev" aria-label="${esc(T('srPrev'))}">${SVG('<path d="M15 6l-6 6 6 6"/>', 22)}</button>
      <span class="lx-srn" id="lxSrN"></span>
      <button type="button" class="lx-ico" data-x="srnext" aria-label="${esc(T('srNext'))}">${SVG('<path d="M9 6l6 6-6 6"/>', 22)}</button>
      <button type="button" class="lx-ico" data-x="srlist" aria-label="${esc(T('srList'))}">${I.findbk}</button>
      <button type="button" class="lx-ico" data-x="srx" aria-label="${esc(T('srExit'))}">${I.x}</button>
    </div>
    <div class="lx-dock" id="lxDock"></div>
    <div class="lx-foot">
      <div class="lx-fi"><span id="lxPg"></span><span class="lx-sep">·</span><span id="lxPct"></span>
        <button type="button" class="lx-ico lx-orient" data-x="orient" aria-label="${esc(T('orient'))}">${I.rot}</button></div>
      <div class="lx-trk" id="lxTrk"><span class="lx-segs" id="lxSegs"></span><b id="lxDot"></b></div>
    </div>
    <div class="lx-menu" id="lxMenu"></div>
    <div class="lx-panel" id="lxP"></div>`;
  document.body.appendChild(el);
  wrapEl = $('#lxWrap', el); moveEl = $('#lxMove', el); colEl = $('#lxCol', el);
  dimEl = $('#lxDim', el); loadEl = $('#lxLoad', el); panelEl = $('#lxP', el);
  authEl = $('#lxAuthor', el); chapEl = $('#lxChap', el); pgEl = $('#lxPg', el); pctEl = $('#lxPct', el);
  trkEl = $('#lxTrk', el); segsEl = $('#lxSegs', el); dotEl = $('#lxDot', el); wireTrack();
  dockEl = $('#lxDock', el); menuEl = $('#lxMenu', el); titleEl = $('#lxTitle', el);
  bmEl = $('#lxBm', el); ribEl = $('#lxRib', el); langEl = $('#lxLang', el); srEl = $('#lxSr', el);
  navEl = $('#lxNav', el); cvEl = $('#lxCv', el); cviEl = $('#lxCvi', el); csEl = $('#lxCs', el); flapEl = $('#lxCf', el); flapIn = $('#lxCfi', el); fshEl = $('#lxFsh', el);
  el.addEventListener('click', onTap);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && el.classList.contains('on')) { schTick(); rtLast = Date.now(); } });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (P.sch === 'sys' && el.classList.contains('on')) schTick(); }); } catch (e) {}
  document.addEventListener('visibilitychange', () => { if (document.hidden && el.classList.contains('on') && bk) { clearTimeout(posT); writePos(); } });

  const w = wrapEl;
  /* tocar a los lados pasa página; mantener pulsado selecciona texto (no hay capas encima) */
  w.addEventListener('click', e => {
    const hm = e.target.closest && e.target.closest('mark.lx-hl');
    if (hm && !hasSel()) { openHlEditor(hm.dataset.id); return; }
    if (hasSel()) return;
    if (performance.now() - openedAt < 500) return;
    hideDock();
    if (e.target.closest('[data-x]')) return;
    /* toda la pantalla es el libro; las barras salen al tocar el centro (o en cualquier parte si es desplazar) */
    if (P.mode === 'scroll') { toggleUi(); return; }
    const r = w.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    tapY = e.clientY - r.top;
    if (x < 0.3) go(-1); else if (x > 0.7) go(1); else toggleUi();
    tapY = null;
  });
  /* deslizar para pasar página. Con "pasar hoja" la hoja sigue al dedo mientras arrastras */
  let x0 = null, y0 = null, lx = 0, lt = 0, vx = 0, drag = false, bz = null, sd = null;
  w.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { if (drag) { drag = false; curlSettle(false); } if (sd) slideEnd(0, true); x0 = null; return; }
    const tch = e.touches[0]; x0 = tch.clientX; y0 = tch.clientY; lx = x0; lt = performance.now(); vx = 0; drag = false;
    bz = null;
  }, { passive: true });
  w.addEventListener('touchmove', e => {
    if (x0 == null) return;
    /* brillo: deslizar arriba/abajo por el lado izquierdo (en modo páginas) */
    if (P.mode !== 'scroll' && !drag && !hasSel()) {
      const tch = e.touches[0], dy = tch.clientY - y0, dx = tch.clientX - x0;
      if (!bz && x0 - w.getBoundingClientRect().left < w.clientWidth * 0.22 && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        bz = { v0: brightNow(), y0: tch.clientY }; hideUi();
      }
      if (bz) { setBright(Math.max(0.02, Math.min(1, bz.v0 - (tch.clientY - bz.y0) / (w.clientHeight * 0.8))), true); return; }
    }
    if (P.mode === 'scroll' || hasSel() || (P.anim !== 'curl' && P.anim !== 'slide')) return;
    const tch = e.touches[0], dx = tch.clientX - x0, dy = tch.clientY - y0, now = performance.now();
    vx = (tch.clientX - lx) / Math.max(1, now - lt) * 0.6 + vx * 0.4; lx = tch.clientX; lt = now;
    /* "deslizar": la página sigue al dedo; al soltar se completa o vuelve */
    if (P.anim === 'slide') {
      if (!sd) {
        if (busy || curling || Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        ttsStop(); hideUi();
        let b0 = -page * wrapEl.clientWidth;
        try { const m = new DOMMatrix(getComputedStyle(moveEl).transform); if (isFinite(m.m41)) b0 = m.m41; } catch (e2) {}
        sd = { b: b0, w: wrapEl.clientWidth };
        moveEl.style.transition = 'none';
      }
      const d = dx < 0 ? 1 : -1, n = page + d;
      moveEl.style.transform = `translate3d(${(sd.b + ((n < 0 || n >= pages) ? dx * 0.3 : dx)).toFixed(1)}px,0,0)`;
      return;
    }
    if (!drag) {
      if (busy || Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      const d = dx < 0 ? 1 : -1, n = page + d;
      if (n < 0 || n >= pages) return;            /* al cambiar de capítulo se usa el gesto normal al soltar */
      ttsStop(); hideUi();
      if (!curlBegin(d, n, y0 - w.getBoundingClientRect().top)) return;
      drag = true;
    }
    curlDragMove(dx, dy);
  }, { passive: true });
  w.addEventListener('touchcancel', () => { if (drag) { drag = false; curlSettle(false); } if (sd) slideEnd(0, true); if (bz) { bz = null; savePrefs(); } x0 = null; }, { passive: true });
  w.addEventListener('touchend', e => {
    if (x0 == null) return;
    if (bz) { bz = null; x0 = null; savePrefs(); return; }
    const tch = e.changedTouches[0], dx = tch.clientX - x0, dy = tch.clientY - y0;
    x0 = null;
    if (sd) { slideEnd(dx, false, vx); return; }
    if (drag) {
      drag = false;
      const g = cg;
      if (g) { const pr = curlProg(g); curlSettle(pr > 0.2 || (pr > 0.03 && Math.abs(vx) > 0.45 && (vx < 0) === (g.d > 0))); }
      return;
    }
    if (P.mode === 'scroll' || hasSel()) return;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6) { dx < 0 ? go(1) : go(-1); }
  }, { passive: true });
  /* suelta la página arrastrada: si pasó de cierta distancia (o fue un gesto rápido) se completa con la animación normal; si no, vuelve */
  function slideEnd(dx, cancel, v) {
    const s = sd; sd = null; if (!s) return;
    const base = -page * wrapEl.clientWidth, d = dx < 0 ? 1 : -1, n = page + d;
    moveEl.style.transition = '';
    if (!cancel && n >= 0 && n < pages && (Math.abs(dx) > s.w * 0.18 || (Math.abs(v || 0) > 0.4 && Math.abs(dx) > 12 && (v < 0) === (d > 0)))) { go(d, true); return; }
    if (!cancel && (n < 0 || n >= pages) && Math.abs(dx) > 48) {
      /* en el borde del capítulo: se deja la página en su sitio y sigue el cambio de capítulo normal */
      moveEl.style.transition = 'none'; moveEl.style.transform = `translate3d(${base}px,0,0)`; void moveEl.offsetWidth; moveEl.style.transition = '';
      go(d); return;
    }
    moveEl.style.transform = `translate3d(${base}px,0,0)`;
  }
  /* modo desplazar: el avance se calcula al mover el scroll */
  let raf = 0;
  w.addEventListener('scroll', () => {
    if (P.mode !== 'scroll' || raf) return;
    hideUi();
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
  try { if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if (el && el.classList.contains('on') && bk && !busy) { ensureOff(); relayout(true); } }); } catch (e) {}
}

/* barras superior e inferior: ocultas mientras lees */
const toggleUi = () => { if (!el) return; const on = el.classList.toggle('ui'); if (on) { trkW = trkEl.clientWidth || trkW; showProgress(gdone()); } };
const hideUi = () => { if (el && el.classList.contains('ui')) el.classList.remove('ui'); };

const hasSel = () => { const s = getSelection(); return !!(s && !s.isCollapsed && s.toString().trim()); };

function applyPrefs() {
  el.dataset.theme = P.theme;
  ['slide', 'fade', 'curl'].forEach(a => el.classList.toggle('lx-anim-' + a, P.anim === a));
  wrapEl.classList.toggle('lx-scrollmode', P.mode === 'scroll');
  const c = colEl;
  c.style.setProperty('--lx-fs', P.fs + 'px');
  c.style.setProperty('--lx-lh', P.lh);
  c.style.setProperty('--lx-pad', P.pad + 'px');
  c.classList.toggle('lx-sp', P.paras === 'spaced');
  c.style.setProperty('--lx-font', FONTS[P.font] || FONTS.serif);
  if (P.fg) c.style.setProperty('--lx-text', P.fg); else c.style.removeProperty('--lx-text');
  dimEl.style.opacity = !nativeBr() && P.bright != null ? (1 - P.bright) * 0.75 : 0;
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
/* Holgura (px) del alto útil: los renglones se colocan con decimales y, tras muchos, el redondeo puede
   sumar algún píxel; sin esto el último renglón saltaría a la página siguiente y quedaría un hueco. */
const SLACK = 3;
/* Las imágenes ocupan un número entero de renglones (con el hueco repartido arriba y abajo).
   Si no, todo lo que va después en esa página queda descuadrado; y una imagen a la que no le cabe
   el margen se "parte" entre dos páginas y parece que sale doble. */
function snapImgs(lhp, ch) {
  const ims = [...colEl.querySelectorAll('img,svg')].filter(x => x.tagName.toLowerCase() === 'svg' || !x.closest('svg'));
  ims.forEach(x => { x.style.marginTop = ''; x.style.marginBottom = ''; });
  if (!lhp || !ims.length) return;
  const hs = ims.map(x => x.getBoundingClientRect().height);
  ims.forEach((x, k) => {
    const h = hs[k];
    if (!(h > 0)) return;
    let tot = Math.ceil(h / lhp - 0.02) * lhp;
    if (tot > ch) tot = h;               /* la imagen llena la página: sin márgenes */
    const ex = Math.max(0, tot - h);
    x.style.marginTop = (ex / 2) + 'px'; x.style.marginBottom = (ex / 2) + 'px';
  });
}
/* Algunos epub traen la misma ilustración dos veces seguidas (grande y pequeña, o la portada repetida).
   Se ven las dos porque el lector no carga los estilos del libro, que escondían una. Como pueden ser
   archivos distintos con el mismo dibujo, no basta comparar el nombre: se comparan las imágenes de
   verdad, reducidas a 8x8 en blanco y negro, y si son la misma se deja solo la grande. */
const AH = new Map();
function aHash(im) {
  const k = im.currentSrc || im.src || '';
  if (k && AH.has(k)) return AH.get(k);
  let h = null;
  try {
    const n = 8, cv = document.createElement('canvas');
    cv.width = n; cv.height = n;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(im, 0, 0, n, n);
    const d = c.getImageData(0, 0, n, n).data, g = [];
    for (let i = 0; i < n * n; i++) {
      const al = d[i * 4 + 3] / 255;
      /* lo transparente cuenta como blanco: si no, dos dibujos distintos con fondo claro se parecerían */
      const v = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) * al + 255 * (1 - al);
      g.push(v);
    }
    /* el corte es el valor de en medio (no la media): en un dibujo a línea sobre blanco la media
       se va hacia el blanco y la huella sale casi vacía */
    const so = g.slice().sort((a, z) => a - z), mid = (so[31] + so[32]) / 2;
    h = g.map(v => v > mid ? 1 : 0);
    /* una imagen casi lisa (un color de fondo) se parecería a cualquier otra: no sirve para comparar */
    if (so[63] - so[0] < 25) h = null;
  } catch (e) { h = null; }
  if (k) AH.set(k, h);
  return h;
}
const hDist = (a, z) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== z[i]) n++; return n; };
/* ¿hay texto de verdad entre estas dos imágenes? */
function textBetween(a, z) {
  try { const r = document.createRange(); r.setStartAfter(a); r.setEndBefore(z); return !!r.toString().replace(/[\s ]/g, ''); }
  catch (e) { return true; }
}
/* la imagen y, si está sola dentro, su envoltorio (para no dejar un hueco en blanco) */
function dropImg(im) {
  let rm = im;
  while (rm.parentElement && rm.parentElement !== colEl && rm.parentElement.children.length === 1 && !rm.parentElement.textContent.trim()) rm = rm.parentElement;
  rm.remove();
}
let twins = null;
const imgsOf = root => [...root.querySelectorAll('img')];
/* se busca una vez por capítulo (ya cargadas las imágenes) y se recuerda cuáles sobran */
function findTwins() {
  const ims = imgsOf(colEl);
  twins = new Set();
  for (let i = 0; i + 1 < ims.length; i++) {
    const a = ims[i], b = ims[i + 1];
    if (!a.isConnected || !b.isConnected) continue;
    if (!a.naturalWidth || !b.naturalWidth) continue;
    if (textBetween(a, b)) continue;
    const ra = a.naturalWidth / a.naturalHeight, rb = b.naturalWidth / b.naturalHeight;
    if (Math.abs(ra - rb) > Math.max(ra, rb) * 0.08) continue;
    const ha = aHash(a), hb = aHash(b);
    if (!ha || !hb || hDist(ha, hb) > 10) continue;
    /* se queda la de más resolución */
    const small = a.naturalWidth * a.naturalHeight >= b.naturalWidth * b.naturalHeight ? i + 1 : i;
    twins.add(small);
  }
  applyTwins();
}
function applyTwins() {
  if (!twins || !twins.size) return;
  imgsOf(colEl).forEach((im, i) => { if (twins.has(i)) dropImg(im); });
}
function relayout(keepPct) {
  if (!el || !cur || !bk) return;
  /* solo se corta una animación de capítulo si el relayout viene de fuera (girar, ajustes),
     no del propio show() que está cargando el capítulo nuevo debajo de la foto */
  if (chapDone && !busy) chapDone();
  curlDrop();
  const wrap = wrapEl, col = colEl;
  applyPrefs();
  if (P.mode === 'scroll') {
    const f = keepPct === true ? frac() : null;
    col.style.width = ''; col.style.columnWidth = ''; col.style.columnCount = ''; col.style.paddingBottom = ''; col.style.removeProperty('--lx-ch');
    snapImgs(0, 0);
    pages = 1; page = 0; colsNow = 1;
    moveEl.style.transform = '';
    if (f != null) wrap.scrollTop = f * wrap.scrollHeight;
    paint();
    return;
  }
  trkW = dotEl.parentElement.clientWidth;
  const w = wrap.clientWidth, gap = P.pad * 2;
  const off = keepPct === true ? curOff : null;
  const pct = keepPct === true && pages > 1 ? page / pages : null;
  /* en horizontal se parte en dos columnas (cada "página" es un par); el hueco entre columnas es el mismo que entre páginas */
  const two = String(P.cols) !== '1' && w > wrap.clientHeight && w >= 560;
  col.style.setProperty('--lx-gap', gap + 'px');
  col.style.width = w + 'px';
  colsNow = two ? 2 : 1;
  if (two) { col.style.columnCount = '2'; col.style.columnWidth = 'auto'; }
  else { col.style.columnCount = 'auto'; col.style.columnWidth = w - (P.pad * 2) + 'px'; }
  /* el alto útil se ajusta a un número entero de renglones: si sobra casi un renglón abajo, se aprovecha */
  col.style.paddingBottom = '';
  let cs = getComputedStyle(col);
  const lhp = parseFloat(cs.lineHeight) || P.fs * P.lh, pb = parseFloat(cs.paddingBottom);
  const avail = wrap.clientHeight - parseFloat(cs.paddingTop) - pb, res = avail - Math.floor(avail / lhp) * lhp;
  /* el alto útil se deja en un número EXACTO de renglones: si no, los decimales se acumulan y unas
     páginas entran un renglón más que otras. Si abajo sobra casi un renglón entero, se aprovecha. */
  if (res > 0.05) {
    const up = res > lhp * 0.7 && pb - (lhp - res) >= 26;
    /* medio píxel de más: justo lo que falta para que el último renglón no se vaya a la página siguiente */
    col.style.paddingBottom = Math.max(0, pb + (up ? res - lhp : res) - SLACK) + 'px';
  }
  cs = getComputedStyle(col);
  const chpx = Math.max(80, wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom));
  col.style.setProperty('--lx-ch', chpx + 'px');
  snapImgs(lhp, chpx - SLACK);
  pages = Math.max(1, Math.round((col.scrollWidth + P.pad) / w));
  if (off != null) { const pg = pageOfOff(off); page = pg != null ? pg : Math.min(pages - 1, Math.round((pct || 0) * pages)); }
  else if (pct != null) page = Math.min(pages - 1, Math.round(pct * pages));
  page = Math.max(0, Math.min(page, pages - 1));
  paint();
  curlWarm();
}
let lastBm = null, drag = null, curOff = null, anchorT = 0;
const ensureOff = () => { if (curOff == null) curOff = anchorOff(); };
/* posición (en caracteres) de lo primero que se lee en pantalla: sobrevive a cambios de letra, giro o imágenes que cargan */
/* Ancla de la página: cuántos caracteres del capítulo hay antes del primero que se ve.
   Se calcula con la posición de cada texto DENTRO de la columna (no con lo que hay bajo un punto de la
   pantalla), así sale bien aunque la página aún se esté deslizando o doblando. */
const pageOfRect = (r, cr, ww) => Math.floor((r.left - cr.left) / ww + 0.001);
function colTexts() {
  const out = [], w = document.createTreeWalker(colEl, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) if (n.nodeValue.length) out.push(n);
  return out;
}
function nodePages(n, cr, ww) {
  const rg = document.createRange(); rg.selectNodeContents(n);
  const rs = [...rg.getClientRects()].filter(r => r.width > 0 || r.height > 0);
  if (!rs.length) return null;
  return [pageOfRect(rs[0], cr, ww), pageOfRect(rs[rs.length - 1], cr, ww)];
}
function anchorOff() {
  if (P.mode === 'scroll' || !colEl.firstChild) return null;
  try {
    const cr = colEl.getBoundingClientRect(), ww = wrapEl.clientWidth;
    if (!ww) return null;
    if (page <= 0) return 0;
    const ns = colTexts();
    /* primer texto que acaba en esta página o más allá */
    let lo = 0, hi = ns.length - 1, at = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, pg = nodePages(ns[mid], cr, ww);
      if (pg && pg[1] >= page) { at = mid; hi = mid - 1; }
      else if (!pg) {
        /* texto sin caja (espacios entre bloques): se mira el siguiente que sí tenga */
        let k = mid + 1, q = null; while (k <= hi && !(q = nodePages(ns[k], cr, ww))) k++;
        if (q && q[1] >= page) { at = k; hi = mid - 1; } else lo = k + 1;
      } else lo = mid + 1;
    }
    if (at < 0) return null;
    let acc = 0; for (let k = 0; k < at; k++) acc += ns[k].nodeValue.length;
    const n = ns[at], len = n.nodeValue.length, rg = document.createRange();
    /* dentro del texto: primer carácter que cae en esta página */
    let a = 0, b = len - 1, first = 0;
    while (a <= b) {
      const m = (a + b) >> 1; rg.setStart(n, m); rg.setEnd(n, m + 1);
      const r = [...rg.getClientRects()].find(x => x.width > 0 || x.height > 0);
      if (r && pageOfRect(r, cr, ww) >= page) { first = m; b = m - 1; } else a = m + 1;
    }
    return acc + first;
  } catch (e) { return null; }
}
function pageOfOff(off) {
  try {
    const cr = colEl.getBoundingClientRect(), ww = wrapEl.clientWidth;
    const w = document.createTreeWalker(colEl, NodeFilter.SHOW_TEXT);
    let n, acc = 0;
    while ((n = w.nextNode())) {
      const l = n.nodeValue.length;
      if (acc + l > off || (acc + l === off && l)) {
        const rg = document.createRange(), k = Math.max(0, Math.min(l - 1, off - acc));
        rg.setStart(n, k); rg.setEnd(n, Math.min(l, k + 1));
        const r = [...rg.getClientRects()].find(x => x.width > 0 || x.height > 0);
        if (!r) { acc += l; continue; }
        return Math.max(0, Math.min(pages - 1, pageOfRect(r, cr, ww)));
      }
      acc += l;
    }
  } catch (e) {}
  return null;
}
/* progreso del libro entero: cada hoja pesa lo que ocupa; así 40% es 40% del texto y no "capítulo 3 de 8" */
function wts() {
  if (!bk.cum) { let a = 0; bk.cum = bk.w.map(n => (a += n) - n); bk.W = a || 1; }
  return bk;
}
let colsNow = 1;
const chPages = () => P.mode === 'scroll' ? Math.max(1, Math.round(wrapEl.scrollHeight / Math.max(1, wrapEl.clientHeight))) : Math.max(1, pages * colsNow);
function gdone() { wts(); return Math.min(1, (bk.cum[si] + frac() * bk.w[si]) / bk.W); }
/* páginas del libro: estimadas con cuánto texto cabe en una página con la letra elegida */
function pageEst(f) {
  wts();
  const n = chPages();
  if (n >= 3 || !bk.cpp) bk.cpp = bk.w[si] / n;
  const total = Math.max(1, Math.round(bk.W / bk.cpp));
  return { cur: Math.min(total, Math.round(f * total) + 1), total };
}
function paint() {
  if (P.mode !== 'scroll') moveEl.style.transform = `translate3d(${-page * wrapEl.clientWidth}px,0,0)`;
  if (!drag) {
    if (!trkW) trkW = trkEl.clientWidth;
    dotEl.style.transform = `translate3d(${(gdone() * trkW).toFixed(1)}px,0,0)`;
  }
  paintBm();
  /* el ancla se calcula con calma (obliga a maquetar): no en el cuadro en que se pasa la página */
  curOff = null; clearTimeout(anchorT); anchorT = setTimeout(() => { curOff = anchorOff(); }, 160);
  rtMark(); savePos();
}
/* texto y barra de capítulos (solo con las barras visibles) */
function showProgress(f) {
  const e = pageEst(f);
  pgEl.textContent = T('pageOf', e.cur, e.total);
  pctEl.textContent = Math.round(f * 100) + '%';
  paintSegs(f);
}
let segsFor = null, segNodes = [], segStart = [];
function paintSegs(f) {
  wts();
  if (segsFor !== bk) {
    segsFor = bk;
    let st = [...new Set(bk.toc.map(x => x.i))].sort((a, z) => a - z);
    if (!st.length || st[0] > 0) st.unshift(0);
    /* con muchos capítulos los tramos quedarían de un pelo: se agrupan para que se vean */
    if (st.length > 60) { const k = Math.ceil(st.length / 60); st = st.filter((_, i) => i % k === 0); }
    segStart = st;
    const W = bk.W || 1;
    segsEl.style.setProperty('--lx-sgap', (st.length > 40 ? 1 : 2) + 'px');
    segsEl.innerHTML = st.map((a, i) => {
      const z = i + 1 < st.length ? bk.cum[st[i + 1]] : bk.W, x = bk.cum[a];
      return `<i style="left:${(x / W * 100).toFixed(3)}%;width:calc(${((z - x) / W * 100).toFixed(3)}% - var(--lx-sgap))"></i>`;
    }).join('');
    segNodes = [...segsEl.children];
  }
  const pos = f * bk.W;
  segNodes.forEach((n, i) => {
    const a = bk.cum[segStart[i]], z = i + 1 < segStart.length ? bk.cum[segStart[i + 1]] : bk.W;
    if (pos >= z) { if (n.className !== 'done') { n.className = 'done'; n.style.removeProperty('--p'); } }
    else if (pos > a) { n.className = 'part'; n.style.setProperty('--p', ((pos - a) / Math.max(1, z - a) * 100).toFixed(1) + '%'); }
    else if (n.className) { n.className = ''; n.style.removeProperty('--p'); }
  });
}
/* arrastrar el punto: salta de verdad al soltar (a medio camino solo se ve dónde caería) */
function wireTrack() {
  const at = e => { const r = trkEl.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width))); };
  /* Mientras arrastras, dentro del mismo capítulo las páginas pasan de verdad y el punto se pega a la página
     que vas a dejar: así no "retrocede" al soltar (una página es un salto, no un punto cualquiera de la barra). */
  const move = f => {
    wts();
    const pos = f * bk.W;
    let i = 0; while (i < bk.cum.length - 1 && bk.cum[i + 1] <= pos) i++;
    drag.i = i;
    if (i === si && P.mode === 'page' && pages > 0) {
      const p = (pos - bk.cum[i]) / Math.max(1, bk.w[i]);
      const n = Math.max(0, Math.min(pages - 1, Math.round(p * pages)));
      if (n !== page) { page = n; paint(); }
      f = (bk.cum[i] + n / pages * bk.w[i]) / bk.W;
      drag.here = true;
    } else drag.here = false;
    drag.f = f;
    dotEl.style.transform = `translate3d(${(f * trkW).toFixed(1)}px,0,0)`;
    showProgress(f);
  };
  /* un toque suelto en la barra no hace nada (antes pasaba página sin querer al tocar el pie);
     para moverse hay que arrastrar el punto o mantener apretado */
  let tap = null;
  const grab = e => { if (!tap) return; clearTimeout(tap.tm); tap = null; drag = { f: 0 }; move(at(e)); };
  trkEl.addEventListener('pointerdown', e => {
    if (!el.classList.contains('ui') || !bk) return;
    trkW = trkEl.clientWidth || trkW;
    try { trkEl.setPointerCapture(e.pointerId); } catch (x) {}
    tap = { x: e.clientX, e, tm: setTimeout(() => { if (tap) grab(tap.e); }, 230) };
    e.preventDefault();
  });
  trkEl.addEventListener('pointermove', e => {
    if (tap) { tap.e = e; if (Math.abs(e.clientX - tap.x) > 8) grab(e); return; }
    if (drag) move(at(e));
  });
  const end = e => {
    if (tap) { clearTimeout(tap.tm); tap = null; return; }
    if (!drag) return;
    const f = drag.f, here = drag.here; drag = null;
    if (e.type === 'pointercancel') { paint(); return; }
    if (here) { paint(); showProgress(gdone()); return; }   /* ya estás ahí: solo falta fijar el punto */
    jumpTo(f);
  };
  trkEl.addEventListener('pointerup', end); trkEl.addEventListener('pointercancel', end);
}
async function jumpTo(f) {
  wts();
  ttsStop();
  const pos = f * bk.W;
  let i = 0; while (i < bk.cum.length - 1 && bk.cum[i + 1] <= pos) i++;
  const p = Math.max(0, Math.min(1, (pos - bk.cum[i]) / Math.max(1, bk.w[i])));
  if (i === si) { gotoFrac(p, true); showProgress(gdone()); }
  else { await show(i, { pct: p, near: true }); showProgress(gdone()); }
}

let posT = null;
/* ---------- tiempo de lectura ----------
   Cada página pasada (o desplazamiento) suma el rato desde la anterior, con un máximo de 2 minutos:
   si dejas el teléfono, no se sigue contando. Se guarda por día dentro del libro: b.rt = { 'AAAA-MM-DD': segundos }. */
const RT_CAP = 120000;
let rtLast = 0, rtSv = 0;
const dayKey = d => { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
function rtMark(end) {
  const now = Date.now(), b = curBook();
  if (!b || !el || !el.classList.contains('on')) { rtLast = 0; return; }
  if (!rtLast) { rtLast = end ? 0 : now; return; }
  const secs = Math.min(now - rtLast, RT_CAP) / 1000;
  rtLast = end ? 0 : now;
  if (secs < 0.5) return;
  const rt = b.rt || (b.rt = {}), k = dayKey();
  rt[k] = +((rt[k] || 0) + secs).toFixed(1);
  if (now - rtSv > 20000) { rtSv = now; try { save(); } catch (e) {} }
}
const rtTotal = b => { let n = 0; const rt = b && b.rt; if (rt) for (const k in rt) n += +rt[k] || 0; return n; };
function savePos() {
  clearTimeout(posT);
  /* guardar toda la biblioteca en cada página sería pesado: se espera a que dejes de pasar páginas */
  posT = setTimeout(writePos, 1200);
}
function writePos() {
  const b = curBook();
  if (!b || !bk) return;
  b.pos = { i: si, p: +frac().toFixed(4) };
  /* ancla: el carácter con el que empieza la página. Al volver a abrir (con otra altura de pantalla,
     otra barra del sistema…) se vuelve a esa misma frase y no a "la página 7", que puede ser otra */
  let off = null;
  if (P.mode === 'page') { off = curOff != null ? curOff : anchorOff(); }
  if (off != null && off >= 0 && isFinite(off)) b.pos.o = Math.round(off);
  if (ver === 1) b.pos.v = 1;
  try { save(); } catch (e) {}
}

/* Va a una posición dentro del capítulo ya pintado */
function gotoFrac(p, near) {
  if (P.mode === 'scroll') {
    const w = wrapEl;
    w.scrollTop = p >= 1 ? w.scrollHeight : p * w.scrollHeight;
  } else {
    page = p >= 1 ? pages - 1 : Math.max(0, Math.min(pages - 1, near ? Math.round(p * pages) : Math.floor(p * pages + 0.001)));
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
  if (chapDone && !o.snap) chapDone();
  if (P.anim === 'fade' && !o.snap) move.classList.add('lx-out');
  /* el aviso de "cargando" solo aparece si el capítulo tarda de verdad */
  const lt = setTimeout(() => { load.hidden = false; }, 180);
  let html = '';
  try { html = await chapterHtml(bk, bk.spine[si], ver); } catch (e) { html = ''; }
  clearTimeout(lt); load.hidden = true;
  /* hojas sin nada que leer (portadas vacías, separadores): se saltan en el sentido en que vas */
  if (!hasContent(html) && o.para == null && !o.noSkip) {
    const nx = si + (o.end ? -1 : 1);
    if (nx >= 0 && nx < bk.spine.length) { busy = false; return show(nx, o); }
  }
  curlDrop();
  chapHtml = html || `<p>${esc(t('lxEmptyCh'))}</p>`;
  const col = colEl;
  /* el carro vuelve al inicio sin animación (antes "rebobinaba" todas las páginas al cambiar de capítulo) */
  const prevTr = move.style.transition;
  move.style.transition = 'none';
  if (fadeA) { fadeA.cancel(); fadeA = null; }
  col.innerHTML = chapHtml;
  twins = null;
  col.lang = (bk.meta && bk.meta.lang) || bk.lang || (isEn() ? 'en' : 'es');
  applyHl();
  page = 0; curOff = null;
  wrapEl.scrollTop = 0;
  /* con imágenes, se espera a que carguen para contar bien las páginas */
  const pend = [...col.querySelectorAll('img')].filter(i => !i.complete);
  if (pend.length) await Promise.race([Promise.all(pend.map(i => new Promise(r => { i.onload = i.onerror = r; }))), sleep(1800)]);
  findTwins();
  relayout();
  if (o.para != null) { if (o.pf != null) goPoint(o.para, o.pf); else gotoPara(o.para); }
  else if (o.end) gotoFrac(1);
  else if (o.pct != null && o.pct > 0) gotoFrac(o.pct, o.near);
  if (o.off != null && P.mode === 'page') { const pg = pageOfOff(o.off); if (pg != null) { page = pg; paint(); } }
  void move.offsetWidth;
  move.style.transition = prevTr;
  const ch = bk.toc.filter(x => x.i <= si).pop();
  paintHead(ch && ch.label);
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

function paintHead(label) {
  const b = curBook(), m = bk.meta || {};
  titleEl.textContent = (b && b.title) || m.title || bk.title || '';
  authEl.textContent = (b && b.author) || (m.creators && m.creators[0]) || '';
  const n = t('lxChapter', si + 1, bk.spine.length);
  chapEl.textContent = label ? `${label} · ${n}` : n;
}

/* fundido real entre páginas: sale la actual, entra la nueva (antes solo se notaba al cambiar de capítulo) */
function fadeTurn(n) {
  if (fadeA) { fadeA.cancel(); fadeA = null; page = n; paint(); fadeA = moveEl.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 110 }); const b = fadeA; b.onfinish = () => { if (fadeA === b) fadeA = null; }; return; }
  const a = fadeA = moveEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: 'forwards' });
  a.onfinish = () => {
    if (fadeA !== a) return;
    page = n; paint(); a.cancel();
    const b = fadeA = moveEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 130 });
    b.onfinish = () => { if (fadeA === b) fadeA = null; };
  };
}
/* Cambio de capítulo con la misma animación que entre páginas: se deja una foto de la página que sale encima,
   se carga el capítulo nuevo debajo y la foto sale (deslizar, desvanecer o pasar hoja). */
let chapDone = null;
async function chapTurn(d, i, o) {
  o = o || {};
  if (P.anim === 'none' || REDUCE || P.mode === 'scroll' || !moveEl.animate || !wrapEl.clientWidth) return show(i, o);
  if (curling && curlEnd) curlEnd();
  const W = wrapEl.clientWidth, H = wrapEl.clientHeight, oldTx = -page * W, ty = tapY, was = si;
  const snap = moveEl.cloneNode(true);
  snap.removeAttribute('id'); snap.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
  const nv = snap.querySelector('.lx-chnav'); if (nv) nv.remove();
  snap.className = 'lx-cp lx-snap';
  snap.style.cssText = 'position:absolute;inset:0;transition:none;pointer-events:none';
  snap.style.transform = `translate3d(${oldTx}px,0,0)`;
  moveEl.after(snap);
  let done = false; const anims = [];
  const fin = () => {
    if (done) return; done = true; chapDone = null;
    anims.forEach(a => { try { a.cancel(); } catch (e) {} });
    if (curlEnd && cg && cg.chap) curlEnd();
    snap.remove();
  };
  chapDone = fin;
  try { await show(i, { ...o, snap: true }); } catch (e) { fin(); return; }
  if (done) return;
  if (si === was) { fin(); return; }
  const bx = -page * W, tr = x => ({ transform: `translate3d(${x}px,0,0)` });
  let anim = P.anim;
  if (anim === 'curl' && colEl.textContent.length > 60000) anim = 'fade';
  if (anim === 'curl') {
    const g = curlChap(d, snap, oldTx, ty);
    if (g) { curlRun(curlGone(g), window.__LXDUR || 460, fin, 0.16); return; }
    anim = 'fade';
  }
  if (anim === 'slide') {
    const opt = { duration: 250, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' };
    anims.push(snap.animate([tr(oldTx), tr(oldTx - d * W)], opt));
    const a = moveEl.animate([tr(bx + d * W), tr(bx)], opt); anims.push(a); a.onfinish = fin;
  } else {
    const opt = { duration: 160, easing: 'ease-out', fill: 'forwards' };
    anims.push(snap.animate([{ opacity: 1 }, { opacity: 0 }], opt));
    const a = moveEl.animate([{ opacity: 0 }, { opacity: 1 }], opt); anims.push(a); a.onfinish = fin;
  }
}
function go(d, keepUi) {
  if (busy || P.mode === 'scroll') return;
  if (chapDone) chapDone();
  if (curling && curlEnd) curlEnd();
  ttsStop(); if (!keepUi) hideUi();
  const n = page + d;
  if (n >= 0 && n < pages) {
    if (P.anim === 'curl') return curl(d, n);
    if (P.anim === 'fade' && !REDUCE && moveEl.animate) return fadeTurn(n);
    page = n; paint(); return;
  }
  if (d > 0 && si < bk.spine.length - 1) return chapTurn(1, si + 1);
  if (d > 0) return askFinish();
  if (d < 0 && si > 0) return chapTurn(-1, si - 1, { end: true });
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

let curlA = null, curlB = null, curlRaf = 0, curlEnd = null, cg = null, dragRaf = 0, warmT = 0, tapY = null;
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) { return false; } })();
const curlHide = () => { if (cvEl) { cvEl.classList.remove('lx-run'); flapEl.classList.remove('lx-run'); csEl.classList.remove('lx-run'); } };

/* la copia deja de servir cuando cambia el capítulo, la letra o los subrayados */
function curlDrop() {
  if (curlEnd) curlEnd();
  if (curlA) { curlA.remove(); curlA = null; }
  if (curlB) { curlB.remove(); curlB = null; }
  cg = null;
  clearTimeout(warmT);
  curlHide();
}
/* Copia del capítulo para la hoja que sale (lx-cv) y otra para su reverso (lx-cfi): el reverso deja ver
   el texto del otro lado en espejo, como el papel de verdad. Las dos se maquetan UNA vez por capítulo y se
   quedan ocultas con visibility (no display), así pasar página solo cambia recortes y una transformación. */
function curlPrep() {
  if (curlA) return true;
  /* en capítulos muy largos la copia costaría más que la animación: se pasa a deslizar */
  if (colEl.textContent.length > 60000) return false;
  const mk = cls => {
    const c = moveEl.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    const nv = c.querySelector('.lx-chnav'); if (nv) nv.remove();
    c.className = cls;
    c.style.cssText = 'position:absolute;inset:0;transition:none';
    return c;
  };
  curlA = mk('lx-cp'); cviEl.appendChild(curlA);
  curlB = mk('lx-cp lx-cpb'); flapIn.insertBefore(curlB, fshEl);
  return true;
}
/* se prepara en un rato libre justo tras maquetar, para que la primera hoja no tenga que esperar */
function curlWarm() {
  clearTimeout(warmT);
  if (P.anim !== 'curl' || P.mode === 'scroll' || curlA) return;
  warmT = setTimeout(() => {
    const run = () => { if (el && el.classList.contains('on') && bk && P.anim === 'curl' && !curling) curlPrep(); };
    (window.requestIdleCallback ? requestIdleCallback(run, { timeout: 1500 }) : run());
  }, 250);
}
/* Geometría de la hoja: la esquina C se levanta y va hasta F (el dedo). El doblez es la mediatriz de C-F;
   lo que queda del lado de la esquina se refleja sobre el doblez (el reverso) y deja ver la página nueva. */
/* Solo transformaciones (las mueve la tarjeta gráfica, sin volver a pintar texto en cada cuadro):
   - lx-cv: un "marco" enorme girado con su borde sobre el doblez y overflow:hidden; dentro, la página que sale
     con la transformación inversa, así queda quieta y solo se ve la parte que aún no se ha doblado.
   - lx-cf: otro marco igual con el reverso dentro, reflejado sobre el doblez (texto en espejo, tenue).
   - las sombras son tiras con un degradado fijo, colocadas sobre el doblez con una transformación. */
const mat = m => `matrix(${m[0].toFixed(5)},${m[1].toFixed(5)},${m[2].toFixed(5)},${m[3].toFixed(5)},${m[4].toFixed(2)},${m[5].toFixed(2)})`;
const mmul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const minv = M => { const d = M[0] * M[3] - M[1] * M[2], a = M[3] / d, b = -M[1] / d, c = -M[2] / d, e = M[0] / d; return [a, b, c, e, -(a * M[4] + c * M[5]), -(b * M[4] + e * M[5])]; };
/* marco con origen en q, eje x a lo largo de (ux,uy) y el borde (u=0) sobre el doblez, centrado en vertical */
const frame = (ux, uy, q, S) => [ux, uy, -uy, ux, q[0] + uy * S / 2, q[1] - ux * S / 2];
let curlLast = 0, curlSlow = 0;
function curlApply(g) {
  const { W, H, C, S } = g;
  /* teléfono lento: si los cuadros tardan, el reverso deja de llevar el texto en espejo */
  const now = performance.now();
  if (curlLast && now - curlLast < 200) { curlSlow = now - curlLast > 34 ? curlSlow + 1 : Math.max(0, curlSlow - 1); if (curlSlow >= 4 && !flapEl.classList.contains('lx-lite')) flapEl.classList.add('lx-lite'); }
  curlLast = now;
  let fx = g.F[0], fy = g.F[1];
  /* el papel no se estira: la esquina no puede alejarse del lomo más que el ancho de la página */
  const sx = C[0] === W ? 0 : W, sy = C[1];
  let dx = fx - sx, dy = fy - sy, r = Math.hypot(dx, dy);
  if (r > W) { fx = sx + dx / r * W; fy = sy + dy / r * W; }
  const oy = H - C[1], R2 = Math.hypot(W, H);
  dx = fx - sx; dy = fy - oy; r = Math.hypot(dx, dy);
  if (r > R2) { fx = sx + dx / r * R2; fy = oy + dy / r * R2; }
  let vx = C[0] - fx, vy = C[1] - fy, len = Math.hypot(vx, vy);
  if (len < 0.5) { vx = C[0] === W ? 1 : -1; vy = 0; len = 0; fx = C[0]; fy = C[1]; }
  const nx = len ? vx / len : vx, ny = len ? vy / len : 0, q = [(C[0] + fx) / 2, (C[1] + fy) / 2];
  /* lo que queda plano: marco orientado hacia el lado contrario a la esquina */
  const K = frame(-nx, -ny, q, S);
  cvEl.style.transform = mat(K);
  cviEl.style.transform = mat(minv(K));
  /* reverso: mismo marco, contenido reflejado sobre el doblez */
  const nq = nx * q[0] + ny * q[1];
  const R = [1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * nx * nq, 2 * ny * nq];
  flapEl.style.transform = cvEl.style.transform;
  flapIn.style.transform = mat(mmul(minv(K), R));
  flapEl.style.opacity = len ? '1' : '0';
  /* sombras: sobre el reverso (oscuro junto al doblez) y la que cae sobre la página nueva */
  const G = frame(nx, ny, q, S), k = Math.min(1, len / (W * 0.6));
  fshEl.style.transform = mat(G) + ` scale(${Math.max(0.05, Math.min(1, len / (W * 0.9))).toFixed(3)},1)`;
  csEl.style.transform = mat(G) + ` scale(${(0.2 + 0.8 * k).toFixed(3)},1)`;
  csEl.style.opacity = (0.45 + 0.55 * k).toFixed(2);
}
/* empieza una hoja (por toque o por arrastre); devuelve null si no se puede y entonces se cambia sin animar.
   y: altura donde empezó el gesto (arriba levanta la esquina de arriba, abajo la de abajo) */
function curlBegin(d, n, y) {
  const W = wrapEl.clientWidth, H = wrapEl.clientHeight;
  if (REDUCE || !W || !H || !curlPrep()) return null;
  if (curlEnd) curlEnd();
  curlA.style.transform = curlB.style.transform = `translate3d(${-page * W}px,0,0)`;
  const top = y != null && y < H * 0.4;
  const C = [d > 0 ? W : 0, top ? 0 : H];
  const S = Math.ceil(Math.hypot(W, H) * 2.2);
  if (wrapEl.dataset.cs !== W + 'x' + H) {
    wrapEl.dataset.cs = W + 'x' + H;
    wrapEl.style.setProperty('--lx-S', S + 'px'); wrapEl.style.setProperty('--lx-W', W + 'px'); wrapEl.style.setProperty('--lx-H', H + 'px');
  }
  const g = cg = { d, n, old: page, W, H, C, S, F: [C[0], C[1]], y0: y, cancel: false };
  cvEl.classList.add('lx-run'); flapEl.classList.add('lx-run'); csEl.classList.add('lx-run');
  curlApply(g);                           /* el primer cuadro ya está cubierto por la hoja */
  page = n; paint();                      /* la página nueva ya está debajo */
  curling = true;
  curlEnd = () => {
    if (curlRaf) cancelAnimationFrame(curlRaf);
    if (dragRaf) cancelAnimationFrame(dragRaf);
    curlRaf = dragRaf = 0; curlEnd = null; curling = false; curlLast = 0;
    curlHide(); cg = null;
    if (g.cancel) { page = g.old; paint(); }   /* soltaste antes de pasar la hoja: se queda donde estaba */
  };
  return g;
}
/* hoja que sale al cambiar de capítulo: la copia ya es la foto de la página vieja y la nueva ya está debajo */
function curlChap(d, snap, tx, y) {
  const W = wrapEl.clientWidth, H = wrapEl.clientHeight;
  if (!W || !H) return null;
  if (curlEnd) curlEnd();
  if (curlA) { curlA.remove(); curlA = null; }
  if (curlB) { curlB.remove(); curlB = null; }
  snap.className = 'lx-cp'; curlA = snap; cviEl.appendChild(curlA);
  curlB = snap.cloneNode(true); curlB.className = 'lx-cp lx-cpb'; flapIn.insertBefore(curlB, fshEl);
  curlA.style.transform = curlB.style.transform = `translate3d(${tx}px,0,0)`;
  const C = [d > 0 ? W : 0, y != null && y < H * 0.4 ? 0 : H], S = Math.ceil(Math.hypot(W, H) * 2.2);
  if (wrapEl.dataset.cs !== W + 'x' + H) {
    wrapEl.dataset.cs = W + 'x' + H;
    wrapEl.style.setProperty('--lx-S', S + 'px'); wrapEl.style.setProperty('--lx-W', W + 'px'); wrapEl.style.setProperty('--lx-H', H + 'px');
  }
  const g = cg = { d, n: page, old: page, W, H, C, S, F: [C[0], C[1]], y0: y, cancel: false, chap: true };
  cvEl.classList.add('lx-run'); flapEl.classList.add('lx-run'); csEl.classList.add('lx-run');
  curlApply(g);
  curling = true;
  curlEnd = () => {
    if (curlRaf) cancelAnimationFrame(curlRaf);
    curlRaf = 0; curlEnd = null; curling = false; curlLast = 0;
    curlHide(); cg = null;
    if (curlA) { curlA.remove(); curlA = null; }
    if (curlB) { curlB.remove(); curlB = null; }
    curlWarm();
  };
  return g;
}
/* cuánto se ha pasado la hoja (0 = plana, 1 = pasada) */
const curlProg = g => Math.max(0, Math.min(1, Math.abs(g.C[0] - g.F[0]) / (g.W * 1.6)));
/* anima la esquina desde donde está hasta "to"; con lift, describe un arco (como al tirar de la esquina) */
function curlRun(to, dur, done, lift) {
  const g = cg, T0 = performance.now(), F0 = [g.F[0], g.F[1]];
  const ease = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const up = g.C[1] === 0 ? 1 : -1;
  const frame = now => {
    if (cg !== g) return;
    const k = dur > 0 ? Math.min(1, (now - T0) / dur) : 1, e = ease(k);
    g.F[0] = F0[0] + (to[0] - F0[0]) * e;
    g.F[1] = F0[1] + (to[1] - F0[1]) * e + (lift ? up * Math.sin(Math.PI * e) * g.H * lift : 0);
    curlApply(g);
    if (k < 1) curlRaf = requestAnimationFrame(frame); else { curlRaf = 0; done(); }
  };
  curlRaf = requestAnimationFrame(frame);
}
const curlGone = g => [g.d > 0 ? -g.W : 2 * g.W, g.C[1]];
function curl(d, n) {
  const g = curlBegin(d, n, tapY);
  if (!g) { page = n; paint(); return; }
  /* toque: la esquina se levanta un poco hacia dentro y la hoja pasa entera */
  curlRun(curlGone(g), window.__LXDUR || 460, () => { if (curlEnd) curlEnd(); }, 0.16);
}
/* arrastre: la esquina sigue al dedo; al soltar, la hoja termina de pasar o vuelve */
function curlDragMove(dx, dy) {
  const g = cg; if (!g) return;
  g.F[0] = g.C[0] + dx;
  g.F[1] = g.C[1] + dy * 0.9 + (g.C[1] === 0 ? 1 : -1) * Math.min(Math.abs(dx) * 0.12, g.H * 0.08);
  if (!dragRaf) dragRaf = requestAnimationFrame(() => { dragRaf = 0; if (cg === g) curlApply(g); });
}
function curlSettle(commit) {
  const g = cg; if (!g) return;
  if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
  if (curlRaf) { cancelAnimationFrame(curlRaf); curlRaf = 0; }
  g.cancel = !commit;
  const pr = curlProg(g);
  curlRun(commit ? curlGone(g) : [g.C[0], g.C[1]], Math.max(110, (commit ? 1 - pr : pr) * 420), () => { if (curlEnd) curlEnd(); });
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
  applyTwins();
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
  const k = paras().findIndex(p => p.contains(r.startContainer));
  return { s, e: s + q.length, q: q.replace(/\s+/g, ' ').trim(), k };
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
    <button type="button" class="lx-dbtn" data-x="tr">${esc(T('tr'))}</button>
    <button type="button" class="lx-dbtn" data-x="copy">${esc(T('copy'))}</button>
    <button type="button" class="lx-dbtn" data-x="qcard">${esc(T('qcard'))}</button>
    ${(curBook() || {}).file2 && selInfo.k >= 0 ? `<button type="button" class="lx-lang lx-lang-in" data-x="lang" aria-label="${esc(T('swapHere'))}">${esc(langCode(ver))}</button>` : ''}`);
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
    <button type="button" class="lx-dbtn" data-x="qcard">${esc(T('qcard'))}</button>
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
  if (!p.classList.contains('on')) uiWas = el.classList.contains('ui');
  p.innerHTML = html;
  p.classList.add('on');
  hideMenu(); hideUi();
}
/* al volver de un panel (ajustes, índice…) las barras vuelven a estar como estaban */
const closePanel = () => {
  const p = panelEl; p.classList.remove('on');
  if (uiWas) { uiWas = false; el.classList.add('ui'); trkW = trkEl.clientWidth || trkW; showProgress(gdone()); }
  setTimeout(() => { if (!p.classList.contains('on')) p.innerHTML = ''; }, 200);
};
/* botón "atrás" de Android: primero cierra lo que esté abierto encima; si no hay nada, devuelve false para que cierre el libro */
function back() {
  if (!el || !el.classList.contains('on')) return false;
  if (menuEl.classList.contains('on')) { hideMenu(); return true; }
  if (panelEl.classList.contains('on')) { closePanel(); return true; }
  if (dockEl.classList.contains('on') && (selInfo || hlEdit)) { const sl = getSelection(); if (sl) sl.removeAllRanges(); selInfo = null; hideDock(); return true; }
  return false;
}

const when = ts => { try { return new Date(ts).toLocaleDateString(isEn() ? 'en' : 'es', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } };
const chLabel = i => { const ch = bk.toc.filter(x => x.i <= i).pop(); return (ch && ch.label) || t('lxChapter', i + 1, bk.spine.length); };

/* Entradas del índice que no son parte del libro: derechos, créditos, portada, "índice" dentro del índice…
   Se esconden de la lista de capítulos (el libro sigue teniéndolas y se pueden pasar de página). */
const JUNK = /^\s*(?:©\s*)?(?:copyright|copy\s*right|derechos(?:\s+de\s+autor)?|todos\s+los\s+derechos|all\s+rights|aviso\s+legal|legal(?:\s+(?:notice|page|information|disclaimer))?|p[aá]gina\s+legal|licen[cs]e|licencia|colof[oó]n|colophon|imprint|cr[eé]ditos?(?:\s+de\s+(?:la\s+)?edici[oó]n)?|credits?|ficha\s+t[eé]cnica|isbn|cover(?:\s+page)?|portada|portadilla|contraportada|back\s+cover|title\s+page|half[\s-]?title|p[aá]gina\s+de\s+t[ií]tulo|t[ií]tulo|table\s+of\s+contents|contents|[ií]ndice|tabla\s+de\s+contenidos?|contenido|about\s+(?:the\s+)?publisher|sobre\s+(?:la|el)\s+editor(?:ial)?|also\s+by|otros\s+(?:t[ií]tulos|libros)\s+de.*|more\s+books\s+by.*|newsletter|ebook\s+edition|edici[oó]n\s+digital|nota\s+legal|publisher|editorial)\s*\.?\s*$/i;
const junkLabel = lb => JUNK.test(String(lb || '').replace(/\s+/g, ' '));
/* pistas dentro de la propia hoja: una hoja corta con © o "todos los derechos reservados" no es un capítulo */
const LEGAL = /©|\bcopyright\b|all\s+rights\s+reserved|todos\s+los\s+derechos|derechos\s+reservados|\bisbn\b|reservados\s+todos/i;
async function markJunk(b) {
  if (!b || b.junkDone) return;
  b.junkDone = true;
  let changed = false;
  for (const x of b.toc) {
    if (x.junk || (b.w[x.i] || 0) > 9000) continue;
    try {
      const raw = await b.grab(b.spine[x.i].href);
      const txt = raw.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
      if (txt.length < 2200 && LEGAL.test(txt)) { x.junk = true; changed = true; }
    } catch (e) {}
  }
  if (changed && panelEl && panelEl.classList.contains('on') && tocTab === 'ch' && bk === b) tocPanel('ch');
}
let tocTab = 'ch';
function tocPanel(tab) {
  tocTab = tab || tocTab;
  const b = curBook();
  const shown = bk.toc.filter(x => !x.junk), tocList = shown.length ? shown : bk.toc;
  const cuRow = tocList.filter(x => x.i <= si).pop();
  const marks = ((b && b.marks) || []).filter(m => verOf(m) === ver).sort((a, z) => a.i - z.i || a.p - z.p);
  const hls = ((b && b.hl) || []).filter(h => verOf(h) === ver).sort((a, z) => a.i - z.i || a.s - z.s);
  const lks = ((b && b.looks) || []).slice().sort((a, z) => z.ts - a.ts);
  let body;
  if (tocTab === 'ch') {
    body = tocList.length
      ? tocList.map(x => `<button type="button" class="lx-item ${x === cuRow ? 'cur' : ''}" data-go="${x.i}">${esc(x.label)}</button>`).join('')
      : `<p class="lx-note">${esc(t('lxNoToc'))}</p>`;
  } else if (tocTab === 'bm') {
    body = marks.length ? marks.map(m => `<div class="lx-irow"><button type="button" class="lx-item" data-go="${m.i}" data-pct="${m.p}">${esc(m.tx || '…')}<small>${esc(chLabel(m.i))} · ${esc(when(m.ts))}</small></button><button type="button" class="lx-rm" data-rmm="${m.id}" aria-label="${esc(T('del'))}">${I.x}</button></div>`).join('')
      : `<p class="lx-note">${esc(T('noMarks'))}</p>`;
  } else if (tocTab === 'lk') {
    body = lks.length ? lks.map(x => `<div class="lx-irow"><button type="button" class="lx-item" ${verOf(x) === ver ? `data-go="${x.i}" data-pct="${x.p}"` : ''}><span class="lx-lk ${x.k}">${esc(T(x.k === 't' ? 'kT' : 'kD'))}</span> ${esc(x.q)}<small>${esc(verOf(x) === ver ? chLabel(x.i) : langCode(verOf(x)))} · ${esc(when(x.ts))}</small></button><button type="button" class="lx-rm" data-relk="${x.id}" aria-label="${esc(T('again'))}">${I.find}</button><button type="button" class="lx-rm" data-rml="${x.id}" aria-label="${esc(T('del'))}">${I.x}</button></div>`).join('')
      : `<p class="lx-note">${esc(T('noLooks'))}</p>`;
  } else {
    body = hls.length ? hls.map(h => `<div class="lx-irow"><button type="button" class="lx-item hl" data-go="${h.i}" data-hl="${h.id}"><span class="lx-q ${h.c}">${esc(h.q)}</span>${h.n ? `<em>${esc(h.n)}</em>` : ''}<small>${esc(chLabel(h.i))} · ${esc(when(h.ts))}</small></button><button type="button" class="lx-rm" data-rmh="${h.id}" aria-label="${esc(T('del'))}">${I.x}</button></div>`).join('')
      : `<p class="lx-note">${esc(T('noNotes'))}</p>`;
  }
  const tab2 = (k, lb, n) => `<button type="button" data-tab="${k}" aria-pressed="${tocTab === k}">${esc(lb)}${n ? ` <small>${n}</small>` : ''}</button>`;
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxToc'))}</b></div>
    <div class="lx-tabs">${tab2('ch', T('tabCh'))}${tab2('bm', T('tabMarks'), marks.length)}${tab2('hl', T('tabNotes'), hls.length)}${tab2('lk', T('tabLooks'), lks.length)}</div>
    <div class="lx-plist">${body}</div>`);
}

/* ---------- pantalla de felicitación al terminar un libro ----------
   Sale solo al marcar como leído desde el aviso del final. La valoración y el comentario se guardan al momento. */
let finCovU = null, finNoteT = 0;
const fmtDur = sec => { const m = Math.round(sec / 60); if (sec < 30) return T('finLess'); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' ' + T('finHr') + (m % 60 ? ' ' + (m % 60) + ' min' : ''); };
function finStars(v) {
  let h = '';
  for (let i = 0; i < 5; i++) {
    const f = Math.max(0, Math.min(1, v - i));
    h += `<span class="lx-st"><span>★</span><b style="width:${f * 100}%">★</b><button type="button" data-fv="${i + .5}" aria-label="${i + .5}"></button><button type="button" data-fv="${i + 1}" aria-label="${i + 1}"></button></span>`;
  }
  return h;
}
function finSave(b, k, v) {
  if (v === '' || v == null || v === 0) delete b[k]; else b[k] = v;
  try { API.touch && API.touch(k); save(); } catch (e) {}
}
async function celebrate(b) {
  const rt = b.rt || {}, keys = Object.keys(rt).sort(), tot = rtTotal(b);
  const first = keys.length ? new Date(keys[0] + 'T00:00:00') : null;
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const span = first && !isNaN(first) ? Math.max(1, Math.round((t0 - first) / 864e5) + 1) : 0;
  const nh = (b.hl || []).length, tiles = [];
  if (tot >= 30) tiles.push([fmtDur(tot), T('finTime')]);
  if (span > 1) tiles.push([span, T('finDaysAll')]); else if (keys.length) tiles.push([keys.length, T('finDaysRd')]);
  if (nh) tiles.push([nh, T('finHl')]); else if (span > 1 && keys.length && keys.length !== span) tiles.push([keys.length, T('finDaysRd')]);
  let cov = '';
  if (finCovU) { try { URL.revokeObjectURL(finCovU); } catch (e) {} finCovU = null; }
  if (bk && bk.cover) {
    try { const raw = await bk.bin(bk.cover.href); if (raw) finCovU = URL.createObjectURL(new Blob([raw], { type: raw.type || MIME(bk.cover.href) })); } catch (e) { finCovU = null; }
  }
  cov = finCovU ? `<img src="${finCovU}" alt="">` : `<div class="lx-fcl">${esc((b.title || '?').trim().charAt(0).toUpperCase())}</div>`;
  const cols = ['#e8b84a', '#c9a6e3', '#7fc4a0', '#f08a9f', '#8ab4e8'];
  const conf = REDUCE ? '' : Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 4.7 + (i % 3) * 3).toFixed(1)}%;background:${cols[i % 5]};animation-delay:${((i * 0.13) % 1.1).toFixed(2)}s;animation-duration:${(2 + (i % 4) * 0.35).toFixed(2)}s;--r:${(i * 47) % 360}deg"></i>`).join('');
  panel(`<div class="lx-fin"><div class="lx-conf">${conf}</div>
    <h2>${esc(T('finT'))}</h2><p class="lx-fsub">${esc(T('finSub'))}</p>
    <div class="lx-fcov">${cov}</div>
    <div class="lx-ftit">${esc(b.title || '')}${b.author ? `<small>${esc(b.author)}</small>` : ''}</div>
    ${tiles.length ? `<div class="lx-ftiles">${tiles.map(([v, l]) => `<div><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
    <div class="lx-frate"><span>${esc(T('finRate'))}</span><div id="lxFst" class="lx-fst">${finStars(+b.rating || 0)}</div></div>
    <textarea id="lxFnote" rows="3" placeholder="${esc(T('finNotePh'))}">${esc(b.note || '')}</textarea>
    <button type="button" class="lx-dbtn pri lx-fdone" data-x="finx">${esc(T('finDone'))}</button></div>`);
  const st = $('#lxFst', el), ta = $('#lxFnote', el);
  st.addEventListener('click', e => {
    const bt = e.target.closest('[data-fv]'); if (!bt) return;
    const v = +bt.dataset.fv; const nv = (+b.rating || 0) === v ? 0 : v;
    finSave(b, 'rating', nv); st.innerHTML = finStars(nv);
  });
  ta.addEventListener('input', () => { clearTimeout(finNoteT); finNoteT = setTimeout(() => finSave(b, 'note', ta.value.trim()), 500); });
  toast(T('markedRead'));
}
function finClose() {
  const b = curBook(), ta = $('#lxFnote', el);
  clearTimeout(finNoteT);
  if (b && ta) finSave(b, 'note', ta.value.trim());
  closePanel();
  setTimeout(() => { if (finCovU) { try { URL.revokeObjectURL(finCovU); } catch (e) {} finCovU = null; } }, 400);
}

/* ---------- tarjeta de cita: el subrayado como imagen para compartir ---------- */
const QSTY = {
  plum:  { bg: ['#6a2f8f', '#2a1245'], fg: '#ffffff', ac: '#e3c6ff', soft: '#d8c0ee' },
  light: { bg: '#f8f3f8', fg: '#2a1d33', ac: '#5b2a7a', soft: '#6b587a' },
  sepia: { bg: '#f3e9d6', fg: '#3b3222', ac: '#7a4a2a', soft: '#7a6b53' },
  dark:  { bg: '#1d1626', fg: '#e8deef', ac: '#c9a6e3', soft: '#a994b8' },
  paper: { bg: '#ffffff', fg: '#111111', ac: '#111111', soft: '#666666' }
};
let qc = null;
function qWrap(c, text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (line && c.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function drawQuote(cv, q) {
  const W = 1080, H = 1350, pad = 104, s = QSTY[q.sty] || QSTY.plum, fam = FONTS[P.font] || FONTS.serif;
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  if (Array.isArray(s.bg)) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, s.bg[0]); g.addColorStop(1, s.bg[1]); c.fillStyle = g; } else c.fillStyle = s.bg;
  c.fillRect(0, 0, W, H);
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.fillStyle = s.ac; c.font = `bold 230px ${fam}`; c.fillText('\u201C', pad - 10, pad + 200);
  const top = 340, bottom = H - (q.meta ? 330 : 150), maxW = W - pad * 2, areaH = bottom - top;
  let size = 68, lines;
  for (; size >= 32; size -= 2) {
    c.font = `${size}px ${fam}`; lines = qWrap(c, q.text, maxW);
    if (lines.length * size * 1.4 <= areaH) break;
  }
  const fit = Math.max(1, Math.floor(areaH / (size * 1.4)));
  if (lines.length > fit) { lines = lines.slice(0, fit); let l = lines[fit - 1]; while (l.length > 1 && c.measureText(l + '\u2026').width > maxW) l = l.slice(0, -1); lines[fit - 1] = l.replace(/[ ,;:.]+$/, '') + '\u2026'; }
  c.fillStyle = s.fg; c.font = `${size}px ${fam}`;
  const y0 = top + Math.max(0, (areaH - lines.length * size * 1.4) / 2 - 20);   /* las citas cortas quedan centradas */
  lines.forEach((l, i) => c.fillText(l, pad, y0 + size + i * size * 1.4));
  if (q.meta && (q.title || q.author)) {
    c.fillStyle = s.ac; c.fillRect(pad, H - 290, 120, 5);
    const fit1 = (txt, px, wt) => { c.font = `${wt} ${px}px ${fam}`; let t = txt; while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1); return t.length < txt.length ? t.trim() + '\u2026' : t; };
    c.fillStyle = s.fg; c.fillText(fit1(q.title || '', 44, 'bold'), pad, H - 220);
    if (q.author) { c.fillStyle = s.soft; c.fillText(fit1(q.author, 34, 'normal'), pad, H - 164); }
  }
}
function quotePanel(text) {
  const b = curBook() || {};
  qc = { text: text.replace(/\s+/g, ' ').trim().slice(0, 700), sty: 'plum', meta: true, title: b.title || '', author: b.author || '' };
  if (!qc.text) return;
  const sw = k => { const a = QSTY[k].bg; return Array.isArray(a) ? `linear-gradient(135deg,${a[0]},${a[1]})` : a; };
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(T('qcard'))}</b></div>
    <div class="lx-qc">
      <div class="lx-qprev"><canvas id="lxQc"></canvas></div>
      <div class="lx-qsty">${Object.keys(QSTY).map(k => `<button type="button" data-x="qs-${k}" aria-pressed="${k === qc.sty}" aria-label="${k}" style="background:${sw(k)}"></button>`).join('')}</div>
      <label class="lx-qmeta"><input type="checkbox" id="lxQm" checked> ${esc(T('qMeta'))}</label>
      <div class="lx-qact"><button type="button" class="lx-dbtn pri" data-x="qshare">${esc(T('qShare'))}</button><button type="button" class="lx-dbtn" data-x="qsave">${esc(T('qSave'))}</button></div>
    </div>`);
  const cv = $('#lxQc', el); drawQuote(cv, qc);
  $('#lxQm', el).addEventListener('change', e => { qc.meta = e.target.checked; drawQuote(cv, qc); });
}
const qBlob = () => new Promise((ok, ko) => { const cv = $('#lxQc', el); if (!cv) return ko(new Error('x')); cv.toBlob(b => b ? ok(b) : ko(new Error('x')), 'image/png'); });
const blobB64 = bl => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = ko; r.readAsDataURL(bl); });
const qName = () => (qc.title || 'cita').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 40) + ' - cita.png';
async function quoteOut(share) {
  try {
    const bl = await qBlob(), name = qName(), CAP = API.CAP;
    if (CAP) {
      const b64 = await blobB64(bl);
      if (share && CAP.Filesystem && CAP.Share) {
        await CAP.Filesystem.writeFile({ path: 'cita.png', data: b64, directory: 'CACHE' });
        const { uri } = await CAP.Filesystem.getUri({ path: 'cita.png', directory: 'CACHE' });
        try { await CAP.Share.share({ title: name, files: [uri] }); } catch (e) { if (/cancel|dismiss/i.test(String(e && (e.message || e)))) return; throw e; }
        return;
      }
      const fo = API.FO && API.FO();
      if (fo && fo.saveDownload) { await fo.saveDownload({ name, data: b64, mime: 'image/png' }); toast(T('qSaved')); return; }
    }
    const f = new File([bl], name, { type: 'image/png' });
    if (share && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch (e) { if (!/abort|cancel/i.test(String(e && e.name || e))) throw e; } return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    if (!share) toast(T('qSaved'));
  } catch (e) { toast(T('qBad')); }
}
const fsize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function aboutPanel() {
  const b = curBook(), m = bk.meta || {}, ref = b && (ver && b.file2 ? b.file2 : b.file);
  const plain = h => { try { return (new DOMParser().parseFromString(h, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); } catch (e) { return h; } };
  const rows = [
    ['aTitle', m.title], ['aAuthor', (m.creators || []).join(', ')], ['aPub', m.publisher], ['aLang', m.lang],
    ['aDate', (m.date || '').slice(0, 10)], ['aId', (m.ids || []).join('\n')], ['aSubj', (m.subjects || []).join(', ')],
    ['aDesc', plain(m.description || '')], ['aRights', m.rights], ['aVer', m.version], ['aCh', String(bk.spine.length)],
    ['aFile', ref && ref.name], ['aSize', bk.size ? fsize(bk.size) : '']
  ].filter(r => r[1]);
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(T('about'))}</b></div>
    <div class="lx-plist lx-about"><div class="lx-cover" id="lxCov" hidden></div>${rows.length ? rows.map(([k, v]) => `<div class="lx-kv"><small>${esc(T(k))}</small><div>${esc(v)}</div></div>`).join('') : `<p class="lx-note">${esc(T('aNone'))}</p>`}</div>`);
  aboutCover();
}
/* Widget del libro: la portada tal cual (rectangular, sin borde); si no tiene, un rectángulo morado con la inicial */
async function widgetCircle() {
  const b = curBook() || {}, MAXH = 360, MAXW = 360;
  let img = null, u = null;
  if (bk && bk.cover) {
    try {
      const raw = await bk.bin(bk.cover.href);
      if (raw) {
        u = URL.createObjectURL(new Blob([raw], { type: raw.type || MIME(bk.cover.href) }));
        img = await new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = u; });
      }
    } catch (e) { img = null; }
  }
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  if (img && img.width > 0 && img.height > 0) {
    const r = Math.min(MAXW / img.width, MAXH / img.height, 1);
    cv.width = Math.max(1, Math.round(img.width * r)); cv.height = Math.max(1, Math.round(img.height * r));
    c.drawImage(img, 0, 0, cv.width, cv.height);
  } else {
    cv.width = 240; cv.height = 360;
    const g = c.createLinearGradient(0, 0, cv.width, cv.height); g.addColorStop(0, '#6a2f8f'); g.addColorStop(1, '#2a1245');
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#fff'; c.font = 'bold 130px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(((b.title || '?').trim()[0] || '?').toUpperCase(), cv.width / 2, cv.height / 2 + 8);
  }
  if (u) URL.revokeObjectURL(u);
  return cv.toDataURL('image/png').split(',')[1];
}
async function addWidget() {
  const b = curBook(), fo = API.FO && API.FO();
  if (!b) return;
  if (!fo || !fo.pinWidget) { toast(T('needApk')); return; }
  try {
    const cover = await widgetCircle();
    await fo.pinWidget({ id: b.id, title: b.title || '', cover });
    toast(T('widgetAsk'));
  } catch (e) {
    const m = String(e && (e.message || e));
    toast(T(/not_supported/.test(m) ? 'widgetNo' : /implement|not available/i.test(m) ? 'needApk' : 'widgetBad'));
  }
}
let covBlob = null, covName = 'cover.jpg';
async function aboutCover() {
  const box = $('#lxCov', el), it = bk.cover;
  if (!box || !it) return;
  try {
    const raw = await bk.bin(it.href); if (!raw || !box.isConnected) return;
    covBlob = new Blob([raw], { type: raw.type || MIME(it.href) });
    covName = (((curBook() || {}).title || 'cover').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'cover') + '.' + ((it.href.split('.').pop() || 'jpg').toLowerCase());
    const u = URL.createObjectURL(covBlob);
    box.innerHTML = `<img alt="" src="${u}"><button type="button" class="lx-covdl" data-x="covsave" aria-label="${esc(T('covSave'))}">${I.dl}</button>`;
    box.hidden = false;
  } catch (e) {}
}
async function saveCover() {
  if (!covBlob) return;
  try {
    const fo = API.FO && API.FO();
    if (API.CAP && fo && fo.saveDownload) {
      const b64 = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = ko; r.readAsDataURL(covBlob); });
      await fo.saveDownload({ name: covName, data: b64, mime: covBlob.type || 'image/jpeg' });
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(covBlob); a.download = covName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    }
    toast(T('covSaved'));
  } catch (e) { toast(T('covBad')); }
}
async function shareFile() {
  const b = curBook(), ref = b && (ver && b.file2 ? b.file2 : b.file);
  if (!ref) return;
  const fo = API.FO && API.FO();
  try {
    if (ref.uri) {
      if (!fo) throw new Error('apk');
      await fo.shareFile({ uri: ref.uri, type: ref.type || 'application/epub+zip', name: ref.name });
      return;
    }
    const blob = await FS.get(ref), f = new File([blob], ref.name, { type: ref.type || 'application/epub+zip' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = ref.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  } catch (e) {
    const m = String(e && (e.message || e));
    if (/cancel|abort/i.test(m)) return;
    toast(T(/implement|not available|apk/i.test(m) ? 'needApk' : 'shareBad'));
  }
}
let orientSet = false;
async function toggleOrient() {
  const fo = API.FO && API.FO();
  if (!fo || !fo.setOrientation) { toast(T('needApk')); return; }
  try { await fo.setOrientation({ mode: innerWidth > innerHeight ? 'portrait' : 'landscape' }); orientSet = true; }
  catch (e) { toast(T('needApk')); }
}
function orientBack() {
  if (!orientSet) return;
  orientSet = false;
  try { const fo = API.FO && API.FO(); if (fo && fo.setOrientation) fo.setOrientation({ mode: 'auto' }); } catch (e) {}
}

function findPanel(restore) {
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxFind'))}</b></div>
    <div class="lx-sbox"><input id="lxQ" type="search" autocomplete="off" placeholder="${esc(t('lxFindPh'))}"></div>
    <div class="lx-plist" id="lxR"><p class="lx-note">${esc(t('lxFindHint'))}</p></div>`);
  const q = $('#lxQ', el);
  if (restore && lastS) {
    q.value = lastS.q; const bx = $('#lxR', el); bx.innerHTML = lastS.html || bx.innerHTML; srMarkCur();
    const c = bx.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'center' });
  } else q.focus();
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
  const S0 = lastS = { q, items: [], html: '', done: false, cur: -1 };
  const put = h => { S0.html = h; const bx = $('#lxR', el); if (tok === searchTok && bx && lastS === S0) { bx.innerHTML = h; if (sr === S0) srMarkCur(); } };
  for (let i = 0; i < mine.spine.length; i++) {
    if (tok !== searchTok || bk !== mine || !el || !el.classList.contains('on')) return;
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
      S0.items.push({ i, n: hits, pct: +(at / Math.max(1, text.length)).toFixed(4) });
      if (sr === S0) srPaint();
      html += `<button type="button" class="lx-item" data-sr="${S0.items.length - 1}" data-go="${i}" data-pct="${(at / Math.max(1, text.length)).toFixed(4)}">${frag}<small>${esc((ch && ch.label) || t('lxChapter', i + 1, mine.spine.length))}</small></button>`;
      from = at + nq.length; hits++; found++;
    }
    if (found && (i % 3 === 0 || found >= 120)) put(html);
    if (found >= 120) break;
    /* respiro para que la interfaz no se congele en libros largos */
    if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));
  }
  S0.done = true; if (sr === S0) srPaint();
  if (tok !== searchTok) return;
  put(found ? html : `<p class="lx-note">${esc(t('lxNoHits'))}</p>`);
}

/* ---------- navegar entre los resultados de la búsqueda ---------- */
const srFold1 = c => { const d = c.normalize('NFD')[0] || c; return d.toLowerCase()[0] || d; };
function srFoldStr(str) { let o = '', sp = true; for (let j = 0; j < str.length; j++) { const c = str[j]; if (/\s/.test(c)) { if (!sp) { o += ' '; sp = true; } } else { o += srFold1(c); sp = false; } } return o.trim(); }
/* busca en el texto ya pintado la aparición número "n" (la misma que contó la búsqueda) */
function srFind(q, n, pct) {
  const fq = srFoldStr(q); if (!fq) return null;
  const w = document.createTreeWalker(colEl, NodeFilter.SHOW_TEXT);
  let s = '', map = [], acc = 0, sp = true, node;
  while ((node = w.nextNode())) {
    const d = node.nodeValue;
    for (let j = 0; j < d.length; j++) {
      const c = d[j];
      if (/\s/.test(c)) { if (!sp) { s += ' '; map.push(acc + j); sp = true; } }
      else { s += srFold1(c); map.push(acc + j); sp = false; }
    }
    acc += d.length;
  }
  const at = []; let f = 0, x;
  while ((x = s.indexOf(fq, f)) >= 0 && at.length < 400) { at.push(x); f = x + Math.max(1, fq.length); }
  if (!at.length) return null;
  let a = at[n];
  if (a == null) { const tg = (pct || 0) * s.length; a = at.reduce((m, v) => Math.abs(v - tg) < Math.abs(m - tg) ? v : m, at[0]); }
  return { s: map[a], e: map[Math.min(map.length - 1, a + fq.length - 1)] + 1 };
}
function srRange(s0, e0) {
  const w = document.createTreeWalker(colEl, NodeFilter.SHOW_TEXT), rg = document.createRange();
  let n, acc = 0, a = false;
  while ((n = w.nextNode())) {
    const l = n.nodeValue.length;
    if (!a && acc + l > s0) { rg.setStart(n, s0 - acc); a = true; }
    if (a && acc + l >= e0) { rg.setEnd(n, e0 - acc); return rg; }
    acc += l;
  }
  return a ? rg : null;
}
function srUnmark() {
  if (srHl) { try { CSS.highlights.delete('lx-sr'); } catch (e) {} srHl = false; }
  if (colEl) colEl.querySelectorAll('mark.lx-srm').forEach(m => { const p = m.parentNode; if (!p) return; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
}
/* respaldo para WebView antiguos sin resaltado por rangos: se envuelve el texto en un <mark> */
function srWrap(s0, e0) {
  for (const o of textNodes(colEl)) {
    if (o.e <= s0 || o.s >= e0) continue;
    let n = o.n; const a = Math.max(s0, o.s) - o.s, b = Math.min(e0, o.e) - o.s;
    if (!n.data.slice(a, b).trim()) continue;
    if (a > 0) n = n.splitText(a);
    if (b - a < n.data.length) n.splitText(b - a);
    const m = document.createElement('mark'); m.className = 'lx-srm';
    n.parentNode.insertBefore(m, n); m.appendChild(n);
  }
}
function srMarkAt(h) {
  srUnmark(); if (!h) return;
  let ok = false;
  try { const rg = srRange(h.s, h.e); if (rg && window.CSS && CSS.highlights && window.Highlight) { CSS.highlights.set('lx-sr', new Highlight(rg)); srHl = true; ok = true; } } catch (e) {}
  if (!ok) { try { srWrap(h.s, h.e); } catch (e) {} }
  flashAt(h.s);
}
function srPaint() {
  if (!srEl) return;
  if (!sr) { srEl.hidden = true; return; }
  srEl.hidden = false;
  const n = $('#lxSrN', el); if (n) n.textContent = `${sr.cur + 1}/${sr.items.length}${sr.done ? '' : '+'}`;
}
function srMarkCur() {
  const bx = $('#lxR', el); if (!bx || !sr) return;
  bx.querySelectorAll('.cur').forEach(b => b.classList.remove('cur'));
  const b = bx.querySelector(`[data-sr="${sr.cur}"]`); if (b && lastS === sr) b.classList.add('cur');
}
let srBusy = false;
async function srGo(k, fromList) {
  if (srBusy) return;
  const S = fromList ? lastS : sr;
  if (!S || !S.items.length) return;
  srBusy = true;
  try { await srGo2(S, k, fromList); } finally { srBusy = false; }
}
async function srGo2(S, k, fromList) {
  k = Math.max(0, Math.min(S.items.length - 1, k));
  const it = S.items[k]; if (!it) return;
  sr = S; S.cur = k; srPaint();
  if (fromList) { uiWas = false; closePanel(); }
  if (it.i !== si) await show(it.i, { pct: it.pct });
  const h = srFind(S.q, it.n, it.pct);
  if (h) { const p = herePos(h.s); goPoint(p.k, p.f); srMarkAt(h); }
  else if (it.i === si) gotoFrac(it.pct);
}
function srExit() { sr = null; srUnmark(); srPaint(); }

const FONTS = {
  serif: "Georgia,'Times New Roman',serif", book: "'Noto Serif','Droid Serif',Cambria,serif",
  sans: "Roboto,'Noto Sans',system-ui,'Segoe UI',sans-serif", light: "'Roboto Light','sans-serif-light',Roboto,'Segoe UI Light',sans-serif",
  cond: "'sans-serif-condensed','Roboto Condensed','Arial Narrow',sans-serif", mono: "'Courier New','Droid Sans Mono',monospace",
  casual: "'casual','Comic Sans MS',cursive"
};
const FONT_LB = { serif: 'Georgia', book: 'Noto Serif', sans: 'Roboto', light: 'Roboto Light', cond: 'Roboto Condensed', mono: 'Courier New', casual: 'Casual' };
const FGS = ['', '#111111', '#3a3a3a', '#4b3621', '#ffffff', '#e8e4dc', '#bdbdbd', '#e0c27a', '#a8c7a0', '#9db8d9', '#c9a6e3'];
function setPanel() {
  const seg = (name, opts, val) => `<div class="lx-seg">${opts.map(([v, lb]) =>
    `<button type="button" data-set="${name}" data-v="${v}" aria-pressed="${String(val) === String(v)}">${esc(lb)}</button>`).join('')}</div>`;
  panel(`<div class="lx-phead"><button type="button" class="lx-ico" data-x="pclose">${I.back}</button><b>${esc(t('lxAa'))}</b></div>
    <div class="lx-set">
      <div class="lx-row"><span>${esc(t('lxTheme'))}</span><div class="lx-th">
        ${[['light','#fdfcfa','#22202b'],['sepia','#f3e9d6','#3b3222'],['dark','#20202a','#ddd9e4'],['amoled','#000','#cfcbd6']]
          .map(([v,bg,fg])=>`<button type="button" data-set="theme" data-v="${v}" aria-pressed="${P.theme===v}" style="background:${bg};color:${fg}">Aa</button>`).join('')}
      </div></div>
      <div class="lx-row"><span>${esc(T('lxFont'))}</span><div class="lx-fonts">
        ${Object.keys(FONTS).map(k => `<button type="button" data-set="font" data-v="${k}" aria-pressed="${(FONTS[P.font] ? P.font : 'serif') === k}"><i style="font-family:${FONTS[k].replace(/"/g, "'")}">Aa</i><span>${esc(FONT_LB[k])}</span></button>`).join('')}
      </div></div>
      <div class="lx-row"><span>${esc(T('lxFg'))}</span><div class="lx-fgs">
        ${FGS.map(c => `<button type="button" data-set="fg" data-v="${c}" aria-pressed="${(P.fg || '') === c}" aria-label="${esc(c || T('fgAuto'))}" class="${c ? '' : 'auto'}" ${c ? `style="background:${c}"` : ''}>${c ? '' : 'A'}</button>`).join('')}
      </div></div>
      <div class="lx-row"><span>${esc(t('lxSize'))}</span><div class="lx-range"><input type="range" id="lxFs" min="13" max="30" step="1" value="${P.fs}"><b id="lxFsV">${P.fs}</b></div></div>
      <div class="lx-row"><span>${esc(t('lxLine'))}</span><div class="lx-range"><input type="range" id="lxLh" min="12" max="22" step="1" value="${Math.round(P.lh*10)}"><b id="lxLhV">${P.lh.toFixed(1)}</b></div></div>
      <div class="lx-row"><span>${esc(t('lxMargin'))}</span><div class="lx-range"><input type="range" id="lxPd" min="10" max="46" step="2" value="${P.pad}"><b id="lxPdV">${P.pad}</b></div></div>
      <div class="lx-row"><span>${esc(T('bright'))}</span><div class="lx-range"><input type="range" id="lxBrR" min="2" max="100" step="1" value="${Math.round((P.bright != null ? P.bright : (curBright != null ? curBright : 0.5)) * 100)}"><b id="lxBrV">${P.bright == null ? esc(T('brAuto')) : Math.round(P.bright * 100) + '%'}</b></div></div>
      <div class="lx-row"><span>${esc(T('schT'))}</span>${seg('sch',[['off',T('schOff')],['sys',T('schSys')],['time',T('schTime')]],P.sch)}</div>
      <div id="lxSchBox"${P.sch === 'off' ? ' hidden' : ''}>
        <div class="lx-row" id="lxSchTm"${P.sch === 'time' ? '' : ' hidden'}><span>${esc(T('schFrom'))}</span><div class="lx-tm"><input type="time" id="lxSchA" value="${esc(P.schA)}"><i>→</i><input type="time" id="lxSchB" value="${esc(P.schB)}"></div></div>
        <div class="lx-row"><span>${esc(T('schNight'))}</span><div class="lx-th">
          ${[['dark','#20202a','#ddd9e4'],['amoled','#000','#cfcbd6'],['sepia','#f3e9d6','#3b3222']]
            .map(([v,bg,fg])=>`<button type="button" data-set="schTh" data-v="${v}" aria-pressed="${P.schTh===v}" style="background:${bg};color:${fg}">Aa</button>`).join('')}
        </div></div>
        <div class="lx-row"><span>${esc(T('schBr'))}</span><div class="lx-range"><input type="range" id="lxSchBr" min="0" max="100" step="5" value="${P.schBr}"><b id="lxSchBrV">${P.schBr > 0 ? P.schBr + '%' : esc(T('schNoBr'))}</b></div></div>
        <p class="lx-note" style="margin:2px 0 6px">${esc(T('schHint'))}</p>
      </div>
      <div class="lx-row"><span>${esc(T('lxMode'))}</span>${seg('mode',[['page',T('lxModePage')],['scroll',T('lxModeScroll')]],P.mode)}</div>
      <div class="lx-row"><span>${esc(T('lxParas'))}</span>${seg('paras',[['indent',T('parInd')],['spaced',T('parSp')]],P.paras === 'spaced' ? 'spaced' : 'indent')}</div>
      <div class="lx-row" id="lxColsRow"${P.mode === 'page' ? '' : ' hidden'}><span>${esc(T('lxCols'))}</span>${seg('cols',[['2',T('colsTwo')],['1',T('colsOne')]],String(P.cols) === '1' ? 1 : 2)}</div>
      <div class="lx-row" id="lxAnimRow"${P.mode === 'page' ? '' : ' hidden'}><span>${esc(t('lxAnim'))}</span>${seg('anim',[['slide',t('lxAnimSlide')],['curl',T('lxAnimCurl')],['fade',t('lxAnimFade')],['none',t('lxAnimNone')]],P.anim)}</div>
    </div>`);
  const bind = (id, out, fn) => {
    const r = $('#' + id, el); if (!r) return;
    r.addEventListener('input', () => { ensureOff(); fn(+r.value); applyPrefs(); $('#' + out, el).textContent = fn.label(+r.value); });
    r.addEventListener('change', () => { savePrefs(); relayout(true); });
  };
  const mk = (f, l) => { f.label = l; return f; };
  bind('lxFs','lxFsV', mk(v => { P.fs = v; }, v => v));
  bind('lxLh','lxLhV', mk(v => { P.lh = v / 10; }, v => (v / 10).toFixed(1)));
  bind('lxPd','lxPdV', mk(v => { P.pad = v; }, v => v));
  const sa = $('#lxSchA', el), sb = $('#lxSchB', el), sbr = $('#lxSchBr', el);
  [[sa, 'schA'], [sb, 'schB']].forEach(([inp, k]) => inp && inp.addEventListener('change', () => { if (/^\d{1,2}:\d{2}$/.test(inp.value)) { P[k] = inp.value; savePrefs(); schTick(true); } }));
  if (sbr) {
    sbr.addEventListener('input', () => { P.schBr = +sbr.value; $('#lxSchBrV', el).textContent = P.schBr > 0 ? P.schBr + '%' : T('schNoBr'); });
    sbr.addEventListener('change', () => { savePrefs(); if (P.schS === 'night') schTick(true); });
  }
  const br = $('#lxBrR', el);
  if (br) {
    br.addEventListener('input', () => { setBright(br.value / 100); $('#lxBrV', el).textContent = br.value + '%'; });
    br.addEventListener('change', savePrefs);
  }
}

/* menú de "más" */
function menu() {
  const b = curBook(), m = menuEl;
  if (m.classList.contains('on')) return hideMenu();
  const items = [];
  items.push(tts && tts.on ? ['tts', T('stopListen')] : ['tts', T('listen')]);
  items.push(b && b.file2 ? ['delver', T('delVer')] : ['addver', T('addVer')]);
  items.push(['widget', T('addWidget')]);
  items.push(['mark', T('markAs') + ' ' + I.chev]);
  items.push(['about', T('about')]);
  items.push(['share', T('share')]);
  m.innerHTML = items.map(([a, lb]) => a === 'mark' ? `<button type="button" class="lx-mk" data-x="m-mark"><span>${esc(T('markAs'))}</span>${I.chev}</button>` : `<button type="button" data-x="m-${a}">${esc(lb)}</button>`).join('');
  m.classList.add('on');
}
function hideMenu() { const m = menuEl; if (m) m.classList.remove('on'); }
/* "Marcar como…": se cierra el menú de los tres puntos y se abre este panelito */
const STS = [['unread', 'stUnread'], ['reading', 'stReading'], ['read', 'stRead'], ['dropped', 'stDropped']];
function markMenu() {
  const b = curBook(); if (!b) return;
  const now = API.status ? API.status(b) : (API.isRead && API.isRead(b) ? 'read' : 'unread'), m = menuEl;
  m.innerHTML = STS.map(([k, lb]) => `<button type="button" class="lx-mk${k === now ? ' cur' : ''}" data-x="mk-${k}"><span>${esc(T(lb))}</span>${k === now ? I.chk : ''}</button>`).join('');
  m.classList.add('on');
}
function markAs(k) {
  const b = curBook(); if (!b || !API.setStatus) return;
  try { API.setStatus(b, k); } catch (e) { return; }
  const f = STS.find(x => x[0] === k);
  toast(T('markedAs', T(f[1])));
}

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
    u.lang = (bk.lbl || bk.lang || (isEn() ? 'en' : 'es'));
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
const vOpening = [null, null];
async function openVersion(v) {
  if (bks[v]) return bks[v];
  if (vOpening[v]) return vOpening[v];
  const b = curBook(), ref = v ? b.file2 : b.file;
  const pr = (async () => { const k = await openEpub(await FS.get(ref)); if (curBook() === b) { bks[v] = k; setTimeout(() => markJunk(k), 900); } return k; })();
  vOpening[v] = pr;
  try { return await pr; } finally { if (vOpening[v] === pr) vOpening[v] = null; }
}
/* ---------- alineación de las dos versiones ----------
   Una traducción conserva bastante la longitud de cada párrafo (con una proporción casi fija entre los
   dos idiomas) y deja igual lo que no se traduce: nombres propios, números, diálogos. Con eso se
   emparejan primero los capítulos (saltando los que solo existen en una versión: prólogos, notas del
   traductor, índices) y luego los párrafos, aunque una versión parta o junte alguno. Es el método
   clásico de los alineadores de textos paralelos (Gale y Church), con las anclas como pista extra.
   Sale una tabla de equivalencias que se calcula una vez por libro y se guarda. */
const ALV = 'a3';
const alKey2 = b => alKey(b) + '|' + ALV;
const nrm = s => String(s || '').replace(/\s+/g, ' ').trim();
/* Todo el cálculo va autocontenido aquí: se ejecuta en un hilo aparte (Web Worker) para que el lector
   no se trabe mientras se prepara; si el aparato no deja crear el hilo, se ejecuta en este. */
function alignKit() {
  const NC = new Map();
  const nz = w => { let k = NC.get(w); if (k === undefined) { k = w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); if (NC.size < 300000) NC.set(w, k); } return k; };
  const WRE = /[\p{L}\p{N}][\p{L}\p{N}'’]*/gu;
  const SENT = /(^|[.!?…:;—–―"“«(\[]\s*)$/;
  const DLG = /^[—–―\-"“«‘']/;
  function eachWord(s, fn) { WRE.lastIndex = 0; let m; while ((m = WRE.exec(s))) fn(m[0], m.index); }
  /* nombres propios de una versión: palabras en mayúscula a mitad de frase que casi nunca salen en minúscula */
  function namesOf(chs) {
    const cap = new Map(), low = new Map();
    for (const ps of chs) for (const p of ps) eachWord(p, (w, at) => {
      if (w.length < 3) return;
      const c = w.charCodeAt(0); if (c >= 48 && c <= 57) return;
      const k = nz(w);
      if (w[0] !== w[0].toLowerCase()) { if (!SENT.test(p.slice(Math.max(0, at - 3), at))) cap.set(k, (cap.get(k) || 0) + 1); }
      else low.set(k, (low.get(k) || 0) + 1);
    });
    const out = new Set();
    cap.forEach((n, k) => { if (n >= 2 && (low.get(k) || 0) <= n * 0.15) out.add(k); });
    return out;
  }
  const numKey = w => { const d = w.replace(/\D/g, ''); return d.length >= 2 ? '#' + d : null; };
  function numsOf(chs) {
    const s = new Set();
    for (const ps of chs) for (const p of ps) eachWord(p, w => { const c = w.charCodeAt(0); if (c >= 48 && c <= 57) { const k = numKey(w); if (k) s.add(k); } });
    return s;
  }
  /* anclas de un texto: solo las que existen en las dos versiones (dict) */
  function anchorsOf(p, dict) {
    const out = [];
    eachWord(p, w => {
      const c = w.charCodeAt(0);
      const k = c >= 48 && c <= 57 ? numKey(w) : (w.length >= 3 ? nz(w) : null);
      if (k == null) return;
      const id = dict.get(k);
      if (id != null && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }
  /* Programación dinámica: empareja X[0..n) con Y[0..m) en "cuentas" de 1-1, 1-0, 0-1, 2-1, 1-2 o 2-2.
     Solo se miran las casillas cerca de "cen" (el camino que marca la longitud acumulada del texto). */
  const MV = [[1, 1], [1, 0], [0, 1], [2, 1], [1, 2], [2, 2]];
  function dpAlign(n, m, cost, cen, band) {
    if (!n || !m) {
      const out = [];
      for (let i = 0; i < n; i++) out.push([i, 1, m, 0]);
      for (let j = 0; j < m; j++) out.push([n, 0, j, 1]);
      return out;
    }
    const lo = new Int32Array(n + 1), hi = new Int32Array(n + 1), off = new Int32Array(n + 2);
    for (let i = 0; i <= n; i++) {
      const c = cen ? cen[i] : Math.round(i * m / n);
      lo[i] = band ? Math.max(0, c - band) : 0; hi[i] = band ? Math.min(m, c + band) : m;
      if (i === n) hi[i] = m;
      if (i === 0) lo[i] = 0;
      off[i + 1] = off[i] + Math.max(0, hi[i] - lo[i] + 1);
    }
    const at = (i, j) => (j < lo[i] || j > hi[i]) ? -1 : off[i] + j - lo[i];
    const D = new Float64Array(off[n + 1]).fill(Infinity), Bk = new Uint8Array(off[n + 1]);
    D[at(0, 0)] = 0;
    for (let i = 0; i <= n; i++) for (let j = lo[i]; j <= hi[i]; j++) {
      if (!i && !j) continue;
      let best = Infinity, bm = 0;
      for (let q = 0; q < 6; q++) {
        const di = MV[q][0], dj = MV[q][1];
        if (i < di || j < dj) continue;
        const y = at(i - di, j - dj); if (y < 0) continue;
        const p = D[y]; if (p === Infinity) continue;
        const c = p + cost(i - di, di, j - dj, dj);
        if (c < best) { best = c; bm = q; }
      }
      const x = at(i, j); D[x] = best; Bk[x] = bm;
    }
    const e = at(n, m);
    if (e < 0 || D[e] === Infinity) return null;
    const out = []; let i = n, j = m;
    while (i > 0 || j > 0) { const q = Bk[at(i, j)]; i -= MV[q][0]; j -= MV[q][1]; out.push([i, MV[q][0], j, MV[q][1]]); }
    return out.reverse();
  }
  /* coste de emparejar párrafos: longitud parecida (en proporción), anclas en común, diálogo con diálogo */
  function parCost(X, Y, r) {
    const lr = Math.log(r), LX = X.map(p => Math.log(p.n + 25)), LY = Y.map(p => Math.log(p.n + 25));
    return (i, di, j, dj) => {
      if (!di) return 4.6 + Math.min(4, Y[j].n / 400);
      if (!dj) return 4.6 + Math.min(4, X[i].n / 400);
      let g;
      if (di === 1 && dj === 1) g = LY[j] - LX[i] - lr;
      else { const la = di === 1 ? X[i].n : X[i].n + X[i + 1].n, lb = dj === 1 ? Y[j].n : Y[j].n + Y[j + 1].n; g = Math.log((lb + 25) / (r * (la + 25))); }
      let c = g * g * 5.5556;               /* = g²/(2·0,3²): la traducción varía ±30 % por párrafo */
      if (di + dj === 3) c += 2.3; else if (di + dj === 4) c += 4.4;
      const xa = X[i].a, ya = Y[j].a, xb = di === 2 ? X[i + 1].a : null, yb = dj === 2 ? Y[j + 1].a : null;
      const na = xa.length + (xb ? xb.length : 0), nb = ya.length + (yb ? yb.length : 0);
      if (na || nb) {
        let mm = 0;
        for (let t = 0; t < 2; t++) {
          const src = t ? xb : xa; if (!src) continue;
          for (let q = 0; q < src.length; q++) { const v = src[q]; if (ya.indexOf(v) >= 0 || (yb && yb.indexOf(v) >= 0)) mm++; }
        }
        const un = Math.max(0, na + nb - 2 * mm);
        c += -1.1 * Math.min(4, mm) + 0.5 * Math.min(4, un);
      }
      if (di === 1 && dj === 1 && X[i].d !== Y[j].d) c += 0.7;
      return c;
    };
  }
  /* coste de emparejar capítulos: longitud total y nombres que salen en cada uno */
  function chCost(X, Y, r) {
    const uni = (Z, i, d) => { if (d === 1) return Z[i].s; const s = new Set(Z[i].s); Z[i + 1].s.forEach(v => s.add(v)); return s; };
    return (i, di, j, dj) => {
      const la = di ? X[i].n + (di === 2 ? X[i + 1].n : 0) : 0, lb = dj ? Y[j].n + (dj === 2 ? Y[j + 1].n : 0) : 0;
      if (!di) return lb < 300 ? 0.2 : 1.5 + Math.min(8, lb / 1500);
      if (!dj) return la < 300 ? 0.2 : 1.5 + Math.min(8, la / 1500);
      const g = Math.log((lb + 300) / (r * (la + 300)));
      let c = g * g * 12.5;                 /* = g²/(2·0,2²) */
      if (di + dj === 3) c += 2; else if (di + dj === 4) c += 4;
      const A = uni(X, i, di), B = uni(Y, j, dj);
      if (A.size >= 3 && B.size >= 3) { let mm = 0; A.forEach(v => { if (B.has(v)) mm++; }); c += 3 * (1 - mm / (A.size + B.size - mm)); }
      return c;
    };
  }
  /* el camino que marca la longitud: para cada párrafo de X, el de Y que está a la misma altura del texto */
  function lenCenter(X, Y, r) {
    const n = X.length, m = Y.length, cen = new Int32Array(n + 1);
    let px = 0, py = 0, j = 0;
    for (let i = 0; i <= n; i++) {
      const want = px * r;
      while (j < m && py + Y[j].n / 2 < want) { py += Y[j].n; j++; }
      cen[i] = j;
      if (i < n) px += X[i].n;
    }
    cen[0] = 0; cen[n] = m;
    return cen;
  }
  function build(tx, ty) {
    const nx = namesOf(tx), ny = namesOf(ty), kx = numsOf(tx), ky = numsOf(ty);
    const dict = new Map(), an = [];
    nx.forEach(k => { if (ny.has(k)) { dict.set(k, an.length); an.push(k); } });
    kx.forEach(k => { if (ky.has(k)) { dict.set(k, an.length); an.push(k); } });
    const items = chs => chs.map(ps => ps.map(p => ({ n: p.length || 1, a: anchorsOf(p, dict), d: DLG.test(p) })));
    const IX = items(tx), IY = items(ty);
    const cum = I => { const c = [0]; I.forEach(ps => c.push(c[c.length - 1] + ps.length)); return c; };
    const ca = cum(IX), cb = cum(IY), la = [], lb = [];
    IX.forEach(ps => ps.forEach(p => la.push(p.n))); IY.forEach(ps => ps.forEach(p => lb.push(p.n)));
    const tA = la.reduce((s, n) => s + n, 0) || 1, tB = lb.reduce((s, n) => s + n, 0) || 1;
    /* 1) capítulos */
    const chs = I => I.map(ps => { const s = new Set(); let n = 0; ps.forEach(p => { n += p.n; p.a.forEach(v => s.add(v)); }); return { n, s }; });
    const CX = chs(IX), CY = chs(IY);
    const cbd = dpAlign(CX.length, CY.length, chCost(CX, CY, tB / tA), null, 0) || [[0, CX.length, 0, CY.length]];
    /* proporción real entre los dos idiomas, medida solo en los capítulos emparejados */
    let mA = 0, mB = 0;
    cbd.forEach(([i, di, j, dj]) => { if (di && dj) { for (let q = 0; q < di; q++) mA += CX[i + q].n; for (let q = 0; q < dj; q++) mB += CY[j + q].n; } });
    const r = mA && mB ? mB / mA : tB / tA;
    /* 2) párrafos, dentro de cada pareja de capítulos */
    const bd = [];
    for (const [i, di, j, dj] of cbd) {
      const X = [], Y = [];
      for (let q = 0; q < di; q++) X.push(...IX[i + q]);
      for (let q = 0; q < dj; q++) Y.push(...IY[j + q]);
      const a0 = ca[i], b0 = cb[j];
      if (!X.length || !Y.length) { bd.push(a0, X.length, b0, Y.length); continue; }
      const N = Math.max(X.length, Y.length), cost = parCost(X, Y, r), cen = lenCenter(X, Y, r);
      let pb = null;
      for (const band of [Math.max(25, Math.min(120, Math.ceil(0.04 * N))), Math.max(60, Math.ceil(0.2 * N)), 0]) {
        pb = dpAlign(X.length, Y.length, cost, band ? cen : null, band);
        if (pb) break;
      }
      if (!pb) pb = [[0, X.length, 0, Y.length]];
      for (const [x, dx, y, dy] of pb) bd.push(a0 + x, dx, b0 + y, dy);
    }
    return { ca, cb, la, lb, bd, an, r };
  }
  return { build, anchorsOf, eachWord, nz };
}
const AK = alignKit();
/* el cálculo en un hilo aparte; si no se puede (o falla), aquí mismo */
function alignAway(tx, ty) {
  return new Promise((ok, ko) => {
    let w = null, done = false;
    const end = (f, v) => { if (done) return; done = true; clearTimeout(tm); try { if (w) w.terminate(); } catch (e) {} f(v); };
    const tm = setTimeout(() => end(ko, new Error('tiempo')), 120000);
    try {
      const src = alignKit.toString() + '\nconst K = alignKit();\nonmessage = e => { try { postMessage({ ok: K.build(e.data.tx, e.data.ty) }); } catch (er) { postMessage({ err: String((er && er.message) || er) }); } };';
      const u = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      w = new Worker(u);
      setTimeout(() => { try { URL.revokeObjectURL(u); } catch (e) {} }, 10000);
    } catch (e) { return end(ko, e); }
    w.onmessage = e => { const d = e.data || {}; if (d.ok) end(ok, d.ok); else end(ko, new Error(d.err || 'worker')); };
    w.onerror = ev => { try { ev.preventDefault(); } catch (e) {} end(ko, new Error('worker')); };
    w.postMessage({ tx, ty });
  });
}
/* todo el texto de una versión, párrafo a párrafo, capítulo a capítulo (los mismos párrafos que se ven al leer) */
async function bookTexts(x) {
  const out = [];
  for (let i = 0; i < x.spine.length; i++) {
    let ps = [];
    try { const body = await bodyOf(x, x.spine[i]); if (body) ps = leafParas(body).map(e => nrm(e.textContent)); } catch (e) {}
    out.push(ps);
    if (i % 2 === 1) await sleep(0);
  }
  return out;
}
let alWhere = '';
async function buildAlign() {
  const tx = await bookTexts(await openVersion(0)), ty = await bookTexts(await openVersion(1));
  let core;
  try { core = await alignAway(tx, ty); alWhere = 'hilo'; }
  catch (e) { await sleep(0); core = AK.build(tx, ty); alWhere = 'principal'; }
  return Object.assign({ v: ALV, ts: Date.now() }, core);
}
let alP = null, alFor = '';
async function getAlign(force) {
  const b = curBook(), key = alKey2(b);
  if (!force && alP && alFor === key) return alP;
  alFor = key;
  const pr = (async () => {
    if (!force) { const c = await idbGet(key); if (c && c.v === ALV && c.bd) return c; }
    const al = await buildAlign();
    await idbPut(key, al);
    return al;
  })();
  alP = pr;
  try { return await pr; } catch (e) { if (alP === pr) alP = null; throw e; }
}
/* De (capítulo, párrafo, punto dentro del párrafo) en una versión al mismo sitio en la otra.
   Dentro de cada pareja de párrafos se reparte por caracteres, así que también acierta a mitad de párrafo. */
function alPos(al, from, i, k, f) {
  const SC = from ? al.cb : al.ca, TC = from ? al.ca : al.cb, SL = from ? al.lb : al.la, TL = from ? al.la : al.lb;
  const bd = al.bd, nb = bd.length / 4, so = from ? 2 : 0, to = from ? 0 : 2;
  const totS = SC[SC.length - 1], totT = TC[TC.length - 1];
  if (!nb || !totT) return { i: 0, k: 0, f: 0 };
  const g = Math.max(0, Math.min(totS - 1, SC[Math.max(0, Math.min(i, SC.length - 2))] + Math.max(0, k)));
  let lo = 0, hi = nb - 1, b = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (bd[mid * 4 + so] <= g) { b = mid; lo = mid + 1; } else hi = mid - 1; }
  while (b > 0 && !(g < bd[b * 4 + so] + bd[b * 4 + so + 1])) b--;
  const sS = bd[b * 4 + so], sN = bd[b * 4 + so + 1], tS = bd[b * 4 + to], tN = bd[b * 4 + to + 1];
  let tot = 0, before = 0;
  for (let x = 0; x < sN; x++) { const l = SL[sS + x] || 1; if (sS + x < g) before += l; else if (sS + x === g) before += l * (f || 0); tot += l; }
  const fr = tot ? before / tot : 0;
  let tg = Math.min(tS, totT - 1), tf = 0;
  if (tN > 0) {
    let T = 0; for (let x = 0; x < tN; x++) T += TL[tS + x] || 1;
    const want = fr * T; let acc = 0;
    for (let x = 0; x < tN; x++) {
      const l = TL[tS + x] || 1;
      if (acc + l > want || x === tN - 1) { tg = tS + x; tf = Math.max(0, Math.min(0.999, (want - acc) / l)); break; }
      acc += l;
    }
  }
  let j = 0; while (j < TC.length - 2 && TC[j + 1] <= tg) j++;
  return { i: j, k: tg - TC[j], f: tf };
}
const langCode = v => (((curBook() || {}).vl || [])[v] || (bks[v] && bks[v].lang) || (v ? 'B' : 'A')).toUpperCase();
/* idioma de verdad: se mira el texto (los metadatos de muchos epub mienten o faltan) y solo si no se distingue se usa el metadato */
const STOP = {
  es: 'de la que el en y los se del las un por con no una su para es al lo como más pero sus le ya este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante era fue había',
  en: 'the of and to in that is was he for it with as his on be at by had not are but from or have an they which one you were her all she there would their we him been has when who will more if out so said what up its about into than them can only',
  fr: 'de la le les et des en un du une que est pour qui dans ce il pas plus par sur se ne au avec son sont mais ou comme nous vous elle était',
  pt: 'de que e o a do da em um para é com não uma os no se na por mais as dos como mas foi ao ele das tem seu sua ou ser quando muito havia',
  it: 'di che e la il un per in è non una sono con le si da come ma del lo al più gli suo era',
  de: 'der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als auch es an werden aus er hat dass sie nach wird bei war',
  ca: 'de la que el i en a els les un per amb no una és al es del com més però'
};
const STOPS = Object.keys(STOP).map(k => [k, new Set(STOP[k].split(' '))]);
function detectLang(text) {
  const w = (text.toLowerCase().match(/[a-záéíóúàèìòùâêîôûäëïöüçñãõß']+/g) || []);
  if (w.length < 80) return '';
  const sc = STOPS.map(([k, set]) => { let n = 0; for (const x of w) if (set.has(x)) n++; return [k, n / w.length]; }).sort((a, z) => z[1] - a[1]);
  return sc[0][1] >= 0.1 && sc[0][1] >= sc[1][1] * 1.2 ? sc[0][0] : '';
}
async function sampleLang(b) {
  const n = b.spine.length, tries = [Math.floor(n * 0.4), Math.floor(n * 0.6), 1, 2, Math.floor(n * 0.2)];
  for (const i of tries) {
    const it = b.spine[i]; if (!it || (b.w[i] || 0) < 2500) continue;
    try {
      const raw = await b.grab(it.href);
      const txt = raw.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
      const lg = detectLang(txt.slice(0, 9000)); if (lg) return lg;
    } catch (e) {}
  }
  return '';
}
async function labelVers() {
  const b = curBook(); if (!b) return;
  const vl = (b.vl || []).slice(0, 2);
  for (const v of b.file2 ? [0, 1] : [0]) {
    if (!bks[v] && vl[v] == null) { try { await openVersion(v); } catch (e) { continue; } }
    const k = bks[v]; if (!k) continue;
    if (k.lbl === undefined) k.lbl = (await sampleLang(k)) || (k.lang || '');
    vl[v] = k.lbl;
  }
  if (!b.file2) { if (b.vl) { delete b.vl; try { save(); } catch (e) {} } return; }
  if (JSON.stringify(vl) !== JSON.stringify(b.vl || [])) { b.vl = vl; try { save(); } catch (e) {} }
  paintLang();
}
function paintLang() {
  const b = curBook(), btn = langEl;
  if (!btn) return;
  btn.hidden = !(b && b.file2);
  if (b && b.file2) {
    btn.textContent = langCode(ver);
    btn.setAttribute('aria-label', langCode(1 - ver));
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* preparar la alineación puede tardar: sin esto, dos toques seguidos lanzan dos cambios a la vez
   y la versión y el texto acaban descolocados */
let swapping = false, lastSwap = null;
/* dónde empieza cada párrafo de la columna (en caracteres del texto del capítulo) */
function paraMap() {
  const list = paras(), idx = new Map(list.map((e, k) => [e, k]));
  const st = new Array(list.length).fill(-1), ln = new Array(list.length).fill(0);
  let acc = 0;
  for (const n of colTexts()) {
    let p = n.parentNode; while (p && p !== colEl && !idx.has(p)) p = p.parentNode;
    if (p && idx.has(p)) { const k = idx.get(p); if (st[k] < 0) st[k] = acc; ln[k] += n.nodeValue.length; }
    acc += n.nodeValue.length;
  }
  return { list, st, ln };
}
/* el punto de partida: el principio de lo seleccionado o, si no hay nada, el principio de la página */
function herePos(selS) {
  const pm = paraMap(), n = pm.list.length;
  if (!n) return { k: 0, f: 0 };
  let off = selS;
  if (off == null && P.mode !== 'scroll') off = anchorOff();
  if (off == null) {
    const k = topPara(), e = pm.list[k];
    let f = 0;
    if (e && P.mode === 'scroll') { const r = e.getBoundingClientRect(), wr = wrapEl.getBoundingClientRect(); if (r.height > 0) f = Math.max(0, Math.min(0.999, (wr.top - r.top) / r.height)); }
    return { k, f };
  }
  for (let k = 0; k < n; k++) {
    if (pm.st[k] < 0) continue;
    if (off < pm.st[k]) return { k, f: 0 };
    if (off < pm.st[k] + pm.ln[k]) return { k, f: (off - pm.st[k]) / Math.max(1, pm.ln[k]) };
  }
  return { k: n - 1, f: 0.999 };
}
function offOfPara(k, f) {
  const pm = paraMap(); if (!pm.list.length) return null;
  k = Math.max(0, Math.min(pm.list.length - 1, k));
  if (pm.st[k] < 0) return null;
  return pm.st[k] + Math.min(Math.max(0, pm.ln[k] - 1), Math.floor((f || 0) * pm.ln[k]));
}
/* la caja del carácter número "off" de la columna */
function rectAt(off) {
  const w = document.createTreeWalker(colEl, NodeFilter.SHOW_TEXT); let n, acc = 0;
  while ((n = w.nextNode())) {
    const l = n.nodeValue.length;
    if (acc + l > off) {
      const rg = document.createRange(), k = Math.max(0, off - acc);
      rg.setStart(n, k); rg.setEnd(n, Math.min(l, k + 1));
      const r = [...rg.getClientRects()].find(x => x.width > 0 || x.height > 0);
      if (r) return r;
    }
    acc += l;
  }
  return null;
}
/* lleva la vista a un punto concreto de un párrafo (no solo a su principio) */
function goPoint(k, f) {
  const off = offOfPara(k, f);
  if (off == null) { gotoPara(k); return null; }
  if (P.mode === 'scroll') {
    const r = rectAt(off);
    if (r) { wrapEl.scrollTop += r.top - wrapEl.getBoundingClientRect().top - 24; paint(); } else gotoPara(k);
    return off;
  }
  const pg = pageOfOff(off);
  if (pg != null) { page = pg; paint(); } else gotoPara(k);
  return off;
}
/* resalta en morado la línea a la que se ha saltado */
function flashAt(off) {
  if (off == null || !el) return;
  const r = rectAt(off); if (!r) return;
  const pm = paraMap(); let fr = null;
  for (let k = 0; k < pm.list.length && !fr; k++) {
    if (pm.st[k] < 0 || off < pm.st[k] || off >= pm.st[k] + pm.ln[k]) continue;
    fr = [...pm.list[k].getClientRects()].find(q => r.left >= q.left - 2 && r.right <= q.right + 2 && r.top >= q.top - 2 && r.bottom <= q.bottom + 2) || null;
  }
  const L = fr ? fr.left : r.left, Wd = fr ? fr.width : Math.max(40, r.width);
  const root = el.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'lx-flash';
  d.style.cssText = `left:${(L - root.left - 4).toFixed(1)}px;top:${(r.top - root.top - 1).toFixed(1)}px;width:${(Wd + 8).toFixed(1)}px;height:${(r.height + 2).toFixed(1)}px`;
  el.appendChild(d);
  setTimeout(() => d.remove(), 1700);
}
/* ---- afinado con internet (solo con texto seleccionado y si hay conexión) ----
   Se traduce SOLO el trozo seleccionado (o su frase) con MyMemory y se busca en los párrafos vecinos
   cuál dice lo mismo. Si no hay conexión o tarda, se queda lo que calculó la alineación. */
const isoOf = v => {
  const b = curBook() || {}, x = String(((b.vl || [])[v]) || (bks[v] && (bks[v].lbl || bks[v].lang)) || '').toLowerCase().slice(0, 2);
  return /^[a-z]{2}$/.test(x) ? x : '';
};
const TRC = new Map();
async function webTr(q, from, to) {
  if (!q || !from || !to || from === to || navigator.onLine === false || typeof fetch !== 'function') return null;
  const s = q.slice(0, 480), key = from + '|' + to + '|' + s;
  if (TRC.has(key)) return TRC.get(key);
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  const tm = setTimeout(() => { try { if (ac) ac.abort(); } catch (e) {} }, 4000);
  try {
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(s) + '&langpair=' + from + '|' + to, ac ? { signal: ac.signal } : {});
    if (!r.ok) return null;
    const j = await r.json();
    const out = j && j.responseData && +j.responseStatus === 200 ? String(j.responseData.translatedText || '') : '';
    if (!out || /MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(out)) return null;
    TRC.set(key, out);
    return out;
  } catch (e) { return null; } finally { clearTimeout(tm); }
}
/* la frase que contiene la selección, para traducir algo con sentido si se seleccionó poco */
function sentAround(t, s, e) {
  let a = Math.max(0, s), z = Math.max(a, e);
  while (a > 0 && !/[.!?…]/.test(t[a - 1])) a--;
  while (z < t.length && !/[.!?…]/.test(t[z])) z++;
  return t.slice(a, Math.min(t.length, z + 1)).trim();
}
const STN = new Map();
const stopOf = lg => { if (!STN.has(lg)) { const x = STOPS.find(s => s[0] === lg); STN.set(lg, x ? new Set([...x[1]].map(w => norm(w))) : null); } return STN.get(lg); };
/* palabras con contenido (raíz de 5 letras, para que "relojes" y "reloj" cuenten igual) */
function keysOf(s, lg) {
  const st = stopOf(lg), out = new Set();
  AK.eachWord(s, w => { const k = norm(w); if (k.length >= 4 && !(st && st.has(k))) out.add(k.slice(0, 5)); });
  return out;
}
/* cuánto de la traducción aparece junto en un párrafo, y dónde */
function overlapAt(t, W, lg) {
  const st = stopOf(lg), toks = [];
  AK.eachWord(t, (w, at) => { const k = norm(w); if (k.length >= 4 && !(st && st.has(k))) toks.push([k.slice(0, 5), at]); });
  if (!toks.length || !W.size) return { ov: 0, f: null };
  const L = Math.max(4, W.size + 3);
  let bc = 0, bi = 0;
  for (let i = 0; i < toks.length; i++) {
    if (!W.has(toks[i][0])) continue;
    const got = new Set();
    for (let j = i; j < Math.min(toks.length, i + L); j++) if (W.has(toks[j][0])) got.add(toks[j][0]);
    if (got.size > bc) { bc = got.size; bi = i; }
  }
  return { ov: bc / W.size, f: bc ? toks[bi][1] / Math.max(1, t.length) : null };
}
/* con texto seleccionado: entre los párrafos vecinos del calculado, el que de verdad dice lo mismo.
   Pistas: los nombres y números de lo seleccionado y, si hay, su traducción. Sin una mejora clara no se mueve. */
function refineSel(al, m, q, tr, lgT) {
  const list = paras(); if (!list.length) return m;
  if (!al._d) { al._d = new Map(); (al.an || []).forEach((k, i) => al._d.set(k, i)); }
  const dict = al._d, sa = AK.anchorsOf(q, dict), W = tr ? keysOf(tr, lgT) : null;
  const k0 = Math.max(0, Math.min(list.length - 1, m.k)), cand = [];
  for (let c = Math.max(0, k0 - 5); c <= Math.min(list.length - 1, k0 + 5); c++) {
    const t = list[c].textContent || '';
    let am = 0;
    if (sa.length) { const ca = AK.anchorsOf(t, dict); for (const v of sa) if (ca.indexOf(v) >= 0) am++; }
    const o = W && W.size >= 2 ? overlapAt(t, W, lgT) : { ov: 0, f: null };
    cand.push({ c, am, ov: o.ov, f: o.f, d: Math.abs(c - k0) });
  }
  const sc = x => 6 * x.ov + 1.5 * x.am - 0.3 * x.d;
  const me = cand.find(x => x.c === k0);
  let best = me;
  for (const x of cand) if (sc(x) > sc(best)) best = x;
  if (best !== me && (best.ov - me.ov) * 6 + (best.am - me.am) * 1.5 < 0.9) best = me;
  /* dentro del párrafo: donde aparece la traducción; si no, el punto calculado */
  const f = best.f != null && best.ov >= 0.3 ? best.f : (best === me ? m.f : 0);
  return { i: m.i, k: best.c, f };
}
/* Cambiar de versión. Sin selección: el sitio equivalente al principio de la página.
   Con selección: el párrafo equivalente a lo seleccionado (afinado con internet si hay). */
async function switchVer(sel) {
  srExit();
  const b = curBook();
  if (!b || !b.file2 || busy || swapping) return;
  const from = ver, to = 1 - ver, move = moveEl;
  swapping = true;
  if (chapDone) chapDone();
  ttsStop();
  try {
    const here = herePos(sel ? sel.s : null), src = { i: si, k: here.k, f: here.f };
    /* si no te moviste desde el último cambio, se vuelve al punto exacto de antes (ida y vuelta sin derivas) */
    const back = !sel && lastSwap && lastSwap.to === from && lastSwap.si === si && lastSwap.page === page && lastSwap.mode === P.mode ? lastSwap.back : null;
    /* con selección: se pide la traducción ya, mientras se prepara todo lo demás */
    let trP = null, q = '';
    const lgT = isoOf(to);
    if (sel && sel.q) {
      const pe = paras()[here.k];
      q = sel.q;
      if (pe && q.split(/\s+/).length < 4) {
        const pm = paraMap(), st = pm.st[here.k] >= 0 ? pm.st[here.k] : 0;
        q = sentAround(pe.textContent || '', sel.s - st, sel.e - st) || q;
      }
      trP = webTr(nrm(q), isoOf(from), lgT);
    }
    const slow = setTimeout(() => toast(T('verPrep')), 500);
    let al;
    try { al = await getAlign(); await openVersion(to); } catch (e) { clearTimeout(slow); toast(T('verBad')); return; }
    clearTimeout(slow);
    if (!curBook() || curBook() !== b || !b.file2) return;   /* se cerró el libro o se quitó la versión */
    const m = back || alPos(al, from, si, here.k, here.f);
    writePos();
    move.style.transition = 'opacity .2s linear'; move.style.opacity = '0';
    await sleep(200);
    ver = to; bk = bks[to];
    await show(m.i, { para: m.k, pf: m.f });
    let land = m, late = false;
    if (sel && !back) {
      /* la traducción se pidió al principio: se le da un momento (sin dejar la pantalla en blanco más de
         la cuenta); si llega después, se corrige sola, pero solo si no has pasado página */
      const tr = trP ? await Promise.race([trP, sleep(600).then(() => undefined)]) : null;
      if (tr === undefined) late = true;
      const r2 = refineSel(al, m, q || sel.q, tr || null, lgT);
      if (r2.k !== m.k || Math.abs(r2.f - m.f) > 0.04) { land = r2; goPoint(r2.k, r2.f); }
    }
    move.style.opacity = '1';
    await sleep(210);
    paintLang();
    writePos();
    flashAt(offOfPara(land.k, land.f));
    lastSwap = { to, si, page, mode: P.mode, back: src };
    if (late) trP.then(tr => {
      if (!tr || ver !== to || !lastSwap || lastSwap.si !== si || lastSwap.page !== page || busy || swapping) return;
      const r3 = refineSel(al, land, q || sel.q, tr, lgT);
      if (r3.k === land.k) return;
      goPoint(r3.k, r3.f); lastSwap.page = page; writePos();
      flashAt(offOfPara(r3.k, r3.f));
    });
  } finally {
    move.style.transition = ''; move.style.opacity = '';
    swapping = false;
  }
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
  const b = curBook(); if (!b || swapping) return;
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
  labelVers();
  toast(T('verAdded'));
}
async function delVersion() {
  const b = curBook(); if (!b || !b.file2 || swapping) return;
  if (ver === 1) { await switchVer(); if (ver === 1) return; }
  FS.del(b.file2);
  idbPut(alKey(b), null); idbPut(alKey2(b), null); alP = null; lastSwap = null;
  delete b.file2; delete b.vl; bks[1] = null;
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
    if (s.dataset.set === 'mode') {
      const f = frac(); applyPrefs();
      const ar = $('#lxAnimRow', el); if (ar) ar.hidden = P.mode !== 'page';
      const cr = $('#lxColsRow', el); if (cr) cr.hidden = P.mode !== 'page';
      relayout(false); gotoFrac(f);
    } else applyPrefs();
    if (s.dataset.set === 'sch') { const bx = $('#lxSchBox', el); if (bx) bx.hidden = P.sch === 'off'; const tm = $('#lxSchTm', el); if (tm) tm.hidden = P.sch !== 'time'; schTick(true); }
    if (s.dataset.set === 'schTh') schTick(true);
    if (s.dataset.set === 'anim') curlWarm();
    if (s.dataset.set === 'cols' || s.dataset.set === 'paras' || s.dataset.set === 'font') { ensureOff(); relayout(true); }
    return;
  }
  const tb = e.target.closest('[data-tab]');
  if (tb) return tocPanel(tb.dataset.tab);
  const rm = e.target.closest('[data-rmm]');
  if (rm) { const b = curBook(); b.marks = b.marks.filter(m => m.id !== rm.dataset.rmm); if (!b.marks.length) delete b.marks; try { save(); } catch (e2) {} paintBm(); return tocPanel('bm'); }
  const rl = e.target.closest('[data-rml]');
  if (rl) { const b = curBook(); b.looks = (b.looks || []).filter(x => x.id !== rl.dataset.rml); if (!b.looks.length) delete b.looks; try { save(); } catch (e2) {} return tocPanel('lk'); }
  const rk = e.target.closest('[data-relk]');
  if (rk) { const x = ((curBook() || {}).looks || []).find(z => z.id === rk.dataset.relk); if (x) lookUp(x.q, x.k); return; }
  const rh = e.target.closest('[data-rmh]');
  if (rh) { const b = curBook(); b.hl = b.hl.filter(h => h.id !== rh.dataset.rmh); if (!b.hl.length) delete b.hl; try { save(); } catch (e2) {} repaintHl(); return tocPanel('hl'); }
  const sg = e.target.closest('[data-sr]');
  if (sg) { srGo(+sg.dataset.sr, true); return; }
  const g = e.target.closest('[data-go]');
  if (g) {
    let pct = g.dataset.pct != null ? +g.dataset.pct : null;
    let para = null;
    if (g.dataset.hl) {
      const h = (curBook().hl || []).find(x => x.id === g.dataset.hl);
      /* un subrayado se ubica por su posición en el texto del capítulo */
      if (h) pct = null, para = { s: h.s };
    }
    uiWas = false; closePanel();
    if (para) return showAtOffset(+g.dataset.go, para.s);
    show(+g.dataset.go, { pct }); return;
  }
  const x = e.target.closest('[data-x]');
  if (!x) { hideMenu(); return; }
  const a = x.dataset.x;
  if (a !== 'more') hideMenu();
  if (a.slice(0, 3) === 'mk-') return markAs(a.slice(3));
  if (a.slice(0, 3) === 'qs-' && qc) {
    qc.sty = a.slice(3); const cv = $('#lxQc', el); if (cv) drawQuote(cv, qc);
    panelEl.querySelectorAll('.lx-qsty button').forEach(bn => bn.setAttribute('aria-pressed', String(bn.dataset.x === a)));
    return;
  }
  switch (a) {
    case 'close': return close();
    case 'pclose': return closePanel();
    case 'toc': return tocPanel('ch');
    case 'find': return findPanel();
    case 'srprev': return sr && srGo((sr.cur - 1 + sr.items.length) % sr.items.length);
    case 'srnext': return sr && srGo((sr.cur + 1) % sr.items.length);
    case 'srlist': return findPanel(true);
    case 'srx': return srExit();
    case 'set': return setPanel();
    case 'prev': return go(-1);
    case 'next': return go(1);
    case 'bm': return toggleBm();
    case 'more': return menu();
    case 'lang': { const sv = selInfo && selInfo.k >= 0 ? { s: selInfo.s, e: selInfo.e, q: selInfo.q, k: selInfo.k } : null; if (sv) { const sl = getSelection(); if (sl) sl.removeAllRanges(); selInfo = null; hideDock(); } return switchVer(sv); }
    case 'chprev': return show(si - 1);
    case 'chnext': return show(si + 1);
    case 'm-tts': return tts && tts.on ? ttsStop() : ttsStart();
    case 'm-addver': return addVersion();
    case 'm-mark': hideMenu(); return setTimeout(markMenu, 130);
    case 'm-widget': hideMenu(); return addWidget();
    case 'covsave': return saveCover();
    case 'qshare': return quoteOut(true);
    case 'qsave': return quoteOut(false);
    case 'qcard': {
      let tx = selInfo ? selInfo.q : '';
      if (!tx && hlEdit) tx = (colEl.textContent || '').slice(hlEdit.s, hlEdit.e) || hlEdit.q || '';
      const sl = getSelection(); if (sl) sl.removeAllRanges();
      selInfo = null; hideDock();
      return quotePanel(tx);
    }
    case 'm-about': hideMenu(); return aboutPanel();
    case 'm-share': hideMenu(); return shareFile();
    case 'orient': return toggleOrient();
    case 'm-delver': return delVersion();
    case 'tpause': if (!tts) return; if (tts.paused) { tts.paused = false; ttsGo(tts.k); } else { tts.paused = true; tts.tok++; try { synth().cancel(); } catch (e2) {} ttsDock(); } return;
    case 'trate': { const rs = [0.8, 1, 1.25, 1.5, 2]; P.rate = rs[(rs.indexOf(P.rate) + 1) % rs.length]; savePrefs(); if (tts && !tts.paused) ttsGo(tts.k); else ttsDock(); return; }
    case 'tstop': return ttsStop();
    case 'dockx': hlEdit = null; return hideDock();
    case 'finyes': { const b = curBook(); hideDock(); if (b) { API.markRead(b); celebrate(b); } return; }
    case 'finx': return finClose();
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
    case 'tr': return translate();
    case 'copy': return copySel();
  }
}
async function showAtOffset(i, off) {
  await show(i);
  const len = Math.max(1, (colEl.textContent || '').length);
  gotoFrac(off / len);
}
/* Diccionario y traductor: Android muestra las apps del teléfono que aceptan "procesar texto";
   con "traducir" solo salen los traductores y con "diccionario" el resto. Cada búsqueda queda guardada en el libro. */
async function lookUp(q, kind) {
  const text = kind === 'd' ? q.replace(/^[\W_]+|[\W_]+$/g, '') : q.replace(/\s+/g, ' ').trim();
  if (!text) return;
  addLook(text, kind);
  const fo = API.FO && API.FO();
  if (fo && fo.lookup) {
    try { await fo.lookup({ text, mode: kind === 't' ? 'translate' : 'define' }); return; }
    catch (e) {
      const m = String(e && (e.message || e));
      if (/cancel|abort/i.test(m)) return;
      copyText(text, true);
      toast(T(/no_app/i.test(m) ? (kind === 't' ? 'noTr' : 'noDict') : /implement|not available/i.test(m) ? 'needApk' : 'copied'));
      return;
    }
  }
  copyText(text);
}
function addLook(q, k) {
  const b = curBook(); if (!b) return;
  const [a] = viewRange();
  const key = norm(q);
  const old = (b.looks || []).find(x => x.k === k && norm(x.q) === key);
  b.looks = (b.looks || []).filter(x => x !== old);
  b.looks.push({ id: old ? old.id : 'l' + Date.now().toString(36), q: q.slice(0, 160), k, i: si, p: +a.toFixed(4), ts: Date.now(), ...(ver ? { v: 1 } : {}) });
  if (b.looks.length > 300) b.looks = b.looks.slice(-300);
  try { save(); } catch (e) {}
}
function dictionary() { if (selInfo) lookUp(selInfo.q, 'd'); }
function translate() { if (selInfo) lookUp(selInfo.q, 't'); }

/* ---------- brillo de la pantalla (real, vía Android; en el navegador se simula con una capa oscura) ---------- */
let curBright = null, brRaf = 0, brPillT = 0;
const nativeBr = () => !!(API.CAP && API.FO && API.FO());
const brightNow = () => P.bright != null ? P.bright : (curBright != null ? curBright : 0.5);
async function startBright() {
  if (nativeBr()) {
    try { const fo = API.FO(); if (P.bright != null) await fo.brightness({ value: P.bright }); const r = await fo.brightness({}); if (r && typeof r.value === 'number' && P.bright == null) curBright = r.value; }
    catch (e) {}
  }
  applyPrefs();
}
function setBright(v, pill) {
  P.bright = v;
  if (nativeBr()) {
    if (!brRaf) brRaf = requestAnimationFrame(() => { brRaf = 0; try { API.FO().brightness({ value: P.bright == null ? -1 : P.bright }).catch(() => {}); } catch (e) {} });
  } else applyPrefs();
  if (pill) {
    const b = $('#lxBpill', el); if (!b) return;
    b.textContent = '☀ ' + Math.round(v * 100) + '%'; b.classList.add('on');
    clearTimeout(brPillT); brPillT = setTimeout(() => b.classList.remove('on'), 900);
  }
}
function brightBack() {
  if (P.bright == null || !nativeBr()) return;
  try { API.FO().brightness({ value: -1 }).catch(() => {}); } catch (e) {}
}
/* ---------- modo y brillo según la hora ---------- */
let schT = 0;
function schWant() {
  if (P.sch === 'sys') { try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'; } catch (e) { return null; } }
  if (P.sch !== 'time') return null;
  const mn = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const a = mn(P.schA), b = mn(P.schB); if (a == null || b == null || a === b) return null;
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
  return (a < b ? (m >= a && m < b) : (m >= a || m < b)) ? 'night' : 'day';
}
/* de noche pone el tema y el brillo elegidos; de día vuelve a los de siempre (los guarda al entrar en la noche) */
function schTick(force) {
  if (!el) return;
  if (!P.sch || P.sch === 'off') { if (P.schS) { P.schS = ''; savePrefs(); } return; }
  const w = schWant(); if (!w) return;
  if (w === P.schS && !force) return;
  if (w === 'night') {
    if (P.schS !== 'night') { P.dayTh = P.theme; P.dayBr = P.bright; }
    P.theme = P.schTh || 'dark';
    if (P.schBr > 0) setBright(P.schBr / 100);
  } else if (P.schS === 'night') {
    if (P.dayTh) P.theme = P.dayTh;
    setBright(P.dayBr == null ? null : P.dayBr);
  }
  P.schS = w; savePrefs(); applyPrefs();
  const tb = panelEl && panelEl.querySelectorAll('[data-set="theme"]');
  if (tb) tb.forEach(b2 => b2.setAttribute('aria-pressed', String(b2.dataset.v === P.theme)));
}
function copyText(s, quiet) {
  const ok = () => { if (!quiet) toast(T('copied')); };
  try { navigator.clipboard.writeText(s).then(ok, () => {}); }
  catch (e) { try { document.execCommand('copy'); ok(); } catch (e2) {} }
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
  if (chapDone) chapDone();
  if (moveEl) { moveEl.style.transition = ''; moveEl.style.opacity = ''; }
  orientBack(); brightBack();
  lockPage(false);
  ttsStop();
  if (bk) { rtMark(true); writePos(); }
  closePanel(); hideMenu(); hideDock(); srExit(); lastS = null; clearInterval(schT);
  el.classList.remove('on');
  document.removeEventListener('keydown', onKey);
  setTimeout(() => {
    urlCache.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    urlCache.clear(); AH.clear(); twins = null;
    const c = colEl; if (c) c.innerHTML = '';
    curlDrop();
    bk = null; bks = [null, null]; cur = null; chapHtml = '';
  }, 300);
}

/* si el archivo no se puede abrir: aviso y, si el enlace se perdió, botón para elegirlo otra vez */
function loadErr(e) {
  const gone = /gone/.test(String(e && e.message)), ld = loadEl;
  const m = String((e && e.message) || e || '').slice(0, 160);
  /* el motivo técnico, en pequeño: sin él no hay forma de saber qué falló en otro aparato */
  const det = !gone && m ? `<br><small style="opacity:.7;font-size:12px;word-break:break-word">${esc(m)}</small>` : '';
  ld.hidden = false;
  ld.innerHTML = `<div>${esc(gone ? t('fileGone') : t('lxBad'))}${det}${gone && API.relink ? `<br><button type="button" class="lx-dbtn pri" data-x="relink" style="margin-top:14px">${esc(T('relink'))}</button>` : ''}</div>`;
}

/* ---------- entrada pública ---------- */
async function open(b) {
  if (!el) build();
  cur = b.id; openedAt = performance.now();
  const p0 = b.pos && typeof b.pos.i === 'number' ? b.pos : { i: 0, p: 0 };
  ver = p0.v === 1 && b.file2 ? 1 : 0;
  bks = [null, null]; selInfo = null; hlEdit = null; finAsked = false; lastSwap = null; alP = null; alFor = ''; sr = null; lastS = null; srPaint();
  applyPrefs(); schTick(); clearInterval(schT); schT = setInterval(() => { if (el && el.classList.contains('on') && !document.hidden) schTick(); }, 30000);
  titleEl.textContent = b.title || ''; authEl.textContent = b.author || ''; chapEl.textContent = '';
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
  /* si algo falla al pintar, el aviso sale DENTRO del lector (con el motivo), no en una pantalla en blanco */
  try {
    paintLang();
    const sameVer = (p0.v === 1 ? 1 : 0) === ver;
    await show(Math.min(p0.i, bk.spine.length - 1), { pct: p0.p || 0, off: sameVer && typeof p0.o === 'number' ? p0.o : null, noSkip: p0.i > 0 || p0.p > 0 || !!p0.o });
  } catch (e) { busy = false; loadErr(e); return; }
  openedAt = performance.now(); rtLast = Date.now();
  startBright();
  setTimeout(labelVers, 1200);
  setTimeout(() => { if (bk) markJunk(bk); }, 900);
  /* la tabla de equivalencias entre versiones se prepara sola al rato, para que el primer cambio sea al instante */
  const bid = b.id;
  setTimeout(() => { const cb = curBook(); if (cb && cb.file2 && cur === bid && el && el.classList.contains('on')) getAlign().catch(() => {}); }, 6000);
}

/* guardar ya (la app se va a segundo plano o la quitan de recientes) */
function saveNow() { if (el && el.classList.contains('on') && bk) { clearTimeout(posT); rtMark(true); writePos(); } }
window.__LECTOR__ = { open, close, back, save: saveNow, isOpen: () => !!(el && el.classList.contains('on')) };
if (window.__LXTEST__) window.__LXTEST__.lx = { where: () => alWhere, getAlign, alPos, herePos, paraMap, refineSel, isoOf, webTr, state: () => ({ ver, si, page, pages, busy, curling }) };
})();
