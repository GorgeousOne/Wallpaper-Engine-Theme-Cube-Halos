import * as THREE from 'three';
import {InputManager} from "./inputManager";
import {SpinMesh, CompositeSpinMesh} from "./spinMesh";

const phi = (1 + Math.sqrt(5)) / 2;

const renderer = new THREE.WebGLRenderer({
	canvas: document.getElementById("fg"),
	alpha: true,
	antialias: true,
	preserveDrawingBuffer: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 14.8;

const input = new InputManager(renderer.domElement);

//---------- Material

const darkMatteMat = new THREE.MeshLambertMaterial({color: 0x282828})

// add raytracing like noise :D
darkMatteMat.onBeforeCompile = function ( shader ) {
	shader.fragmentShader = shader.fragmentShader.replace(
		"}",
		`
	float noise = (noise(gl_FragCoord.xy) - 0.5) * 1.0 / 256.0;
	gl_FragColor += vec4(vec3(noise), 1);
}
	`);

	shader.fragmentShader = shader.fragmentShader.replace(
		"void main() {",
		`
float noise(vec2 co) {
	return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
void main() {
		`);
}

//-------------- ico

const icoGeometry = new THREE.IcosahedronGeometry(1, 0);
const icoMesh = new THREE.Mesh(icoGeometry, darkMatteMat);

//make tip point up
icoMesh.rotation.z = Math.atan(1 / phi);
//make nice triangle face front
icoMesh.rotation.y = Math.atan(-.5 / phi);

//x-axis tilt to make top & bot triangles have a nice size ratio
const frontTilt = .15;
const axisTilt = -0.33 / phi;
let quatAxisTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), axisTilt);
quatAxisTilt.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), frontTilt));

let axis = new THREE.Vector3(0, 1, 0).applyQuaternion(quatAxisTilt)

applyQuat(icoMesh, quatAxisTilt);

const spinIco = new SpinMesh(icoMesh, axis, 0.0005);

//---------- actual dice

const haloCubeSize1 = 0.3;
const haloCubeSize2 = 0.48;

const cubeGeometry1 = new THREE.BoxGeometry(haloCubeSize1, haloCubeSize1, haloCubeSize1);
const cubeGeometry2 = new THREE.BoxGeometry(haloCubeSize2, haloCubeSize2, haloCubeSize2);

const innerHalo = createHalo(cubeGeometry1, 12, new THREE.Vector3(0.9, 0.47, -0.08), new THREE.Vector3(2.5, 0, 0));
const outerHalo = createHalo(cubeGeometry2, 16, new THREE.Vector3(-0.45, -0.65, -0.04), new THREE.Vector3(3.8, 0, 0));

/**
 *
 * @param {BufferGeometry} geometry
 * @param {number} numElems
 * @param {THREE.Vector3} eulerRot
 * @param {THREE.Vector3} offset
 * @returns {CompositeSpinMesh}
 */
function createHalo(geometry, numElems, eulerRot, offset) {
	let halo = [];

	for (let i = 0; i < numElems; ++i) {
		const angle = 2 * Math.PI / numElems * i;
		const spokeRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);

		const mesh = new THREE.Mesh(geometry, darkMatteMat);
		mesh.rotation.set(eulerRot.x, eulerRot.y, eulerRot.z);
		applyQuat(mesh, spokeRot);
		scene.add(mesh);

		const spinMesh = new SpinMesh(mesh, new THREE.Vector3(0, 0, 1), 0.0005);
		spinMesh.setOffset(offset.clone().applyQuaternion(spokeRot));
		halo.push(spinMesh);
	}
	return new CompositeSpinMesh(halo);
}

//----------- input thingies

input.addSpinMesh(spinIco);
input.addSpinMesh(innerHalo);
input.addSpinMesh(outerHalo);

//----------- light

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
const pointLight2 = new THREE.PointLight(0xffffff, 0.15);
const pointLight3 = new THREE.PointLight(0xffffff, 0.15);

pointLight1.position.set(0, 3.4, 3.6);
pointLight2.position.set(-6, -3.5, 1.6);
pointLight3.position.set(5.6, 0.2, 3.2);

const texture = new THREE.TextureLoader().load("background.png", console.log, console.log, console.log);
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.encoding = THREE.sRGBEncoding;

scene.add(icoMesh);

scene.add(ambientLight);

scene.add(pointLight1);
scene.add(pointLight2);
scene.add(pointLight3);

/**
 *
 * @param {THREE.Object3D} mesh
 * @param {THREE.Quaternion} quat
 */
function applyQuat(mesh, quat) {
	mesh.quaternion.multiplyQuaternions(quat, mesh.quaternion);
	mesh.setRotationFromQuaternion(mesh.quaternion);
}


function animate() {
	requestAnimationFrame(animate);
	input.update();
	renderer.render(scene, camera);
}

function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

window.addEventListener("resize", onResize);
animate();
