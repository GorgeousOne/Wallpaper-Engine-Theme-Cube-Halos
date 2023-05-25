import * as THREE from 'three';

const phi = (1 + Math.sqrt(5)) / 2;

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	preserveDrawingBuffer: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const geometry = new THREE.IcosahedronGeometry(1, 0);
const material = new THREE.MeshLambertMaterial({color: 0x515151})
const cube = new THREE.Mesh(geometry, material);

//make tip point up
cube.rotation.z += Math.atan(1 / phi);
//make nice triangle face front
cube.rotation.y += Math.atan(-.5 / phi);

//x-axis tilt to make top & bot triangles have a nice size ratio
const frontTilt = .15;
const axisTilt = -0.33 / phi;
let quatAxisTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), axisTilt);
quatAxisTilt.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), frontTilt));

let axis = new THREE.Vector3(0, 1, 0).applyQuaternion(quatAxisTilt)

cube.quaternion.multiplyQuaternions(quatAxisTilt, cube.quaternion);
cube.setRotationFromQuaternion(cube.quaternion);
let defaultRot = cube.quaternion.clone();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
const target = new THREE.Object3D();
target.position.set(-1, 0, -3);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.target = target;

const texture = new THREE.TextureLoader().load("./public/backdrop.png");
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.encoding = THREE.sRGBEncoding;

const planeGeometry = new THREE.PlaneGeometry(16, 9);
const planeMaterial = new THREE.MeshBasicMaterial({
	side: THREE.DoubleSide,
	map: texture
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, -5);
scene.add(cube);
scene.add(ambientLight);
scene.add(target);
scene.add(directionalLight);
scene.add(plane);

let mouseDown = false;
let mouseX = 0;
let rotationY = 0;

function onMouseMove(event) {
	if (!mouseDown) return;

	let deltaX = event.clientX - mouseX;
	rotationY += deltaX * 0.01;
	mouseX = event.clientX;
}

function onMouseDown(event) {
	mouseDown = true;
	mouseX = event.clientX;
}

function onMouseUp() {
	mouseDown = false;
}

document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);

function animate() {
	requestAnimationFrame(animate);
	let newRot = new THREE.Quaternion().setFromAxisAngle(axis, rotationY);
	newRot.multiply(defaultRot);
	cube.setRotationFromQuaternion(newRot);

	renderer.render(scene, camera);
}

animate();