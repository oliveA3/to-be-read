# To be read

Tu lista de libros, sagas y universos. App web (HTML/JS) empaquetada para Android con Capacitor.
GitHub Actions compila el APK automáticamente en cada cambio.

## Estructura

| Carpeta / archivo | Qué es |
|---|---|
| `www/index.html` | La app completa. Aquí viven `VERSION` y `BUILD`. |
| `www/lib/` | Librerías para leer .epub (JSZip) y .pdf (pdf.js). |
| `assets/` | Icono y pantalla de inicio (se generan los tamaños de Android solos). |
| `keystore/` | Clave de firma. **Siempre la misma**: por eso el APK se actualiza sin desinstalar. |
| `scripts/configure-android.js` | Pone versión y firma en el proyecto Android. |
| `.github/workflows/android.yml` | Compila el APK y lo publica en *Releases*. |

## Actualizar la app

1. Sustituye `www/index.html` por la versión nueva.
2. Comprueba que `VERSION` y `BUILD` subieron (el `BUILD` **siempre** tiene que ser mayor que el anterior).
3. Haz commit en `main`. En unos minutos aparece el APK nuevo en **Releases**.
4. Descárgalo e instálalo encima de la app que ya tienes: tus libros se conservan.

## Importante

- Mantén el repositorio **privado**: contiene la clave de firma.
- Guarda una copia de la carpeta `keystore/`. Si la pierdes, la siguiente versión no podrá
  instalarse encima y tendrás que desinstalar (perdiendo los datos que no hayas exportado).
