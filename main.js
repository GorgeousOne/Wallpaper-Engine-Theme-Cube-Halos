import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	preserveDrawingBuffer: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.IcosahedronGeometry(1, 0);
const material = new THREE.MeshLambertMaterial({color: 0x515151})
const cube = new THREE.Mesh(geometry, material);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

const target = new THREE.Object3D();
target.position.set(-1, 0, -3);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.target = target;

const texture = new THREE.TextureLoader().load("./public/backdrop.png");
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.encoding = THREE.sRGBEncoding;

const planeGeometry = new THREE.PlaneGeometry(.5 * 16, .5 * 9);
const planeMaterial = new THREE.MeshBasicMaterial({
	side: THREE.DoubleSide,
	map: texture
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);

scene.add(cube);
scene.add(ambientLight);
scene.add(target);
scene.add(directionalLight);
scene.add(plane);


function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

animate();