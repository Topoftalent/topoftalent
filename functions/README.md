# Cloud Functions · Top of Talent

## Qué hace
`enforceCommentLimit` es el respaldo del lado servidor para el límite de
comentarios. Cuenta los comentarios de cada usuario por día en un documento
protegido (`rate_limits/{userId}`, que el cliente no puede tocar) y **borra**
los comentarios que pasen el límite diario (`DAILY_LIMIT = 5`).

El límite del navegador sigue siendo la primera línea (UX: "quedan N"); esta
función es la que no se puede saltar.

## Requisitos (una sola vez)
1. **Plan Blaze** en Firebase (Cloud Functions lo requieren). Tiene capa gratuita
   muy amplia (2M invocaciones/mes gratis), así que en la práctica es gratis.
   Firebase Console → Configuración → Uso y facturación → cambiar a Blaze.
2. **Firebase CLI** instalado en tu compu:
   ```
   npm install -g firebase-tools
   firebase login
   ```

## Desplegar
Desde la carpeta del proyecto (`top-of-talent/`):
```
cd functions
npm install
cd ..
firebase deploy --only functions
```

La primera vez pedirá habilitar unas APIs; acepta.

## Cambiar el límite
Edita `DAILY_LIMIT` en `functions/index.js` y vuelve a desplegar.
(Idealmente que coincida con el límite del navegador en `artista-extras.js`.)

## Notas
- Si NO despliegas esto, no se rompe nada: el sitio funciona igual, solo que el
  límite queda del lado del navegador (más débil).
- La regla `rate_limits` ya está desplegada (bloquea al cliente; la función
  escribe con privilegios de admin).
- `firebase.json` y `.firebaserc` ya están configurados apuntando al proyecto
  `top-of-talent`. Con esto también puedes desplegar reglas por CLI si quieres:
  `firebase deploy --only firestore:rules`.
</content>
