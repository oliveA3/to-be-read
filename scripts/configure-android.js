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

/* ---------- 2b. Endurecer el manifiesto (sin tráfico http sin cifrar) ---------- */
(function hardenManifest() {
  const mp = path.join(root, 'android/app/src/main/AndroidManifest.xml');
  if (!fs.existsSync(mp)) return;
  let m = fs.readFileSync(mp, 'utf8');
  if (!/usesCleartextTraffic/.test(m)) {
    m = m.replace(/<application\b/, '<application android:usesCleartextTraffic="false"');
    fs.writeFileSync(mp, m);
    console.log('Manifiesto: tráfico sin cifrar desactivado');
  }
  // Cámara: solo para escanear el código de barras (ISBN). No es obligatoria para instalar la app.
  m = fs.readFileSync(mp, 'utf8');
  if (!/android\.permission\.CAMERA/.test(m)) {
    m = m.replace(/<application\b/, '<uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <application');
    fs.writeFileSync(mp, m);
    console.log('Manifiesto: permiso de cámara añadido (escáner ISBN)');
  }
  // Instalar la actualización descargada desde GitHub (Android pide confirmación al usuario)
  m = fs.readFileSync(mp, 'utf8');
  if (!/REQUEST_INSTALL_PACKAGES/.test(m)) {
    m = m.replace(/<application\b/, '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n    <application');
    fs.writeFileSync(mp, m);
    console.log('Manifiesto: permiso para instalar actualizaciones añadido');
  }
})();

/* ---------- 2c. Enlaces a archivos de libros (plugin propio, sin copiar el archivo) ---------- */
(function nativeFiles() {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  const appId = cfg.appId;
  const javaDir = path.join(root, 'android/app/src/main/java', appId.split('.').join('/'));
  if (!fs.existsSync(path.join(root, 'android/app/src/main'))) return;
  fs.mkdirSync(javaDir, { recursive: true });

  fs.writeFileSync(path.join(javaDir, 'FileOpenerPlugin.java'), [
    'package ' + appId + ';',
    '',
    'import android.app.Activity;',
    'import android.content.ActivityNotFoundException;',
    'import android.content.Intent;',
    'import android.database.Cursor;',
    'import android.net.Uri;',
    'import android.os.Build;',
    'import android.os.ParcelFileDescriptor;',
    'import java.nio.ByteBuffer;',
    'import java.nio.channels.FileChannel;',
    'import android.provider.Settings;',
    'import androidx.core.content.FileProvider;',
    'import java.io.File;',
    'import java.io.FileInputStream;',
    'import java.io.FileOutputStream;',
    'import java.net.HttpURLConnection;',
    'import java.net.URL;',
    'import android.provider.OpenableColumns;',
    'import android.util.Base64;',
    'import androidx.activity.result.ActivityResult;',
    'import com.getcapacitor.JSObject;',
    'import com.getcapacitor.Plugin;',
    'import com.getcapacitor.PluginCall;',
    'import com.getcapacitor.PluginMethod;',
    'import com.getcapacitor.annotation.ActivityCallback;',
    'import com.getcapacitor.annotation.CapacitorPlugin;',
    'import java.io.ByteArrayOutputStream;',
    'import java.io.InputStream;',
    '',
    '@CapacitorPlugin(name = "FileOpener")',
    'public class FileOpenerPlugin extends Plugin {',
    '',
    '    /** Abre el selector de archivos del sistema y guarda el permiso de lectura de forma permanente. */',
    '    @PluginMethod',
    '    public void pick(PluginCall call) {',
    '        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);',
    '        intent.addCategory(Intent.CATEGORY_OPENABLE);',
    '        intent.setType("*/*");',
    '        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/pdf", "application/epub+zip"});',
    '        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);',
    '        startActivityForResult(call, intent, "pickResult");',
    '    }',
    '',
    '    @ActivityCallback',
    '    private void pickResult(PluginCall call, ActivityResult result) {',
    '        if (call == null) return;',
    '        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {',
    '            call.reject("cancelled");',
    '            return;',
    '        }',
    '        Uri uri = result.getData().getData();',
    '        try {',
    '            getContext().getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);',
    '        } catch (Exception e) {',
    '            // algunos proveedores no permiten permiso permanente; se sigue igual',
    '        }',
    '        String name = "libro";',
    '        long size = 0;',
    '        Cursor cursor = null;',
    '        try {',
    '            cursor = getContext().getContentResolver().query(uri, null, null, null, null);',
    '            if (cursor != null && cursor.moveToFirst()) {',
    '                int i = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);',
    '                if (i >= 0) name = cursor.getString(i);',
    '                int si = cursor.getColumnIndex(OpenableColumns.SIZE);',
    '                if (si >= 0 && !cursor.isNull(si)) size = cursor.getLong(si);',
    '            }',
    '        } catch (Exception e) {',
    '            // se queda el nombre por defecto',
    '        } finally {',
    '            if (cursor != null) cursor.close();',
    '        }',
    '        String type = getContext().getContentResolver().getType(uri);',
    '        JSObject ret = new JSObject();',
    '        ret.put("uri", uri.toString());',
    '        ret.put("name", name);',
    '        ret.put("size", size);',
    '        ret.put("type", type == null ? "" : type);',
    '        call.resolve(ret);',
    '    }',
    '',
    '    /** Abre el archivo con la app que el usuario tenga por defecto para ese tipo. */',
    '    @PluginMethod',
    '    public void open(PluginCall call) {',
    '        String u = call.getString("uri");',
    '        String type = call.getString("type", "*/*");',
    '        if (u == null || u.isEmpty()) { call.reject("missing_uri"); return; }',
    '        try {',
    '            Intent intent = new Intent(Intent.ACTION_VIEW);',
    '            intent.setDataAndType(Uri.parse(u), type);',
    '            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);',
    '            getContext().startActivity(intent);',
    '            call.resolve();',
    '        } catch (ActivityNotFoundException e) {',
    '            call.reject("no_app");',
    '        } catch (SecurityException e) {',
    '            call.reject("not_found");',
    '        } catch (Exception e) {',
    '            call.reject(String.valueOf(e.getMessage()));',
    '        }',
    '    }',
    '',
    '    /** Lee el archivo (para sacar portada y datos). Devuelve base64. */',
    '    @PluginMethod',
    '    public void read(PluginCall call) {',
    '        String u = call.getString("uri");',
    '        if (u == null || u.isEmpty()) { call.reject("missing_uri"); return; }',
    '        try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(u))) {',
    '            if (in == null) { call.reject("not_found"); return; }',
    '            ByteArrayOutputStream out = new ByteArrayOutputStream();',
    '            byte[] buf = new byte[65536];',
    '            int n;',
    '            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);',
    '            JSObject ret = new JSObject();',
    '            ret.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));',
    '            call.resolve(ret);',
    '        } catch (OutOfMemoryError e) {',
    '            call.reject("too_big");',
    '        } catch (SecurityException e) {',
    '            call.reject("permission");',
    '        } catch (java.io.FileNotFoundException e) {',
    '            call.reject("not_found");',
    '        } catch (Exception e) {',
    '            call.reject(String.valueOf(e.getMessage()));',
    '        }',
    '    }',
    '',
        '    /** Lee solo un trozo del archivo (para sacar portada y datos sin cargarlo entero). Devuelve base64. */',
    '    @PluginMethod',
    '    public void readRange(PluginCall call) {',
    '        String u = call.getString("uri");',
    '        Double offD = call.getDouble("offset");',
    '        Double lenD = call.getDouble("length");',
    '        if (u == null || u.isEmpty() || offD == null || lenD == null) { call.reject("bad_args"); return; }',
    '        long off = (long) (double) offD;',
    '        int len = (int) Math.max(0L, Math.min(8L * 1024 * 1024, (long) (double) lenD));',
    '        byte[] buf = new byte[len];',
    '        int got = 0;',
    '        try {',
    '            boolean done = false;',
    '            try (ParcelFileDescriptor pfd = getContext().getContentResolver().openFileDescriptor(Uri.parse(u), "r")) {',
    '                if (pfd != null) {',
    '                    try (FileInputStream fis = new FileInputStream(pfd.getFileDescriptor())) {',
    '                        FileChannel ch = fis.getChannel();',
    '                        ch.position(off);',
    '                        ByteBuffer bb = ByteBuffer.wrap(buf);',
    '                        while (bb.hasRemaining()) {',
    '                            int n = ch.read(bb);',
    '                            if (n < 0) break;',
    '                            got += n;',
    '                        }',
    '                        done = true;',
    '                    } catch (Exception e) {',
    '                        got = 0;',
    '                    }',
    '                }',
    '            }',
    '            if (!done) {',
    '                try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(u))) {',
    '                    if (in == null) { call.reject("not_found"); return; }',
    '                    long left = off;',
    '                    while (left > 0) {',
    '                        long k = in.skip(left);',
    '                        if (k <= 0) break;',
    '                        left -= k;',
    '                    }',
    '                    got = 0;',
    '                    while (got < len) {',
    '                        int n = in.read(buf, got, len - got);',
    '                        if (n < 0) break;',
    '                        got += n;',
    '                    }',
    '                }',
    '            }',
    '            JSObject ret = new JSObject();',
    '            ret.put("data", Base64.encodeToString(buf, 0, got, Base64.NO_WRAP));',
    '            call.resolve(ret);',
    '        } catch (SecurityException e) {',
    '            call.reject("permission");',
    '        } catch (java.io.FileNotFoundException e) {',
    '            call.reject("not_found");',
    '        } catch (OutOfMemoryError e) {',
    '            call.reject("too_big");',
    '        } catch (Exception e) {',
    '            call.reject(String.valueOf(e.getMessage()));',
    '        }',
    '    }',
    '',
    '    /** Suelta el permiso permanente cuando se quita el enlace. */',
    '    @PluginMethod',
    '    public void release(PluginCall call) {',
    '        String u = call.getString("uri");',
    '        try {',
    '            if (u != null) getContext().getContentResolver().releasePersistableUriPermission(Uri.parse(u), Intent.FLAG_GRANT_READ_URI_PERMISSION);',
    '        } catch (Exception e) {',
    '            // nada que soltar',
    '        }',
    '        call.resolve();',
    '    }',
    '',
    '    /** Descarga la nueva version (APK) desde GitHub y abre el instalador del sistema. */',
    '    @PluginMethod',
    '    public void installUpdate(final PluginCall call) {',
    '        final String u = call.getString("url");',
    '        if (u == null || !u.startsWith("https://")) { call.reject("bad_url"); return; }',
    '        String host = Uri.parse(u).getHost();',
    '        if (host == null || !(host.equals("github.com") || host.endsWith(".github.com") || host.endsWith(".githubusercontent.com"))) { call.reject("bad_host"); return; }',
    '        final android.content.Context ctx = getContext();',
    '        if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {',
    '            try {',
    '                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));',
    '                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);',
    '                ctx.startActivity(s);',
    '            } catch (Exception e) {',
    '                // si no se puede abrir el ajuste, el usuario lo activa a mano',
    '            }',
    '            call.reject("needs_permission");',
    '            return;',
    '        }',
    '        new Thread(new Runnable() {',
    '            public void run() {',
    '                HttpURLConnection c = null;',
    '                try {',
    '                    File f = new File(ctx.getCacheDir(), "update.apk");',
    '                    c = (HttpURLConnection) new URL(u).openConnection();',
    '                    c.setInstanceFollowRedirects(true);',
    '                    c.setConnectTimeout(15000);',
    '                    c.setReadTimeout(60000);',
    '                    int code = c.getResponseCode();',
    '                    if (code != 200) { call.reject("http_" + code); return; }',
    '                    long total = c.getContentLengthLong();',
    '                    long got = 0;',
    '                    int last = -1;',
    '                    try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(f)) {',
    '                        byte[] buf = new byte[65536];',
    '                        int n;',
    '                        while ((n = in.read(buf)) > 0) {',
    '                            out.write(buf, 0, n);',
    '                            got += n;',
    '                            if (total > 0) {',
    '                                int pct = (int) (got * 100 / total);',
    '                                if (pct != last) {',
    '                                    last = pct;',
    '                                    JSObject p = new JSObject();',
    '                                    p.put("pct", pct);',
    '                                    notifyListeners("updateProgress", p);',
    '                                }',
    '                            }',
    '                        }',
    '                    }',
    '                    boolean zip = false;',
    '                    try (FileInputStream fi = new FileInputStream(f)) {',
    '                        zip = fi.read() == \'P\' && fi.read() == \'K\';',
    '                    }',
    '                    if (f.length() < 100000 || !zip) { call.reject("bad_file"); return; }',
    '                    Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", f);',
    '                    Intent i = new Intent(Intent.ACTION_VIEW);',
    '                    i.setDataAndType(uri, "application/vnd.android.package-archive");',
    '                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);',
    '                    ctx.startActivity(i);',
    '                    call.resolve();',
    '                } catch (Exception e) {',
    '                    call.reject(String.valueOf(e.getMessage()));',
    '                } finally {',
    '                    if (c != null) c.disconnect();',
    '                }',
    '            }',
    '        }).start();',
    '    }',
    '}',
    ''
  ].join('\n'));

  fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), [
    'package ' + appId + ';',
    '',
    'import android.os.Bundle;',
    'import com.getcapacitor.BridgeActivity;',
    '',
    'public class MainActivity extends BridgeActivity {',
    '    @Override',
    '    public void onCreate(Bundle savedInstanceState) {',
    '        registerPlugin(FileOpenerPlugin.class);',
    '        super.onCreate(savedInstanceState);',
    '    }',
    '}',
    ''
  ].join('\n'));
  console.log('Android: enlaces a archivos de libros listos');
})();

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
