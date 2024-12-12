import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { LoDGrid3DManager } from './Grid3D.js';
import { TransformControls } from './jsm/controls/TransformControls.js';

import { VoxelHandler } from './VoxelHandler.js';
import { VoxelViewer } from './VoxelViewer.js';

const stats = new Stats()
document.body.appendChild( stats.dom );

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
let pointLight0 = new THREE.PointLight(0xffffff, 100);
pointLight0.position.set(5,4,5);
scene.add(pointLight0);

const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
camera.position.set( 2, 2, 6 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.autoClear = false;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(2, 2, 2);
orbitControls.update()




const point0 = new THREE.Vector3(-50.7, -50.1, 50.2);
const point1 = new THREE.Vector3(53.75, 54.5, 51.5);

const points = [point0, point1];

const rayGeometry = new THREE.BufferGeometry().setFromPoints([point0, point1]);
const rayMaterial = new THREE.LineBasicMaterial({
    color: 0x4080ff,
    linewidth: 3,
});
const rayMesh = new THREE.Line(rayGeometry, rayMaterial);
scene.add(rayMesh)
const rayPositions = rayMesh.geometry.attributes.position;

const ray = {
  direction: new THREE.Vector3(),
  origin: new THREE.Vector3(),
}


const maxLoD = 3;
const gridManager = new LoDGrid3DManager(maxLoD)
gridManager.addTo(scene)


const voxelHandler = new VoxelHandler(maxLoD);
// voxelHandler.addVoxel({x: 43, y:37, z:25});
// voxelHandler.addVoxel({x: 13, y:37, z:25});
// voxelHandler.addVoxel({x: 47, y:17, z:25});
// voxelHandler.addVoxel({x: 43, y:30, z:25});
// voxelHandler.addVoxel({x: 43, y:37, z:5});
// voxelHandler.addVoxel({x: 20, y:7, z:12});

for(let i = 0; i < 20; ++i) {
  voxelHandler.addVoxel({
    x: ~~(Math.random() * 64),
    y: ~~(Math.random() * 64),
    z: ~~(Math.random() * 64)
  });
} 


const voxelViewer = new VoxelViewer(maxLoD);
voxelViewer.addTo(scene);


voxelHandler.viewBricks(gridManager);
voxelHandler.viewVoxel(voxelViewer);

function updateRay(pId, pos) {
  
  const index = pId * 3;
  rayPositions.array[index] = pos.x;
  rayPositions.array[index+1] = pos.y;
  rayPositions.array[index+2] = pos.z;

  rayPositions.needsUpdate = true;

  points[pId].copy(pos)

  ray.origin.copy(points[0])
  ray.direction.copy(points[1]).sub(points[0]).normalize();


}

updateRay(0, point0)
updateRay(1, point1)

let requiresUpdate = false;



const sphereGeometry = new THREE.SphereGeometry( 0.05, 16, 16 );
const sphereMaterial = new THREE.MeshPhongMaterial( { color: 0x4499FF, transparent: true, opacity: 0.5 } );
const spheres = [
  new THREE.Mesh(sphereGeometry, sphereMaterial),
  new THREE.Mesh(sphereGeometry, sphereMaterial),
]

spheres[0].position.copy(point0);
spheres[1].position.copy(point1);

scene.add(...spheres);


const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100));


const sphereGeometry2 = new THREE.SphereGeometry( 0.025, 16, 16 );
const sphereMaterial2 = new THREE.MeshPhongMaterial( { color: 0x2244AA, wireframe: true } );

let inter0 = new THREE.Mesh(sphereGeometry2, sphereMaterial2)
let inter1 = new THREE.Mesh(sphereGeometry2, sphereMaterial2)
scene.add(inter0)
scene.add(inter1)



function recompute() {
  if(requiresUpdate) {
    gridManager.reset()
    initiateMarch(ray);
    gridManager.update();
    requiresUpdate = false;
  }
}








const epsilon = 0.00000001;

const dirSigns = new THREE.Vector3()
const Dir = new THREE.Vector3();
const invDir = new THREE.Vector3();
const timeSteps = new THREE.Vector3();
const resolutionLoD = new Array(maxLoD);
const scaleLoD = new Array(maxLoD);
const moves = new THREE.Vector3();

/// debug 
const depths = []
let checks = 0;
function initiateMarch(ray) {
  checks = 0;
  /// set ray to [0,1]² space
  const ray2 = {
    direction: ray.direction.clone().normalize(),
    origin: ray.origin.clone().divideScalar(4)
  }

  /// get ray signs for each axis
  dirSigns.set(
    ray2.direction.x >= 0 ? 1 : 0,
    ray2.direction.y >= 0 ? 1 : 0,
    ray2.direction.z >= 0 ? 1 : 0,
  );

  /// get integer displacements on each axis
  moves.copy(dirSigns).multiplyScalar(2).sub(new THREE.Vector3(1, 1, 1));

  /// inverse of the direction of the ray to avoid 
  invDir.set(
    1 / ray2.direction.x,
    1 / ray2.direction.y,
    1 / ray2.direction.z,
  );

  timeSteps.set(
    1 / ray2.direction.x,
    1 / ray2.direction.y,
    1 / ray2.direction.z,
  );
  timeSteps.multiply(moves)

  Dir.copy(ray2.direction);

  for(let lod = 0; lod < maxLoD; ++lod) {
    resolutionLoD[lod] = 1 / Math.pow(4, lod);

  }

  const {entryPoint, entry, exit} = computeEntryPoint(ray2);

  depths.length = 0


  if(entry < exit)
    stepThroughCell(new THREE.Vector3(0, 0, 0), ray2, entryPoint, entry, exit, 0, entry*4);
  else 
    gridManager.showCell(0);
  /// debug

  inter0.position.copy(ray.origin.clone().addScaledVector(ray.direction, entry*4));
  inter1.position.copy(ray.origin.clone().addScaledVector(ray.direction, exit*4));

  console.log(checks)
  ///
}

function stepThroughCell(cell, ray, entryPoint, entryT, exitT, lod = 0,  depth = 0, globalCell = new THREE.Vector3()) {  
  if(lod >= maxLoD)
    return;

  ++checks;

  /// rescaling time from [0,1]² -> [0,4]²
  const timeToExit = (exitT - entryT) * 4;

  
  /// entry point: [0, 1]²
  /// first point : [0, 4]²
  const firstPoint = entryPoint.clone().sub(cell).multiplyScalar(4);

  /// DEBUG
  const globalCellLod = globalCell.clone().multiplyScalar(4).add(cell);
  gridManager.showCell(lod, globalCellLod);
  
  /// 

  const nextBoundary = firstPoint.clone().floor().add(dirSigns);
  const closestBoundary = nextBoundary.clone().sub(firstPoint).multiply(invDir);

  closestBoundary.x += closestBoundary.x < epsilon ? timeSteps.x : 0;
  closestBoundary.y += closestBoundary.y < epsilon ? timeSteps.y : 0;
  closestBoundary.z += closestBoundary.z < epsilon ? timeSteps.z : 0;


  const voxel = firstPoint.clone().floor();
  voxel.clamp(new THREE.Vector3(0,0,0), new THREE.Vector3(3,3,3));
  let t = 0;
  let i = 0;
  const hits = new Array(10);
  const voxelHits = new Array(10);
  do {
    hits[i] = t;
    voxelHits[i] = voxel.clone();
    if(closestBoundary.x < closestBoundary.y && closestBoundary.x < closestBoundary.z) {
      t = closestBoundary.x;
      closestBoundary.x += timeSteps.x;
      voxel.x += moves.x;
    }else if(closestBoundary.y < closestBoundary.z) {
      t = closestBoundary.y;
      closestBoundary.y += timeSteps.y;
      voxel.y += moves.y;
    }
    else {
      t = closestBoundary.z;
      closestBoundary.z += timeSteps.z;
      voxel.z += moves.z;
    }

    ++i
  } while(t < timeToExit - epsilon && i < 10)
  hits[i] = timeToExit;


  

  for(let j = 0; j < i; ++j) {
    const newDepth = depth + hits[j] * resolutionLoD[lod];
    // if(newDepth < 10 / (lod*1.25))
    stepThroughCell(
      voxelHits[j].clone(),
      ray,
      firstPoint.clone().addScaledVector(Dir, hits[j]),
      hits[j],
      hits[j+1],
      lod+1,
      newDepth,
      globalCellLod,
    );
  }
}

initiateMarch(ray)



/// used once to enter first box
function computeEntryPoint(ray) {
  const direction = ray.direction.clone();
  const origin = ray.origin.clone();


  const tTo0 = new THREE.Vector3(
    - origin.x / (direction.x != 0 ? direction.x : Infinity),
    - origin.y / (direction.y != 0 ? direction.y : Infinity),
    - origin.z / (direction.z != 0 ? direction.z : Infinity),
  )

  const tTo1 = new THREE.Vector3(
    (1 - origin.x) / (direction.x != 0 ? direction.x : 0),
    (1 - origin.y) / (direction.y != 0 ? direction.y : 0),
    (1 - origin.z) / (direction.z != 0 ? direction.z : 0),
  )
  
  const tMin = new THREE.Vector3(
    Math.max(0, dirSigns.x ? tTo0.x : tTo1.x), 
    Math.max(0, dirSigns.y ? tTo0.y : tTo1.y), 
    Math.max(0, dirSigns.z ? tTo0.z : tTo1.z) 
  );

  const tMax = new THREE.Vector3(
    Math.min(Number.MAX_VALUE, dirSigns.x ? tTo1.x : tTo0.x), 
    Math.min(Number.MAX_VALUE, dirSigns.y ? tTo1.y : tTo0.y), 
    Math.min(Number.MAX_VALUE, dirSigns.z ? tTo1.z : tTo0.z) 
  );

  const entry = Math.max(Math.max(tMin.x, tMin.y), tMin.z);
  const exit = Math.min(Math.min(tMax.x, tMax.y), tMax.z);

  const entryPoint = origin.clone().addScaledVector(direction, entry)

  entryPoint.clamp(new THREE.Vector3(0,0,0), new THREE.Vector3(1,1,1))
  return {entryPoint, entry, exit}
}


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2( 1, 1 );

function setMouse(px, py) {
  mouse.set( ( px / window.innerWidth ) * 2 - 1, - ( py / window.innerHeight ) * 2 + 1 );
}

function onPointerDown(event) {
  if(event.button != 2)
    return;

  setMouse(event.clientX, event.clientY);

  raycaster.setFromCamera(mouse, camera);
  const ray = raycaster.ray.clone();

  updateRay(0, ray.origin);
  updateRay(1, ray.at(20, ray.origin.clone()));
  requiresUpdate = true;
}

document.addEventListener( 'pointerdown', onPointerDown );

window.addEventListener('resize', function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});


function animate() {
  for(let i = 0; i < 1; ++i) {
    renderer.render( scene, camera );
    stats.update()
    recompute()
  }
}

renderer.setAnimationLoop( animate );





