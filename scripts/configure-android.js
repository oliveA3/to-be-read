// Pone la versión (leída de www/index.html), la firma y el icono en el proyecto Android
// generado por Capacitor. Se ejecuta en GitHub Actions después de "npx cap add android".
// Si algo falta, termina con un mensaje claro en vez de fallar más tarde dentro de Gradle.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fail = msg => { console.error('\nERROR: ' + msg + '\n'); process.exit(1); };

/* ---------- 1. Versión ---------- */
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const m = html.match(/const VERSION='([0-9.]+)',BUILD=(\d+)/);
if (!m) fail('No encuentro VERSION/BUILD en www/index.html');
const [, versionName, versionCode] = m;

const gradlePath = path.join(root, 'android/app/build.gradle');
if (!fs.existsSync(gradlePath)) fail('No existe android/app/build.gradle (¿falló "npx cap add android"?)');
let g = fs.readFileSync(gradlePath, 'utf8');

// versionCode (build) tiene que subir siempre para que Android actualice sin desinstalar
g = g.replace(/versionCode\s+\d+/, versionCode ${versionCode})
     .replace(/versionName\s+"[^"]*"/, versionName "${versionName}");
if (!g.includes(versionCode ${versionCode}) || !g.includes(versionName "${versionName}")) {
  fail('No pude poner versionCode/versionName en build.gradle');
}

/* ---------- 2. Firma: siempre la misma clave (keystore/por-leer.jks) ---------- */
// Los valores se leen aquí (Node) y se escriben literales en build.gradle,
// así Gradle no depende de leer ningún .properties.
const ksDir = path.join(root, 'keystore');
const propsFile = path.join(ksDir, 'keystore.properties');
if (!fs.existsSync(propsFile)) fail('Falta keystore/keystore.properties (¿se subió la carpeta keystore a GitHub?)');
const props = {};
fs.readFileSync(propsFile, 'utf8').split(/\r?\n/).forEach(line => {
  const i = line.indexOf('=');
  if (i > 0 && !line.trim().startsWith('#')) props[line.slice(0, i).trim()] = line.slice(i + 1).trim();
});
for (const k of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
  if (!props[k]) fail(keystore/keystore.properties no tiene "${k}" (o está vacío));
}
const storePath = path.join(ksDir, props.storeFile);
if (!fs.existsSync(storePath)) fail(Falta el archivo de clave keystore/${props.storeFile});
if (fs.statSync(storePath).size < 500) fail(keystore/${props.storeFile} está dañado o incompleto (¿se subió bien?));

const q = v => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const signing = signingConfigs {
        release {
            storeFile file(${q(storePath.replace(/\\/g, '/'))})
            storePassword ${q(props.storePassword)}
            keyAlias ${q(props.keyAlias)}
            keyPassword ${q(props.keyPassword)}
        }
    }
    buildTypes {;

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
        console.warn(Aviso: falta el recurso @mipmap/${name});
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

console.log(Android listo: versión ${versionName} (build ${versionCode}), firmado con keystore/${props.storeFile});
