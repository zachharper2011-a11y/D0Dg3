const canvas = document.getElementById('game');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#071023');

let W = window.innerWidth;
let H = window.innerHeight;
let running = true;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 0.9;
let score = 0;
let speedMultiplier = 1;
const obstacles = [];

function resize(){
  W = window.innerWidth;
  H = window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
}
window.addEventListener('resize', resize);
resize();

// Lights
const ambient = new THREE.HemisphereLight(0xa3bff8, 0x202437, 0.8);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(-5, 10, 5);
scene.add(directional);

// Road
const roadGeom = new THREE.PlaneGeometry(20, 120, 1, 1);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x1d2f4e, side: THREE.DoubleSide });
const road = new THREE.Mesh(roadGeom, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -50;
scene.add(road);

// Track markings
const lineGeom = new THREE.PlaneGeometry(1, 120, 1, 1);
const lineMat = new THREE.MeshStandardMaterial({ color: 0xf3f7ff, emissive: 0x3050ff, emissiveIntensity: 0.3 });
const centerLine = new THREE.Mesh(lineGeom, lineMat);
centerLine.rotation.x = -Math.PI / 2;
centerLine.position.z = -50;
scene.add(centerLine);

// Player
const playerGeom = new THREE.BoxGeometry(2.2, 1, 4);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x4ee1a7, metalness: 0.2, roughness: 0.5 });
const player = new THREE.Mesh(playerGeom, playerMat);
player.position.set(0, 0.7, 10);
scene.add(player);

camera.position.set(0, 5, 18);
camera.lookAt(0, 0, 0);

const playerState = { x: 0, dir: 0, maxX: 8, speed: 18 };

function spawnObstacle(){
  const width = 1.5 + Math.random() * 2.5;
  const depth = 2 + Math.random() * 3;
  const color = new THREE.Color().setHSL(0.02 + Math.random() * 0.08, 0.9, 0.5);
  const geom = new THREE.BoxGeometry(width, 1.8, depth);
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.45 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set((Math.random() - 0.5) * 14, 0.9, -80);
  scene.add(mesh);
  obstacles.push({ mesh, width, depth, active: true });
}

function reset(){
  obstacles.forEach(obj => scene.remove(obj.mesh));
  obstacles.length = 0;
  running = true;
  lastTime = performance.now();
  spawnTimer = 0;
  spawnInterval = 0.9;
  score = 0;
  speedMultiplier = 1;
  playerState.x = 0;
  player.dir = 0;
  player.position.x = 0;
  restartBtn.hidden = true;
  requestAnimationFrame(loop);
}

function collide(objA, objB){
  const a = new THREE.Box3().setFromObject(objA);
  const b = new THREE.Box3().setFromObject(objB);
  return a.intersectsBox(b);
}

function update(dt){
  playerState.x += playerState.dir * playerState.speed * dt;
  playerState.x = Math.max(-playerState.maxX, Math.min(playerState.maxX, playerState.x));
  player.position.x += (playerState.x - player.position.x) * 12 * dt;

  spawnTimer += dt;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    spawnObstacle();
    spawnInterval = Math.max(0.35, spawnInterval * 0.98);
    speedMultiplier = Math.min(4, speedMultiplier + 0.025);
  }

  obstacles.forEach((obs, index) => {
    obs.mesh.position.z += 28 * dt * speedMultiplier;
    if(obs.mesh.position.z > 20){
      scene.remove(obs.mesh);
      obstacles.splice(index, 1);
    } else if(obs.active && collide(obs.mesh, player)){
      obs.active = false;
      running = false;
    }
  });

  score += dt * 25 * speedMultiplier;
  scoreEl.textContent = 'Score: ' + Math.floor(score);
}

function loop(ts){
  const dt = Math.min((ts - lastTime) / 1000, 0.035);
  lastTime = ts;

  if(running){
    update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  } else {
    renderer.render(scene, camera);
    restartBtn.hidden = false;
  }
}

window.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft' || e.key === 'a') playerState.dir = -1;
  if(e.key === 'ArrowRight' || e.key === 'd') playerState.dir = 1;
});
window.addEventListener('keyup', e => {
  if(['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) playerState.dir = 0;
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const x = e.touches[0].clientX;
  playerState.dir = x < W / 2 ? -1 : 1;
});
canvas.addEventListener('touchend', () => { playerState.dir = 0; });

restartBtn.addEventListener('click', reset);

reset();
