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
fs.writeFileSync(gradlePath, g);
if (!/signingConfig signingConfigs\.release/.test(g)) { console.error('No pude añadir la firma a build.gradle'); process.exit(1); }
console.log(`Android listo: versión ${versionName} (build ${versionCode}), firmado con keystore/por-leer.jks`);
