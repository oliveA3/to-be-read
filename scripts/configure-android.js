// Pone la versión (leída de www/index.html) y la firma en el proyecto Android generado por Capacitor.
// Se ejecuta automáticamente en GitHub Actions después de "npx cap add android".
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const m = html.match(/const VERSION='([0-9.]+)',BUILD=(\d+)/);
if (!m) { console.error('No encuentro VERSION/BUILD en www/index.html'); process.exit(1); }
const [, versionName, versionCode] = m;

const gradlePath = path.join(root, 'android/app/build.gradle');
let g = fs.readFileSync(gradlePath, 'utf8');

// Versión: versionCode (build) tiene que subir siempre para que Android actualice sin desinstalar
g = g.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
     .replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);

// Firma: siempre la misma clave (keystore/por-leer.jks)
if (!g.includes('signingConfigs {')) {
  g = g.replace(/buildTypes\s*\{/, `signingConfigs {
        release {
            def props = new Properties()
            file("../../keystore/keystore.properties").withInputStream { props.load(it) }
            storeFile file("../../keystore/" + props['storeFile'])
            storePassword props['storePassword']
            keyAlias props['keyAlias']
            keyPassword props['keyPassword']
        }
    }
    buildTypes {`);
  g = g.replace(/release\s*\{\s*\n(\s*)minifyEnabled/, (all, sp) => `release {\n${sp}signingConfig signingConfigs.release\n${sp}minifyEnabled`);
}

// Icono: si el generador dejó sin crear algún recurso @mipmap/... del icono adaptable
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
      let x = fs.readFileSync(fp, 'utf8');
      const x2 = x.replace(/@mipmap\/([A-Za-z0-9_]+)/g, (all, name) => {
        if (exists(name)) return all;
        if (name === 'ic_launcher_background') { usedColor = true; return '@color/ic_launcher_background'; }
        console.warn(`Aviso: falta el recurso @mipmap/${name}`);
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

fs.writeFileSync(gradlePath, g);
if (!/signingConfig signingConfigs\.release/.test(g)) { console.error('No pude añadir la firma a build.gradle'); process.exit(1); }
console.log(`Android listo: versión ${versionName} (build ${versionCode}), firmado con keystore/por-leer.jks`);
