// Winx: Escape a Alfea
// Conceptos del taller: variables, arreglos, objetos literales, condicionales,
// funciones (declaradas y flecha), eventos del navegador y manipulación del DOM.
// Sin asincronismo (no hay timers ni promesas propias): el juego avanza por turnos.
//
// Documentación de los conceptos obligatorios del taller (dónde se usa cada uno):
//  1. Variables y tipos primitivos: number (score, lives, turn), boolean (gameOver, started), string (message).
//  2. Condicionales: if / else if / else y ternarios en movePlayer(), checkGhostCollision(), render().
//  3. Arreglos: levels, map, ghosts, traps, bombs.
//  4. Objetos literales: cada nivel, directions, player, exit, trixLook.
//  5. Funciones declaradas (movePlayer, render...) y flecha (distance, keyOf, laserActive...).
//  6. Eventos del navegador: keydown, pointerdown, touchstart/touchend, click, resize, animationend.
//  7. Manipulación del DOM: createElement, appendChild, replaceChildren, classList, textContent (sin innerHTML).
//
// REGLA B del taller integrada: el laberinto se mueve. Dos elementos aleatorios del arreglo lógico `map`
// (una pared y un camino libre) se intercambian de posición y se reflejan en el DOM al repintar.
// Aquí una "jugada exitosa" es recoger un cristal: ocurre cada vez que se recogen CRYSTALS_PER_SHIFT (2). Ver shiftMaze().
//
// REGLA C del taller integrada: el arreglo `traps` guarda casillas-trampa. Si la jugadora pisa una,
// NO suma puntos: se congela su siguiente turno (frozenTurns) y el fondo de la pantalla se pone ROJO
// (clase "alert" en <body>) durante esa ronda. Ver movePlayer() y el CSS de body.alert.

// Leyenda del mapa: # pared, P jugadora, E salida, G una de las Trix, T trampa, B cristal mágico, L láser.
// Cada nivel es un objeto: ghostEvery = las Trix se mueven cada N turnos, vision = distancia de persecución.
const levels = [
  { name: "Nivel 1: Jardines de Alfea", ghostEvery: 2, vision: 5, map: [
    "###################",
    "#P....#.....#....E#",
    "###.#.#.###.#.###.#",
    "#...#...#...#...#.#",
    "#.#####.#.#####.#.#",
    "#.....#.#.....#...#",
    "#.##..#...##..###.#",
    "#..T..###....B....#",
    "##.#.....##.#######",
    "#..#G##...#....B..#",
    "#....#..T...##....#",
    "#.B..#.....G...#..#",
    "###################" ] },
  { name: "Nivel 2: Pasillos de Alfea", ghostEvery: 2, vision: 8, map: [
    "###################",
    "#P..#...B.#.....E.#",
    "#.#.#.###.#.###.#.#",
    "#.#...#...#...#.#.#",
    "#.#####.#####.#...#",
    "#.....#.....#.#.###",
    "#.###.#.###.#.#...#",
    "#.#B..#.#B..#.###.#",
    "#.#.###.#.###.....#",
    "#...#G..#...###.#.#",
    "#.#.#.#####.#B..#.#",
    "#T..B.....G.T.....#",
    "###################" ] },
  { name: "Nivel 3: Cloud Tower", ghostEvery: 2, vision: 12, map: [
    "###################",
    "#P.L...#.....#...E#",
    "#.#####.###.#.###.#",
    "#.#...#...#.#...#.#",
    "#.#.#.###.#.###.#.#",
    "#...#.....#.....#.#",
    "###.#.#####.###.#.#",
    "#B..#...G...#...B.#",
    "#.#####.###.#.###.#",
    "#.....#.#B..#...#.#",
    "#.###.#.####.#.##.#",
    "#T..B...L..G..T...#",
    "###################" ] },
  { name: "Nivel 4: ¡El portal de Magix!", ghostEvery: 1, vision: 8, map: [
    "###################",
    "#P....#B....#.....#",
    "#.###.#.####.#.##.#",
    "#.#...#...#..L..#.#",
    "#.#.#####.#.###.#.#",
    "#...#...G.#...#...#",
    "#.###.###.###.#.###",
    "#.#B..#...#T..#...#",
    "#.#.####.##.###.#.#",
    "#...#..G..#...#.#.#",
    "#.###.####.##.#.#.#",
    "#.B..T.L...G..B..E#",
    "###################" ] }
];

const board = document.getElementById("board");
const livesLabel = document.getElementById("lives");
const scoreLabel = document.getElementById("score");
const bombsLabel = document.getElementById("bombs");
const ammoLabel = document.getElementById("ammo");
const levelLabel = document.getElementById("level");
const levelName = document.getElementById("levelName");
const message = document.getElementById("message");
const restartButton = document.getElementById("restart");
const nextButton = document.getElementById("next");
const soundButton = document.getElementById("sound");
const throwButton = document.getElementById("throw");
const startScreen = document.getElementById("start");
const playButton = document.getElementById("play");
const gameOverScreen = document.getElementById("gameover");
const finalScore = document.getElementById("finalScore");
const retryButton = document.getElementById("retry");
const winScreen = document.getElementById("win");
const winScore = document.getElementById("winScore");
const playAgainButton = document.getElementById("playAgain");
const pad = document.getElementById("pad");
const confettiLayer = document.getElementById("confetti");   // <div>, no <canvas>

const directions = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 }
};

const STUN_TURNS = 4;     // turnos que una Trix queda aturdida
const THROW_RANGE = 3;    // alcance (en casillas) de la luz
const MAX_LIVES = 3;
const CRYSTALS_PER_SHIFT = 2;   // Regla B: cada cuántos cristales recogidos se modifica el laberinto

// Estado del juego (variables y tipos primitivos + arreglos + objetos).
let map = [];
let player = { row: 1, col: 1 };
let startPos = { row: 1, col: 1 };
let ghosts = [];          // [{ row, col, stun, kind }]  (kind: icy, darcy o stormy)
let traps = [];
let bombs = [];
let exit = { row: 1, col: 17 };
let currentLevel = 0;
let totalBombs = 0;
let collected = 0;
let ammo = 0;
let lives = MAX_LIVES;
let score = 0;
let turn = 0;
let frozenTurns = 0;
let changedCells = [];     // casillas que cambió la Regla B (se resaltan una sola vez)
let shield = 0;           // turnos de protección tras ser atrapada
let gameOver = false;
let levelDone = false;
let started = false;      // el juego empieza al pulsar «Jugar»

// ---------- Cristal mágico dibujado con código (SVG, sin imagen) ----------
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

// El degradado de la esfera se define una sola vez y todas las bombas lo reutilizan.
const defsSvg = svgEl("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute" });
const gradient = svgEl("radialGradient", { id: "gemGlow", cx: "35%", cy: "30%", r: "75%" });
[["0", "#ffffff"], ["0.55", "#c8f3ff"], ["1", "#ffb3fa"]].forEach(([offset, color]) =>
  gradient.appendChild(svgEl("stop", { offset, "stop-color": color })));
const defs = svgEl("defs", {});
defs.appendChild(gradient);
defsSvg.appendChild(defs);
document.body.appendChild(defsSvg);

function makeGem(extraClass) {
  const svg = svgEl("svg", { viewBox: "0 0 48 48", "aria-hidden": "true" });
  if (extraClass) svg.setAttribute("class", extraClass);
  // alitas de hada
  svg.appendChild(svgEl("ellipse", { cx: 9, cy: 15, rx: 9, ry: 4.5, fill: "#8be8ff", opacity: 0.85, transform: "rotate(-30 9 15)" }));
  svg.appendChild(svgEl("ellipse", { cx: 39, cy: 15, rx: 9, ry: 4.5, fill: "#ff9ae6", opacity: 0.85, transform: "rotate(30 39 15)" }));
  // cristal con caras
  svg.appendChild(svgEl("polygon", { points: "10,16 24,16 24,44", fill: "#6fd3ff" }));
  svg.appendChild(svgEl("polygon", { points: "24,16 38,16 24,44", fill: "#ff6edb" }));
  svg.appendChild(svgEl("polygon", { points: "10,16 24,4 38,16", fill: "url(#gemGlow)" }));
  svg.appendChild(svgEl("polygon", { points: "24,4 38,16 24,44 10,16", fill: "none", stroke: "#fff", "stroke-width": 1.6, "stroke-linejoin": "round" }));
  svg.appendChild(svgEl("line", { x1: 24, y1: 4, x2: 24, y2: 44, stroke: "#fff", "stroke-width": 0.8, opacity: 0.7 }));
  // destello dorado
  svg.appendChild(svgEl("polygon", { points: "37,1 38.6,5.4 43,7 38.6,8.6 37,13 35.4,8.6 31,7 35.4,5.4", fill: "#ffd34d" }));
  return svg;
}

// Hada al estilo Bloom: pelo largo pelirrojo con broche dorado, ojos azules, top turquesa y alas celestes.
function makeFairy(extraClass) {
  const svg = svgEl("svg", { viewBox: "0 0 48 48", "aria-hidden": "true" });
  if (extraClass) svg.setAttribute("class", extraClass);
  const add = (name, attrs) => svg.appendChild(svgEl(name, attrs));
  // alas
  add("path", { d: "M21 26 C8 6 -1 18 5 30 C9 37 18 33 22 29 Z", fill: "#a9e8ff", stroke: "#fff", "stroke-width": 0.8, opacity: 0.9 });
  add("path", { d: "M27 26 C40 6 49 18 43 30 C39 37 30 33 26 29 Z", fill: "#a9e8ff", stroke: "#fff", "stroke-width": 0.8, opacity: 0.9 });
  add("ellipse", { cx: 11, cy: 38, rx: 6, ry: 3, fill: "#8bd9ff", opacity: 0.8, transform: "rotate(30 11 38)" });
  add("ellipse", { cx: 37, cy: 38, rx: 6, ry: 3, fill: "#8bd9ff", opacity: 0.8, transform: "rotate(-30 37 38)" });
  // pelo largo (atrás)
  add("path", { d: "M24 5 C10 5 8 20 10 31 C11 38 13 43 16 46 L32 46 C35 43 37 38 38 31 C40 20 38 5 24 5 Z", fill: "#e5471c" });
  add("path", { d: "M15 30 C14 36 15 41 17 44 M33 30 C34 36 33 41 31 44", stroke: "#ff8a4c", "stroke-width": 1.2, fill: "none", "stroke-linecap": "round" });
  // cuerpo: top turquesa y falda azul
  add("path", { d: "M18 33 L30 33 L32 40 L16 40 Z", fill: "#1bb7b0" });
  add("path", { d: "M14 40 L34 40 L39 47 L9 47 Z", fill: "#4aa3ff" });
  add("circle", { cx: 24, cy: 36, r: 1.1, fill: "#fff" });
  add("circle", { cx: 21, cy: 38.5, r: 0.7, fill: "#fff" });
  add("circle", { cx: 27.5, cy: 37.5, r: 0.7, fill: "#fff" });
  // cuello y cara
  add("rect", { x: 22, y: 29, width: 4, height: 5, fill: "#f6c9a6" });
  add("circle", { cx: 24, cy: 21, r: 9, fill: "#ffdcc0" });
  // ojos azules grandes
  [20, 28].forEach(x => {
    add("ellipse", { cx: x, cy: 22, rx: 2.3, ry: 2.9, fill: "#fff" });
    add("ellipse", { cx: x, cy: 22.4, rx: 1.7, ry: 2.4, fill: "#1fa6e8" });
    add("circle", { cx: x, cy: 22.6, r: 0.9, fill: "#0b3b66" });
    add("circle", { cx: x + 0.7, cy: 21.4, r: 0.6, fill: "#fff" });
  });
  add("circle", { cx: 17.5, cy: 26, r: 1.5, fill: "#ff8fa8", opacity: 0.45 });
  add("circle", { cx: 30.5, cy: 26, r: 1.5, fill: "#ff8fa8", opacity: 0.45 });
  add("path", { d: "M22 27 Q24 29.4 26 27", stroke: "#c4455a", "stroke-width": 1, fill: "none", "stroke-linecap": "round" });
  // flequillo y mechones laterales
  add("path", { d: "M14.5 21 C13.5 10 20 6.5 24.5 7 C30 7.5 35 11 33.5 21 C32 15.5 28 13.5 23 14 C19 14.4 16 17 14.5 21 Z", fill: "#ff5a24" });
  add("path", { d: "M14.5 21 C11 28 11.5 37 15 41 C15.5 33 15.5 27 17 21 Z", fill: "#ff5a24" });
  add("path", { d: "M33.5 21 C37 28 36.5 37 33 41 C32.5 33 32.5 27 31 21 Z", fill: "#ff5a24" });
  // broche dorado y destello
  add("ellipse", { cx: 20, cy: 7.5, rx: 3.2, ry: 2, fill: "#ffd34d", stroke: "#fff3b0", "stroke-width": 0.5 });
  add("polygon", { points: "42,2 43,5 46,6 43,7 42,10 41,7 38,6 41,5", fill: "#ffd34d" });
  return svg;
}

// Las Trix dibujadas con código: Icy (hielo), Darcy (oscuridad) y Stormy (tormenta).
const trixKinds = ["icy", "darcy", "stormy"];
const trixLook = {
  icy:    { hair: "#eef6ff", hairLine: "#9cc6ee", outfit: "#6cc8ff", accent: "#d6f1ff", wings: "#4d6fc4", eyes: "#38d6ff", skin: "#f6f1f8" },
  darcy:  { hair: "#4b2a78", hairLine: "#2a1448", outfit: "#8a3fc9", accent: "#e0a8ff", wings: "#34185c", eyes: "#ff4d9a", skin: "#f3d9c8" },
  stormy: { hair: "#b8651c", hairLine: "#7c3f0e", outfit: "#ffc533", accent: "#fff0a0", wings: "#c77a12", eyes: "#ffe14d", skin: "#fbdcc2" }
};

function makeTrix(kind, extraClass) {
  const look = trixLook[kind] || trixLook.icy;
  const svg = svgEl("svg", { viewBox: "0 0 48 48", "aria-hidden": "true" });
  if (extraClass) svg.setAttribute("class", extraClass);
  const add = (name, attrs) => svg.appendChild(svgEl(name, attrs));
  // alas puntiagudas de murciélago
  add("path", { d: "M21 25 L2 7 L8 21 L1 30 L12 29 L8 40 L22 33 Z", fill: look.wings, stroke: look.accent, "stroke-width": 0.8 });
  add("path", { d: "M27 25 L46 7 L40 21 L47 30 L36 29 L40 40 L26 33 Z", fill: look.wings, stroke: look.accent, "stroke-width": 0.8 });
  // pelo (atrás)
  add("path", { d: "M24 5 C10 5 8 20 10 31 L13 45 L35 45 L38 31 C40 20 38 5 24 5 Z", fill: look.hair, stroke: look.hairLine, "stroke-width": 0.8 });
  if (kind === "stormy") {                       // rizos
    [[10, 27], [38, 27], [10, 36], [38, 36]].forEach(([x, y]) => add("circle", { cx: x, cy: y, r: 4.2, fill: look.hair, stroke: look.hairLine, "stroke-width": 0.8 }));
  }
  if (kind === "darcy") {                        // ondas
    add("path", { d: "M12 36 Q9 40 13 43 M36 36 Q39 40 35 43", stroke: look.hairLine, "stroke-width": 1.2, fill: "none", "stroke-linecap": "round" });
  }
  // ropa
  add("path", { d: "M17 33 L31 33 L34 42 L14 42 Z", fill: look.outfit });
  add("path", { d: "M14 42 L34 42 L37 47 L11 47 Z", fill: look.accent, opacity: 0.85 });
  add("polygon", { points: "24,34 26,37.5 24,41 22,37.5", fill: look.accent });
  // cuello y cara
  add("rect", { x: 22, y: 29, width: 4, height: 5, fill: look.skin });
  add("circle", { cx: 24, cy: 21, r: 9, fill: look.skin });
  // ojos brillantes con cejas enojadas
  [[20, 1], [28, -1]].forEach(([x, side]) => {
    add("ellipse", { cx: x, cy: 22.5, rx: 2.4, ry: 1.9, fill: look.eyes, transform: "rotate(" + (side * 12) + " " + x + " 22.5)" });
    add("circle", { cx: x, cy: 22.6, r: 0.8, fill: "#210a33" });
    add("line", { x1: x - side * 3, y1: 18.2, x2: x + side * 3.2, y2: 20.6, stroke: "#2a1448", "stroke-width": 1.4, "stroke-linecap": "round" });
  });
  add("path", { d: "M20.5 27 Q24.5 30 28 26.2", stroke: "#8a1f55", "stroke-width": 1.1, fill: "none", "stroke-linecap": "round" });
  // flequillo
  add("path", { d: "M14.5 21 C13.5 10 20 6.5 24.5 7 C30 7.5 35 11 33.5 21 C32 16 28 14 23 14.5 C19 15 16 17.5 14.5 21 Z", fill: look.hair, stroke: look.hairLine, "stroke-width": 0.6 });
  // destello de poder
  add("polygon", { points: "42,2 43,5 46,6 43,7 42,10 41,7 38,6 41,5", fill: look.eyes });
  return svg;
}

// Los cristales de la leyenda y del botón central se rellenan aquí.
document.querySelectorAll(".gem-slot").forEach(slot => slot.appendChild(makeGem()));
document.querySelectorAll(".fairy-slot").forEach(slot => slot.appendChild(makeFairy()));

const keyOf = (row, col) => `${row},${col}`;
const distance = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

// ---------- Carga de niveles ----------
function loadLevel(index) {
  currentLevel = index;
  const config = levels[index];
  map = config.map.map(row => row.split(""));
  ghosts = []; traps = []; bombs = [];
  collected = 0; ammo = 0; turn = 0; frozenTurns = 0; shield = 0;
  lives = MAX_LIVES; gameOver = false; levelDone = false;
  gameOverScreen.hidden = true;
  winScreen.hidden = true;

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      if (tile === "P") { player = { row, col }; startPos = { row, col }; map[row][col] = "."; }
      if (tile === "G") { ghosts.push({ row, col, stun: 0, kind: trixKinds[ghosts.length % trixKinds.length] }); map[row][col] = "."; }
      if (tile === "T") { traps.push(keyOf(row, col)); map[row][col] = "."; }
      if (tile === "B") { bombs.push(keyOf(row, col)); map[row][col] = "."; }
      if (tile === "E") { exit = { row, col }; map[row][col] = "."; }
    }
  }
  totalBombs = bombs.length;
  nextButton.hidden = true;
  board.classList.remove("portal");
  document.body.classList.remove("alert");
  levelName.textContent = config.name;
  message.textContent = "¡Vamos! Encuentra el camino al portal de Magix. ✨";
  newMusicLayer(currentLevel);
  render();
}

function resetGame() {
  score = 0;
  loadLevel(0);
}

// ---------- Reglas de movimiento ----------
// Los láseres alternan: 3 turnos encendidos y 3 apagados.
const laserActive = () => Math.floor(turn / 3) % 2 === 0;

function isBlocked(row, col) {
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
  const tile = map[row][col];
  return tile === "#" || (tile === "L" && laserActive());
}

// Búsqueda en anchura (BFS): camino más corto entre dos casillas. Devuelve
// { first, dist } con el primer paso del camino, o null si no hay ruta.
function pathTo(from, to) {
  const queue = [{ row: from.row, col: from.col, first: null, dist: 0 }];
  const seen = new Set([keyOf(from.row, from.col)]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.row === to.row && current.col === to.col) return current;
    for (const step of Object.values(directions)) {
      const row = current.row + step.row;
      const col = current.col + step.col;
      const key = keyOf(row, col);
      if (seen.has(key) || isBlocked(row, col)) continue;
      seen.add(key);
      queue.push({ row, col, first: current.first || { row, col }, dist: current.dist + 1 });
    }
  }
  return null;
}

// ---------- Regla B: el laberinto se mueve ----------
// BFS que ignora los láseres (son temporales): ¿se puede llegar de una casilla a otra?
function canReach(from, to) {
  const queue = [{ row: from.row, col: from.col }];
  const seen = new Set([keyOf(from.row, from.col)]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.row === to.row && current.col === to.col) return true;
    for (const step of Object.values(directions)) {
      const row = current.row + step.row;
      const col = current.col + step.col;
      const inside = row >= 0 && row < map.length && col >= 0 && col < map[0].length;
      if (!inside || seen.has(keyOf(row, col)) || map[row][col] === "#") continue;
      seen.add(keyOf(row, col));
      queue.push({ row, col });
    }
  }
  return false;
}

// Intercambia en el arreglo `map` una pared y un camino libre elegidos al azar.
// Se descartan los intercambios que dejen sin ruta al portal o a algún cristal.
function shiftMaze() {
  const walls = [];
  const floors = [];
  for (let row = 1; row < map.length - 1; row++) {          // el borde exterior no se toca
    for (let col = 1; col < map[row].length - 1; col++) {
      const key = keyOf(row, col);
      if (map[row][col] === "#") walls.push({ row, col });
      else if (map[row][col] === "." && !traps.includes(key) && !bombs.includes(key)
        && !(row === exit.row && col === exit.col)
        && !(row === player.row && col === player.col)
        && !ghosts.some(g => g.row === row && g.col === col)) floors.push({ row, col });
    }
  }
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = walls[Math.floor(Math.random() * walls.length)];
    const b = floors[Math.floor(Math.random() * floors.length)];
    [map[a.row][a.col], map[b.row][b.col]] = [map[b.row][b.col], map[a.row][a.col]];   // intercambio
    const fair = canReach(player, exit) && bombs.every(k => {
      const [row, col] = k.split(",").map(Number);
      return canReach(player, { row, col });
    });
    if (fair) {
      message.textContent += " 🌀 ¡El laberinto se movió!";
      sfx("shift");
      changedCells = [keyOf(a.row, a.col), keyOf(b.row, b.col)];   // se resaltan al repintar
      return true;
    }
    [map[a.row][a.col], map[b.row][b.col]] = [map[b.row][b.col], map[a.row][a.col]];   // deshacer
  }
  return false;
}

function movePlayer(direction) {
  if (!started || gameOver || levelDone) return;
  startAudio();

  // Regla C: la trampa congela el siguiente turno.
  if (frozenTurns > 0) {
    frozenTurns--;
    document.body.classList.remove("alert");
    message.textContent = "¡Turno congelado! La trampa te hizo perder este movimiento.";
    endTurn();
    render();
    return;
  }

  const step = directions[direction];
  const nextRow = player.row + step.row;
  const nextCol = player.col + step.col;

  if (isBlocked(nextRow, nextCol)) {
    message.textContent = map[nextRow] && map[nextRow][nextCol] === "L"
      ? "⚡ ¡Láser encendido! Espera a que se apague."
      : "¡Cuidado! Ese camino está bloqueado. Busca otra ruta.";
    return;
  }

  let gotBomb = false;
  player = { row: nextRow, col: nextCol };
  const key = keyOf(player.row, player.col);
  playStepNote();

  if (traps.includes(key)) {
    traps = traps.filter(item => item !== key);
    frozenTurns = 1;
    document.body.classList.add("alert");
    message.textContent = "¡TRAMPA! Pierdes tu siguiente turno. 🚨";
    sfx("trap");
  } else if (bombs.includes(key)) {
    bombs = bombs.filter(item => item !== key);
    collected++; ammo++; score += 10;
    message.textContent = "¡Cristal mágico! +10 puntos y +1 hechizo. 💎";
    sfx("bomb");
    gotBomb = true;
  } else {
    message.textContent = "Sigue avanzando. ¡El portal de Magix te espera!";
  }

  if (player.row === exit.row && player.col === exit.col) {
    winLevel();
  } else if (!checkGhostCollision()) {
    endTurn();
  }
  // Regla B: el laberinto se modifica cada vez que se recogen CRYSTALS_PER_SHIFT cristales.
  if (!levelDone && !gameOver && gotBomb && collected % CRYSTALS_PER_SHIFT === 0) shiftMaze();
  render();
  if (gotBomb) confettiBurstAtPlayer();
}

// Defensa: el hechizo del cristal aturde a las Trix cercanas.
function throwLight() {
  if (!started || gameOver || levelDone) return;
  startAudio();
  if (ammo <= 0) {
    message.textContent = "No tienes hechizos. ¡Recoge un cristal mágico!";
    return;
  }
  const targets = ghosts.filter(g => g.stun === 0 && distance(g, player) <= THROW_RANGE);
  if (targets.length === 0) {
    message.textContent = "No hay Trix a tu alcance. Guarda tu magia.";
    return;
  }
  ammo--;
  targets.forEach(g => { g.stun = STUN_TURNS; score += 15; });
  message.textContent = `¡Hechizo Winx! ${targets.length} Trix aturdida(s). +${targets.length * 15} puntos ✨`;
  sfx("throw");
  endTurn();
  render();
}

// ---------- Las Trix ----------
// Cada Trix: si está aturdida espera; si ve a la jugadora (por camino real) la persigue
// con BFS; si no, deambula al azar. Nunca atraviesa paredes ni láseres, ni se apila con otra.
function moveGhosts() {
  const config = levels[currentLevel];
  ghosts.forEach(ghost => {
    if (ghost.stun > 0) { ghost.stun--; return; }
    if (turn % config.ghostEvery !== 0) return;

    const route = pathTo(ghost, player);
    let target = null;
    if (route && route.first && route.dist <= config.vision) {
      target = route.first;
    } else {
      const options = Object.values(directions)
        .map(step => ({ row: ghost.row + step.row, col: ghost.col + step.col }))
        .filter(pos => !isBlocked(pos.row, pos.col));
      if (options.length > 0) target = options[Math.floor(Math.random() * options.length)];
    }
    const occupied = target && ghosts.some(o => o !== ghost && o.row === target.row && o.col === target.col);
    if (target && !occupied) { ghost.row = target.row; ghost.col = target.col; }
  });
}

function endTurn() {
  turn++;
  if (shield > 0) shield--;
  moveGhosts();
  checkGhostCollision();
}

function checkGhostCollision() {
  if (shield > 0 || gameOver) return false;
  const caught = ghosts.some(g => g.stun === 0 && g.row === player.row && g.col === player.col);
  if (!caught) return false;

  lives--;
  sfx("hit");
  if (lives <= 0) {
    gameOver = true;
    message.textContent = "¡Quedaste sin vidas! Game over. 🖤";
    document.body.classList.remove("alert");
    finalScore.textContent = score;
    gameOverScreen.hidden = false;
    retryButton.focus();
  } else {
    player = { ...startPos };
    shield = 2;
    frozenTurns = 0;
    document.body.classList.remove("alert");
    message.textContent = "¡Una de las Trix te atrapó! Perdiste una vida y vuelves al inicio.";
  }
  return true;
}

function winLevel() {
  levelDone = true;
  board.classList.add("portal");
  score += 50 + lives * 10;
  document.body.classList.remove("alert");
  sfx("win");
  confettiRain(currentLevel === levels.length - 1 ? 320 : 170);
  if (currentLevel === levels.length - 1) {
    message.textContent = `🌟✨ ¡LO LOGRASTE! Completaste los 4 niveles con ${score} puntos. ¡Eres una verdadera Winx!`;
    winScore.textContent = score;
    winScreen.hidden = false;
    playAgainButton.focus();
  } else {
    message.textContent = "🌟 ¡Nivel superado! Pulsa «Siguiente nivel». ✨";
    nextButton.hidden = false;
  }
}

// ---------- Render (manipulación del DOM sin innerHTML) ----------
function render() {
  board.replaceChildren();
  const lasersOn = laserActive();
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.setAttribute("role", "gridcell");
      const key = keyOf(row, col);
      const tile = map[row][col];
      const ghost = ghosts.find(g => g.row === row && g.col === col);
      if (changedCells.includes(key)) cell.classList.add("changed");   // brillo suave, sin mover el tablero

      if (tile === "#") {
        cell.classList.add("wall");
      } else {
        cell.classList.add("path");
        if (tile === "L") { cell.classList.add("laser"); cell.textContent = "⚡"; if (!lasersOn) cell.classList.add("off"); }
        if (traps.includes(key)) { cell.classList.add("trap"); cell.textContent = "🕸️"; }
        if (bombs.includes(key)) {
          cell.classList.add("bomb");
          cell.appendChild(makeGem("gem-img"));
        }
        if (row === exit.row && col === exit.col) { cell.classList.add("exit"); cell.textContent = "🌟"; }
        if (ghost) {
          cell.classList.add("ghost");
          cell.appendChild(makeTrix(ghost.kind, ghost.stun > 0 ? "trix-img stunned" : "trix-img"));
          if (ghost.stun > 0) {
            const zzz = document.createElement("span");
            zzz.className = "zzz"; zzz.textContent = "💤";
            cell.appendChild(zzz);
          }
        }
        if (player.row === row && player.col === col) {
          cell.classList.add("player");
          if (shield > 0) cell.classList.add("shield");
          cell.appendChild(makeFairy("fairy-img"));
        }
      }
      board.appendChild(cell);
    }
  }
  changedCells = [];
  livesLabel.textContent = "💖".repeat(lives) + "🖤".repeat(MAX_LIVES - lives);
  scoreLabel.textContent = score;
  bombsLabel.textContent = `${collected} / ${totalBombs}`;
  ammoLabel.textContent = ammo;
  levelLabel.textContent = `${currentLevel + 1} / ${levels.length}`;
}

// ---------- Confeti (DOM + CSS, sin <canvas> ni timers) ----------
// Cada papelito es un <span> animado por CSS; se elimina solo cuando termina su animación
// (evento "animationend"), así no hay asincronismo escrito en JavaScript.
const confettiColors = ["#ff6edb", "#4fc3ff", "#c5e3ff", "#ffffff", "#ffd34d", "#7ae7ff", "#ff9ae6"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function addPiece(kind, left, top, dx, dy, duration, delay) {
  const size = 6 + Math.random() * 7;
  const piece = document.createElement("span");
  piece.className = "confetti-piece " + kind;
  piece.style.left = left + "px";
  piece.style.top = top + "px";
  piece.style.width = size + "px";
  piece.style.height = size / 2 + "px";
  piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  piece.style.setProperty("--dx", dx + "px");
  piece.style.setProperty("--dy", dy + "px");
  piece.style.setProperty("--rot", (Math.random() * 1080 - 540) + "deg");
  piece.style.animationDuration = duration + "s";
  piece.style.animationDelay = delay + "s";
  piece.addEventListener("animationend", () => piece.remove(), { once: true });
  confettiLayer.appendChild(piece);
}

// Lluvia desde arriba de toda la pantalla (cada papelito sale con un retraso distinto).
function confettiRain(count) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    addPiece("rain", Math.random() * window.innerWidth, -20,
      (Math.random() - 0.5) * 120, window.innerHeight + 60,
      2.5 + Math.random() * 2.5, Math.random() * 1.5);
  }
}

// Pequeña explosión sobre la jugadora al recoger un cristal.
function confettiBurstAtPlayer() {
  if (reducedMotion) return;
  const cell = board.querySelector(".player");
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const reach = 80 + Math.random() * 160;
    addPiece("burst", x, y, Math.cos(angle) * reach, Math.sin(angle) * reach + 80,
      0.9 + Math.random() * 0.7, 0);
  }
}

// ---------- Música y efectos (Web Audio API, todo generado con código) ----------
// La música se programa por adelantado con el reloj del audio (sin setInterval/setTimeout):
// cada acción de la jugadora rellena el calendario de notas. No se carga ningún archivo externo.

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let noiseBuffer = null;
let soundOn = true;
let musicTime = 0;
let musicStep = 0;

// Pista pop de baile: progresión Am - F - C - G, bombo, aplauso, hi-hat, bajo, acordes y arpegio.
const levelBpm = [102, 110, 118, 126];     // cada nivel más rápido
const levelShift = [0, 2, 3, 5];           // y en otra tonalidad
const progression = [
  { root: 45, third: 3 },  // Am
  { root: 41, third: 4 },  // F
  { root: 48, third: 4 },  // C
  { root: 43, third: 4 }   // G
];
const arpPattern = [0, 1, 2, 1, 3, 2, 1, 2];
const midiToFreq = note => 440 * 2 ** ((note - 69) / 12);

function startAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = soundOn ? 0.5 : 0;
    masterGain.connect(audioCtx.destination);
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    newMusicLayer();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  scheduleMusic();
}

function newMusicLayer() {
  if (!audioCtx) return;
  if (musicGain) musicGain.gain.value = 0;      // corta la capa del nivel anterior
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 1;
  musicGain.connect(masterGain);
  musicTime = 0; musicStep = 0;
  scheduleMusic();
}

function tone(freq, when, length, type, volume, destination) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(volume, when);
  env.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(env);
  env.connect(destination);
  osc.start(when);
  osc.stop(when + length + 0.02);
}

function kick(when) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
  env.gain.setValueAtTime(0.55, when);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
  osc.connect(env); env.connect(musicGain);
  osc.start(when); osc.stop(when + 0.25);
}

function noiseHit(when, length, cutoff, volume) {
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const env = audioCtx.createGain();
  source.buffer = noiseBuffer;
  filter.type = "highpass"; filter.frequency.value = cutoff;
  env.gain.setValueAtTime(volume, when);
  env.gain.exponentialRampToValueAtTime(0.0001, when + length);
  source.connect(filter); filter.connect(env); env.connect(musicGain);
  source.start(when); source.stop(when + length + 0.02);
}

// Programa 30 s de música con el reloj del audio (16 pasos por compás).
function scheduleMusic() {
  if (!audioCtx || !musicGain) return;
  const stepLen = 60 / levelBpm[currentLevel] / 4;
  const shift = levelShift[currentLevel];
  const now = audioCtx.currentTime;
  if (musicTime < now) musicTime = now + 0.05;

  while (musicTime < now + 30) {
    const s = musicStep % 16;
    const chord = progression[Math.floor(musicStep / 16) % progression.length];
    const root = chord.root + shift;
    const tones = [root + 12, root + 12 + chord.third, root + 19, root + 24];

    if (s % 4 === 0 && (currentLevel > 0 || s % 8 === 0)) kick(musicTime);
    if (s === 4 || s === 12) noiseHit(musicTime, 0.14, 1500, 0.2);
    if (s % 4 === 2) noiseHit(musicTime, 0.04, 7000, 0.08);
    if (currentLevel >= 2 && s % 2 === 1) noiseHit(musicTime, 0.03, 9000, 0.035);
    if ([0, 3, 6, 8, 11, 14].includes(s)) tone(midiToFreq(root), musicTime, stepLen * 1.8, "triangle", 0.25, musicGain);
    if (s === 0 || s === 6 || s === 10) tones.slice(0, 3).forEach(n => tone(midiToFreq(n), musicTime, stepLen * 1.6, "square", 0.035, musicGain));
    if (s % 2 === 0 && s < 12) tone(midiToFreq(tones[arpPattern[s / 2]] + 12), musicTime, stepLen * 1.7, "triangle", 0.1, musicGain);

    musicTime += stepLen;
    musicStep++;
  }
}

// Un sonido corto en cada paso para que la música "responda" al movimiento.
function playStepNote() {
  if (!audioCtx) return;
  scheduleMusic();
  tone(880 * 2 ** ((turn % 5) / 12), audioCtx.currentTime, 0.08, "square", 0.03, masterGain);
}

function sfx(name) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const sounds = {
    bomb:  [[784, 0], [988, 0.08], [1319, 0.16]],
    throw: [[1568, 0], [1175, 0.07], [1568, 0.14], [2093, 0.21]],
    trap:  [[196, 0], [147, 0.12], [110, 0.24]],
    hit:   [[330, 0], [247, 0.1], [165, 0.2]],
    win:   [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [1319, 0.5]],
    shift: [[392, 0], [330, 0.07], [440, 0.14]]
  };
  const type = name === "trap" || name === "hit" ? "sawtooth" : "square";
  sounds[name].forEach(([freq, delay]) => tone(freq, t + delay, 0.18, type, 0.12, masterGain));
}

function toggleSound() {
  startAudio();
  soundOn = !soundOn;
  if (masterGain) masterGain.gain.value = soundOn ? 0.5 : 0;
  soundButton.textContent = soundOn ? "🔊 Música" : "🔇 Silencio";
}

// ---------- Eventos del navegador ----------
document.addEventListener("keydown", event => {
  if (!started) { if (event.key === "Enter") startGame(); return; }
  const keyMap = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right"
  };
  const k = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (keyMap[k]) { event.preventDefault(); movePlayer(keyMap[k]); }
  else if (k === " ") { event.preventDefault(); throwLight(); }
  else if (k === "m") toggleSound();
  else if (k === "Enter" && (gameOver || !winScreen.hidden)) restart();
  else if (k === "Enter" && !nextButton.hidden) loadNext();
});

// Cruceta: izquierda, derecha, arriba, abajo y el centro ataca (en celular y en escritorio).
document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("pointerdown", event => { event.preventDefault(); movePlayer(button.dataset.move); });
});

// En celular la burbuja se puede arrastrar desde su borde para cambiarla de lugar.
let padDrag = null;
pad.addEventListener("pointerdown", event => {
  if (event.target !== pad) return;
  const rect = pad.getBoundingClientRect();
  padDrag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
  pad.setPointerCapture(event.pointerId);
});
pad.addEventListener("pointermove", event => {
  if (!padDrag) return;
  const left = Math.min(Math.max(event.clientX - padDrag.dx, 0), window.innerWidth - pad.offsetWidth);
  const top = Math.min(Math.max(event.clientY - padDrag.dy, 0), window.innerHeight - pad.offsetHeight);
  pad.style.left = left + "px"; pad.style.top = top + "px";
  pad.style.right = "auto"; pad.style.bottom = "auto";
});
function keepPadOnScreen() {
  if (!pad.style.left) return;
  const left = Math.min(Math.max(parseFloat(pad.style.left), 0), Math.max(0, window.innerWidth - pad.offsetWidth));
  const top = Math.min(Math.max(parseFloat(pad.style.top), 0), Math.max(0, window.innerHeight - pad.offsetHeight));
  pad.style.left = left + "px"; pad.style.top = top + "px";
}
window.addEventListener("resize", keepPadOnScreen);
["pointerup", "pointercancel"].forEach(name => pad.addEventListener(name, () => { padDrag = null; }));

// Deslizar el dedo sobre el tablero mueve a la jugadora (celulares y tablets).
let touchStart = null;
const boardWrap = document.querySelector(".board-wrap");
boardWrap.addEventListener("touchstart", event => {
  const t = event.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
boardWrap.addEventListener("touchend", event => {
  if (!touchStart) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) movePlayer(dx > 0 ? "right" : "left");
  else movePlayer(dy > 0 ? "down" : "up");
}, { passive: true });

function loadNext() {
  loadLevel(currentLevel + 1);
  startAudio();
}

function startGame() {
  started = true;
  startScreen.hidden = true;
  startAudio();
}

// La música se pausa si cambias de pestaña o bloqueas el celular.
document.addEventListener("visibilitychange", () => {
  if (!audioCtx) return;
  if (document.hidden) audioCtx.suspend();
  else if (started) audioCtx.resume();
});

playButton.addEventListener("click", startGame);
throwButton.addEventListener("pointerdown", event => { event.preventDefault(); throwLight(); });
soundButton.addEventListener("click", toggleSound);
nextButton.addEventListener("click", loadNext);
const restart = () => { resetGame(); startAudio(); };
restartButton.addEventListener("click", restart);
retryButton.addEventListener("click", restart);
playAgainButton.addEventListener("click", restart);
resetGame();
