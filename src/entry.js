/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import {WebGLRenderer, PerspectiveCamera, Scene, Vector3} from 'three';
import OrbitControls from 'orbit-controls-es6';
import * as THREE from "three";
import dat from 'dat.gui';
import SplatScene from "./objects/Scene";
import Stats from "stats.js/src/Stats";

let stats = new Stats();
const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({antialias: true});

stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

// controls
const gui = new dat.GUI();

let options = {
  disk: {
    radius: 1,
  },
  splatSizes: [0.5, 0.75, 1, 1.5, 2]
};

// let disk = gui.addFolder('Splats');
// disk.add(options.disk, 'radius', {"ver smol": 0.5, "smol": 0.75, "normal": 1, "big": 1.5, "ver big": 2});
// // disk.add(options.disk.orientation, 'x', -1, 1).listen();
// // disk.add(options.disk.orientation, 'y', -1, 1).listen();
// // disk.add(options.disk.orientation, 'z', -1, 1).listen();
// disk.open();


// scene
let splatScene = new SplatScene(options);
scene.add(splatScene);
scene.add(new THREE.AxesHelper(20));


// camera
camera.position.set(1, 1, 1);
camera.lookAt(new Vector3(0, 0, 0));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true;
controls.maxDistance = 1500;
controls.minDistance = 0;


// renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xeeeeee, 1); // grey background

// ENABLE/DISABLE SHADOWS
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

// render loop
const onAnimationFrameHandler = (timeStamp) => {
  stats.update();
  renderer.render(scene, camera);
  splatScene.update && splatScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHanlder = () => {
  const {innerHeight, innerWidth} = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHanlder();
window.addEventListener('resize', windowResizeHanlder);

// dom
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom);



let loadFile = function (e) {
  let file = e.target.files[0];
  splatScene.file = file.name.split(/(\\|\/)/g).pop().replace(/(^.+\D)(\d+)(\D.+$)/i, '$2'); //find first integer
  // console.log(splatScene.file);
  if (!file) {
    return;
  }
  let reader = new FileReader();

  // transport.on('data', () => alert(this.data));

  reader.onload = (f) => {
    let lines = reader.result.split("\n");
    splatScene.updateSplats(lines);
  }
  reader.readAsText(file);
};



document.getElementById('file-input')
  .addEventListener('change', loadFile, false);



