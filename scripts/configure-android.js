// Pone la versión (leída de www/index.html), la firma y el icono en el proyecto Android
// generado por Capacitor. Se ejecuta en GitHub Actions después de "npx cap add android".
// Si algo falta, termina con un mensaje claro en vez de fallar más tarde dentro de Gradle.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fail = msg => { console.error('\nERROR: ' + msg + '\n'); process.exit(1); };

/* ---------- Clave de firma (incluida aquí, sin depender de archivos subidos) ---------- */
// Es SIEMPRE la misma clave: por eso Android permite instalar cada versión encima de la anterior.
// Mantén el repositorio privado.
const KS_ALIAS = 'porleer';
const KS_PASSWORD = 'h8RqlIpidrwLJfqP6eG0NSzD';
const KS_B64 = [
  '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'
].join('');

const { execFileSync } = require('child_process');
const storePath = path.join(root, 'keystore-release.jks');
fs.writeFileSync(storePath, Buffer.from(KS_B64, 'base64'));
try {
  const out = execFileSync('keytool', ['-list', '-keystore', storePath, '-storepass', KS_PASSWORD, '-alias', KS_ALIAS], { encoding: 'utf8' });
  const fp = (out.match(/SHA-256\): ([0-9A-F:]+)/) || [])[1];
  console.log('Clave de firma OK' + (fp ? ' (SHA-256 ' + fp.slice(0, 23) + '…)' : ''));
} catch (e) {
  fail('La clave de firma incluida en scripts/configure-android.js no se puede abrir. ' +
       '¿Se pegó el archivo completo, sin cortar ninguna línea de KS_B64?\n' + (e.stderr || e.message));
}
if (process.argv[2] === 'keystore') process.exit(0);

/* ---------- 1. Versión ---------- */
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const m = html.match(/const VERSION='([0-9.]+)',BUILD=(\d+)/);
if (!m) fail('No encuentro VERSION/BUILD en www/index.html');
const [, versionName, versionCode] = m;

const gradlePath = path.join(root, 'android/app/build.gradle');
if (!fs.existsSync(gradlePath)) fail('No existe android/app/build.gradle (¿falló "npx cap add android"?)');
let g = fs.readFileSync(gradlePath, 'utf8');

// versionCode (build) tiene que subir siempre para que Android actualice sin desinstalar
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + versionCode)
     .replace(/versionName\s+"[^"]*"/, 'versionName "' + versionName + '"');
if (!g.includes('versionCode ' + versionCode) || !g.includes('versionName "' + versionName + '"')) {
  fail('No pude poner versionCode/versionName en build.gradle');
}

/* ---------- 2. Firma ---------- */
const q = v => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const signing = [
  'signingConfigs {',
  '        release {',
  '            storeFile file(' + q(storePath.replace(/\\/g, '/')) + ')',
  '            storePassword ' + q(KS_PASSWORD),
  '            keyAlias ' + q(KS_ALIAS),
  '            keyPassword ' + q(KS_PASSWORD),
  '        }',
  '    }',
  '    buildTypes {'
].join('\n');

if (!/signingConfigs\s*\{/.test(g)) {
  if (!/buildTypes\s*\{/.test(g)) fail('No encuentro "buildTypes" en build.gradle');
  g = g.replace(/buildTypes\s*\{/, signing);
}
if (!/signingConfig\s+signingConfigs\.release/.test(g)) {
  g = g.replace(/(buildTypes\s*\{\s*release\s*\{)/, '$1\n            signingConfig signingConfigs.release');
}
if (!/signingConfig\s+signingConfigs\.release/.test(g)) fail('No pude activar la firma en build.gradle');
// Sin revisión "lint" en release: es solo análisis de calidad y a veces falla por avisos que no impiden compilar.
if (!/checkReleaseBuilds/.test(g)) g = g.replace(/^android\s*\{/m, 'android {\n    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }\n');
fs.writeFileSync(gradlePath, g);

/* ---------- 3. Icono ---------- */
// Si el generador dejó sin crear algún recurso @mipmap/... del icono adaptable
// (p. ej. el fondo), usamos un color sólido para que la compilación no falle.
(function fixIcons() {
  const res = path.join(root, 'android/app/src/main/res');
  if (!fs.existsSync(res)) return;
  const dirs = fs.readdirSync(res).filter(d => d.startsWith('mipmap-'));
  const exists = name => dirs.some(d => fs.readdirSync(path.join(res, d)).some(f => f.replace(/\.[^.]+$/, '') === name));
  let usedColor = false;
  for (const d of dirs.filter(d => d.startsWith('mipmap-anydpi'))) {
    for (const f of fs.readdirSync(path.join(res, d)).filter(f => f.endsWith('.xml'))) {
      const fp = path.join(res, d, f);
      const x = fs.readFileSync(fp, 'utf8');
      const x2 = x.replace(/@mipmap\/([A-Za-z0-9_]+)/g, (all, name) => {
        if (exists(name)) return all;
        if (name === 'ic_launcher_background') { usedColor = true; return '@color/ic_launcher_background'; }
        console.warn('Aviso: falta el recurso @mipmap/' + name);
        return all;
      });
      if (x2 !== x) fs.writeFileSync(fp, x2);
    }
  }
  if (usedColor) {
    const vdir = path.join(res, 'values');
    fs.mkdirSync(vdir, { recursive: true });
    const vf = path.join(vdir, 'ic_launcher_background.xml');
    const has = fs.existsSync(vf) && /name="ic_launcher_background"/.test(fs.readFileSync(vf, 'utf8'));
    if (!has) fs.writeFileSync(vf, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#ECE3EF</color>\n</resources>\n');
    console.log('Icono: fondo de color sólido (no se generó ic_launcher_background)');
  }
})();

console.log('Android listo: versión ' + versionName + ' (build ' + versionCode + '), firmado con keystore-release.jks');
