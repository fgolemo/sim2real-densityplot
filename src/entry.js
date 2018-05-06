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
import Dragdropper from "./dragdropper";
import SplatScene from "./objects/Scene";
import LightScene from "./objects/Lights";
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
    orientation: {
      x: 1,
      y: 0.5,
      z: 0.1
    }
  },
  rendering: {
    mode: "normal",
    background: false
  },
  light: {
    x: 2,
    y: 2,
    z: 2
  },
  splatSizes: [0.5, 0.75, 1, 1.5, 2]
};

let disk = gui.addFolder('Splats');
disk.add(options.disk, 'radius', {"ver smol": 0.5, "smol": 0.75, "normal": 1, "big": 1.5, "ver big": 2});
// disk.add(options.disk.orientation, 'x', -1, 1).listen();
// disk.add(options.disk.orientation, 'y', -1, 1).listen();
// disk.add(options.disk.orientation, 'z', -1, 1).listen();
disk.open();

let rendering = gui.addFolder("Rendering");
let renderMode = rendering.add(options.rendering, 'mode', ["normal", "point light"]);
rendering.add(options.rendering, 'background');
rendering.open();


let light = gui.addFolder("Light");
light.add(options.light, 'x', -2, 2);
light.add(options.light, 'y', -2, 2);
light.add(options.light, 'z', -2, 2);
light.open();


// scene
let splatScene = new SplatScene(options, renderMode);
scene.add(splatScene);
scene.add(new THREE.AxesHelper(20));

let lightScene = new LightScene(options);
scene.add(lightScene);

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
  lightScene.update && lightScene.update(timeStamp);
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


// file drag & dropper
new Dragdropper(scene, splatScene);


