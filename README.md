# Winx: Escape a Alfea

Videojuego web por turnos hecho con **HTML, CSS y Vanilla JS**, para el Taller Práctico Evaluativo de la Universidad de Córdoba (Facultad de Ingenierías, Ingeniería de Sistemas y Telemática). Temática libre: hadas Winx.

## Cómo jugar
1. Abre `index.html` en el navegador y pulsa **Jugar**.
2. Cruza el laberinto de Alfea hasta el portal mágico de Magix (🌟) en cada uno de los 4 niveles.
3. Recoge cristales mágicos: cada uno da +10 puntos y un hechizo.
4. Las Trix (Icy, Darcy y Stormy) te persiguen. Con un hechizo puedes aturdirlas si están cerca.
5. Tienes 3 vidas. Si te atrapan, vuelves al inicio y pierdes una.

## Controles
| Acción | Control |
|---|---|
| Moverse | Flechas, WASD, burbuja en pantalla o deslizar el dedo |
| Lanzar hechizo | Espacio o botón central de la burbuja |
| Música | Tecla M o botón "Música" |

## Reglas del taller integradas
- **Regla B:** cada 2 cristales recogidos (aquí la "jugada exitosa" es recoger un cristal), dos elementos del arreglo lógico `map` (una pared y un camino libre) se intercambian y se reflejan en el DOM. Siempre queda un camino al portal y a los cristales. El número se cambia en la constante `CRYSTALS_PER_SHIFT`.
- **Regla C:** el arreglo `traps` guarda trampas (🕸️). Al pisar una no suma puntos: se congela el siguiente turno y el fondo de la pantalla se pone **rojo** durante esa ronda.

## Conceptos obligatorios (dónde están en `script.js`)
1. **Variables y tipos primitivos:** `score`, `lives`, `turn`, `gameOver`, `message`.
2. **Condicionales:** `if / else if / else` y ternarios en `movePlayer()`, `checkGhostCollision()` y `render()`.
3. **Arreglos:** `levels`, `map`, `ghosts`, `traps`, `bombs`.
4. **Objetos literales:** cada nivel, `directions`, `player`, `exit`, `trixLook`.
5. **Funciones:** declaradas (`movePlayer`, `shiftMaze`...) y flecha (`distance`, `keyOf`...).
6. **Eventos del navegador:** `keydown`, `pointerdown`, `touchstart/touchend`, `click`, `resize`, `animationend`.
7. **Manipulación del DOM:** `createElement`, `appendChild`, `replaceChildren`, `classList`, `textContent`.

## Restricciones respetadas
- Sin `<canvas>`: toda la interfaz son etiquetas HTML con CSS (el confeti son `<span>` animados con CSS).
- Sin asincronismo ni llamadas de red (no hay timers, promesas, `fetch` ni `requestAnimationFrame`).
- Sin almacenamiento del navegador; el estado vive en variables de JavaScript, no en el DOM.
- Sin librerías externas.
- Sin abusar de `innerHTML` (no se usa).

## Archivos
```
index.html   estructura de la página
styles.css   estilos y animaciones
script.js    lógica del juego (comentada)
winx.png         (imagen de inicio, agregar)
winx-final.jpg   (imagen final, agregar)
ComicChick.ttf   (fuente opcional, agregar)
```
