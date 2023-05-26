import * as THREE from 'three';
import {InputManager} from "./inputManager";
import {SpinMesh} from "./spinMesh";

const phi = (1 + Math.sqrt(5)) / 2;

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	preserveDrawingBuffer: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 14.8;

const input = new InputManager(renderer.domElement);

const darkMatteMat = new THREE.MeshLambertMaterial({color: 0x282828})

//-------------- ico

const icoGeometry = new THREE.IcosahedronGeometry(1, 0);
const icoMesh = new THREE.Mesh(icoGeometry, darkMatteMat);

//make tip point up
icoMesh.rotation.z += Math.atan(1 / phi);
//make nice triangle face front
icoMesh.rotation.y += Math.atan(-.5 / phi);

//x-axis tilt to make top & bot triangles have a nice size ratio
const frontTilt = .15;
const axisTilt = -0.33 / phi;
let quatAxisTilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), axisTilt);
quatAxisTilt.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), frontTilt));

let axis = new THREE.Vector3(0, 1, 0).applyQuaternion(quatAxisTilt)

applyQuat(icoMesh, quatAxisTilt);

const spinIco = new SpinMesh(icoMesh, axis, 0.0005);
input.addSpinMesh(spinIco);

//---------- actual dice

const haloCubeSize1 = 0.5;

const cubeGeometry = new THREE.BoxGeometry(haloCubeSize1, haloCubeSize1, haloCubeSize1);
const cubeMesh = new THREE.Mesh(cubeGeometry, darkMatteMat);

const spinCube = new SpinMesh(cubeMesh, new THREE.Vector3(0, 0, 1), 0.0005);
spinCube.setOffset(new THREE.Vector3(3.7, 0, 0));
input.addSpinMesh(spinCube);

//----------- light


const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

const target1 = new THREE.Object3D();
const target2 = new THREE.Object3D();
const target3 = new THREE.Object3D();
target1.position.set(0, -1.7, -1.8);
target2.position.set(3, 1.75, -0.8);
target3.position.set(-2.8, -0.1, -1.6);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.15);
const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.15);

dirLight1.target = target1;
dirLight2.target = target2;
dirLight3.target = target3;

const texture = new THREE.TextureLoader().load("/backdrop.png");
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.encoding = THREE.sRGBEncoding;

//--------------- background

const radFOV = THREE.MathUtils.degToRad(camera.fov);
const planeDist = camera.position.z + 2; //this should be +1 .-.
const planeScale = 2 * planeDist * Math.atan(0.5 * radFOV);
const planeGeometry = new THREE.PlaneGeometry(planeScale * 16/9, planeScale);
const planeMaterial = new THREE.MeshBasicMaterial({
	map: texture
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, -1);

scene.add(icoMesh);
scene.add(cubeMesh);
scene.add(plane);

scene.add(ambientLight);

scene.add(target1);
scene.add(target2);
scene.add(target3);
scene.add(dirLight1);
scene.add(dirLight2);
scene.add(dirLight3);


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

animate();