import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Color,
  MeshBasicMaterial,
  CubeCamera,
  WebGLCubeRenderTarget,
  Vector2,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color(0x0a0a12);

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;

const EMISSIVE = ['torusKnot', 'lamp', 'neon'];

const loader = new GLTFLoader();
loader.load(
  '/models/scene.glb',
  (gltf) => {
    let sphere = null;

    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;

      if (EMISSIVE.includes(child.name)) {
        const { emissive, emissiveIntensity } = child.material;
        child.material = new MeshBasicMaterial({ color: emissive.clone().multiplyScalar(emissiveIntensity) });
      } else if (child.name === 'sphere') {
        sphere = child;
      } else {
        child.material = new MeshBasicMaterial({ map: child.material.map });
      }
    });

    scene.add(gltf.scene);

    if (sphere) {
      const cubeRenderTarget = new WebGLCubeRenderTarget(256);
      const cubeCamera = new CubeCamera(0.1, 100, cubeRenderTarget);
      sphere.getWorldPosition(cubeCamera.position);
      sphere.visible = false;
      cubeCamera.update(renderer, scene);
      sphere.visible = true;
      sphere.material.envMap = cubeRenderTarget.texture;
    }
  },
  undefined,
  (error) => {
    console.error('Erreur de chargement de scene.glb :', error);
  }
);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 1);
composer.addPass(bloomPass);

composer.addPass(new OutputPass());

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onResize);

function onRender() {
  controls.update();
  requestAnimationFrame(onRender);
  composer.render();
}

onRender();
