// Pone la versión (leída de www/index.html), la firma y el icono en el proyecto Android
// generado por Capacitor. Se ejecuta en GitHub Actions después de "npx cap add android".
// Si algo falta, termina con un mensaje claro en vez de fallar más tarde dentro de Gradle.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fail = msg => { console.error('\nERROR: ' + msg + '\n'); process.exit(1); };

/* ---------- Clave de firma (NUNCA en el código: viene de GitHub Secrets) ---------- */
// Es SIEMPRE la misma clave: por eso Android permite instalar cada versión encima de la anterior.
// KEYSTORE_B64 y KEYSTORE_PASSWORD se definen como "Repository secrets" en GitHub
// (Settings → Secrets and variables → Actions) y llegan aquí como variables de entorno,
// nunca escritas en este archivo ni en el historial del repositorio.
const KS_ALIAS = 'porleer';
const KS_PASSWORD = process.env.KEYSTORE_PASSWORD;
const KS_B64 = process.env.KEYSTORE_B64;
if (!KS_PASSWORD || !KS_B64) {
  fail('Faltan los secrets KEYSTORE_B64 y/o KEYSTORE_PASSWORD en el repositorio de GitHub ' +
       '(Settings → Secrets and variables → Actions → New repository secret).');
}

const { execFileSync } = require('child_process');
const storePath = path.join(root, 'keystore-release.jks');
fs.writeFileSync(storePath, Buffer.from(KS_B64, 'base64'));
try {
  const out = execFileSync('keytool', ['-list', '-keystore', storePath, '-storepass', KS_PASSWORD, '-alias', KS_ALIAS], { encoding: 'utf8' });
  const fp = (out.match(/SHA-256\): ([0-9A-F:]+)/) || [])[1];
  console.log('Clave de firma OK' + (fp ? ' (SHA-256 ' + fp.slice(0, 23) + '…)' : ''));
} catch (e) {
  fail('La clave de firma (secrets KEYSTORE_B64 / KEYSTORE_PASSWORD) no se puede abrir. ' +
       '¿Se pegó el valor de KEYSTORE_B64 completo, sin espacios ni saltos de línea?\n' + (e.stderr || e.message));
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
    '',
    '    /** Guarda un archivo en la carpeta pública Descargas/Download del teléfono (copia de seguridad). */',
    '    @PluginMethod',
    '    public void saveDownload(PluginCall call) {',
    '        String name = call.getString("name");',
    '        String data = call.getString("data");',
    '        String mime = call.getString("mime", "application/octet-stream");',
    '        if (name == null || data == null) { call.reject("bad_args"); return; }',
    '        byte[] bytes;',
    '        try {',
    '            bytes = Base64.decode(data, Base64.NO_WRAP);',
    '        } catch (Exception e) {',
    '            call.reject("bad_data");',
    '            return;',
    '        }',
    '        android.content.Context ctx = getContext();',
    '        try {',
    '            if (Build.VERSION.SDK_INT >= 29) {',
    '                android.content.ContentValues values = new android.content.ContentValues();',
    '                values.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, name);',
    '                values.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mime);',
    '                values.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);',
    '                Uri uri = ctx.getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);',
    '                if (uri == null) { call.reject("insert_failed"); return; }',
    '                try (java.io.OutputStream out = ctx.getContentResolver().openOutputStream(uri)) {',
    '                    if (out == null) { call.reject("insert_failed"); return; }',
    '                    out.write(bytes);',
    '                }',
    '            } else {',
    '                File dir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);',
    '                if (!dir.exists()) dir.mkdirs();',
    '                File f = new File(dir, name);',
    '                try (FileOutputStream out = new FileOutputStream(f)) {',
    '                    out.write(bytes);',
    '                }',
    '                android.media.MediaScannerConnection.scanFile(ctx, new String[]{f.getAbsolutePath()}, null, null);',
    '            }',
    '            call.resolve();',
    '        } catch (Exception e) {',
    '            // en teléfonos viejos (antes de Android 10) sin el permiso de almacenamiento, esto puede fallar:',
    '            // la app lo detecta y usa la hoja de compartir en su lugar.',
    '            call.reject(String.valueOf(e.getMessage()));',
    '        }',
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
