# To be read

Tu lista de libros, sagas y universos. App web (HTML/JS) empaquetada para Android con Capacitor.
GitHub Actions compila el APK automáticamente en cada cambio.

## Estructura

| Carpeta / archivo | Qué es |
|---|---|
| `www/index.html` | La app completa. Aquí viven `VERSION` y `BUILD`. |
| `www/lib/` | Librerías para leer .epub (JSZip) y .pdf (pdf.js). |
| `assets/` | Icono y pantalla de inicio (se generan los tamaños de Android solos). |
| `scripts/configure-android.js` | Pone versión, icono y firma en el proyecto Android. La clave de firma va dentro de este archivo: **siempre la misma**, por eso el APK se actualiza sin desinstalar. |
| `.github/workflows/android.yml` | Compila el APK y lo publica en *Releases*. |

## Actualizar la app

1. Sustituye `www/index.html` por la versión nueva.
2. Comprueba que `VERSION` y `BUILD` subieron (el `BUILD` **siempre** tiene que ser mayor que el anterior).
3. Haz commit en `main`. En unos minutos aparece el APK nuevo en **Releases**.
4. Descárgalo e instálalo encima de la app que ya tienes: tus libros se conservan.

## Importante

- Mantén el repositorio **privado**: contiene la clave de firma.
- Guarda una copia de este repositorio (sobre todo de `scripts/configure-android.js`, que contiene la clave de firma). Si la clave cambia, la siguiente versión no podrá
  instalarse encima y tendrás que desinstalar (perdiendo los datos que no hayas exportado).

## Si falla la compilación

En la pestaña **Actions**, abre la ejecución en rojo y copia el final del registro del paso que falló.
El script `scripts/configure-android.js` y el paso "Preparar y comprobar clave de firma" avisan con un mensaje claro si la clave de firma no se puede abrir.
