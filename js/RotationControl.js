import {
	EventDispatcher,
	MOUSE,
	Quaternion,
	Spherical,
	TOUCH,
	Vector2,
	Vector3
} from 'three';
// OrbitControls performs orbiting
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
const _changeEvent = {type: 'change'};
const _startEvent = {type: 'start'};
const _endEvent = {type: 'end'};

export class RotationControl extends EventDispatcher {
	constructor(object, domElement) {
		super();
		this.object = object;
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll

		// "target" sets the location of focus, where the object orbits around
		this.target = new Vector3();
		// How far you can orbit vertically, upper and lower limits.
		// Range is 0 to Math.PI radians.
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians
		// How far you can orbit horizontally, upper and lower limits.
		// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
		this.minAzimuthAngle = -Infinity; // radians
		this.maxAzimuthAngle = Infinity; // radians
		// Set to true to enable damping (inertia)
		// If damping is enabled, you must call controls.update() in your animation loop
		this.enableDamping = false;
		this.dampingFactor = 0.008;
		// Set to false to disable rotating
		this.rotateSpeed = 2.0;
		// Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60
		// for reset
		this.target0 = this.target.clone();
		this.position0 = this.object.position.clone();

		this.getPolarAngle = function () {
			return spherical.phi;
		};
		this.getAzimuthalAngle = function () {
			return spherical.theta;
		};
		this.getDistance = function () {
			return this.object.position.distanceTo(this.target);
		};
		this.saveState = function () {
			scope.target0.copy(scope.target);
			scope.position0.copy(scope.object.position);
		};
		this.reset = function () {
			scope.target.copy(scope.target0);
			scope.object.position.copy(scope.position0);
			scope.object.updateProjectionMatrix();
			scope.dispatchEvent(_changeEvent);
			scope.update();
			state = STATE.NONE;
		};
		// this method is exposed, but perhaps it would be better if we can make it private...
		this.update = function () {
			const offset = new Vector3();
			// so camera.up is the orbit axis
			const quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
			const quatInverse = quat.clone().invert();
			const twoPI = 2 * Math.PI;

			return function update() {
				const position = scope.object.position;
				offset.copy(position).sub(scope.target);
				// rotate offset to "y-axis-is-up" space
				offset.applyQuaternion(quat);
				// angle from z-axis around y-axis
				spherical.setFromVector3(offset);
				if (scope.autoRotate && state === STATE.NONE) {
					rotateLeft(getAutoRotationAngle());
				}
				if (scope.enableDamping) {
					spherical.theta += sphericalDelta.theta * scope.dampingFactor;
					spherical.phi += sphericalDelta.phi * scope.dampingFactor;
				} else {
					spherical.theta += sphericalDelta.theta;
					spherical.phi += sphericalDelta.phi;
				}
				// restrict theta to be between desired limits
				let min = scope.minAzimuthAngle;
				let max = scope.maxAzimuthAngle;

				if (isFinite(min) && isFinite(max)) {
					if (min < -Math.PI) {
						min += twoPI;
					} else if (min > Math.PI) {
						min -= twoPI;
					}
					if (max < -Math.PI) {
						max += twoPI;
					} else if (max > Math.PI) {
						max -= twoPI;
					}
					if (min <= max) {
						spherical.theta = Math.max(min, Math.min(max, spherical.theta));
					} else {
						spherical.theta = (spherical.theta > (min + max) / 2) ?
							Math.max(min, spherical.theta) :
							Math.min(max, spherical.theta);
					}
				}
				// restrict phi to be between desired limits
				spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
				spherical.makeSafe();
				offset.setFromSpherical(spherical);
				// rotate offset back to "camera-up-vector-is-up" space
				offset.applyQuaternion(quatInverse);
				position.copy(scope.target).add(offset);
				scope.object.lookAt(scope.target);

				if (scope.enableDamping === true) {
					sphericalDelta.theta *= (1 - scope.dampingFactor);
					sphericalDelta.phi *= (1 - scope.dampingFactor);
				} else {
					sphericalDelta.set(0, 0, 0);
				}
				// update condition is:
				// min(camera displacement, camera rotation in radians)^2 > EPS
				// using small-angle approximation cos(x/2) = 1 - x^2 / 8
				return false;
			};
		}();
		this.dispose = function () {
			scope.domElement.removeEventListener('contextmenu', onContextMenu);
			scope.domElement.removeEventListener('pointerdown', onPointerDown);
			scope.domElement.removeEventListener('pointercancel', onPointerUp);
			scope.domElement.removeEventListener('pointermove', onPointerMove);
			scope.domElement.removeEventListener('pointerup', onPointerUp);
			//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
		};
		//
		// internals
		//
		const scope = this;
		const STATE = {
			NONE: -1,
			ROTATE: 0,
		};
		let state = STATE.NONE;
		const EPS = 0.000001;
		// current position in spherical coordinates
		const spherical = new Spherical();
		const sphericalDelta = new Spherical();
		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();
		const pointers = [];
		const pointerPositions = {};

		function getAutoRotationAngle() {
			return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
		}

		function rotateLeft(angle) {
			sphericalDelta.theta -= angle;
		}

		function rotateUp(angle) {
			sphericalDelta.phi -= angle;
		}


		function handleMouseMoveRotate(event) {
			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
			const element = scope.domElement;
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
			rotateStart.copy(rotateEnd);
			scope.update();
		}


		function handleTouchStartRotate() {
			if (pointers.length === 1) {
				rotateStart.set(pointers[0].pageX, pointers[0].pageY);
			} else {
				const x = 0.5 * (pointers[0].pageX + pointers[1].pageX);
				const y = 0.5 * (pointers[0].pageY + pointers[1].pageY);
				rotateStart.set(x, y);
			}
		}

		function handleTouchMoveRotate(event) {
			if (pointers.length == 1) {
				rotateEnd.set(event.pageX, event.pageY);
			} else {
				const position = getSecondPointerPosition(event);
				const x = 0.5 * (event.pageX + position.x);
				const y = 0.5 * (event.pageY + position.y);
				rotateEnd.set(x, y);
			}
			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
			const element = scope.domElement;
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
			rotateStart.copy(rotateEnd);
		}

		//
		// event handlers - FSM: listen for events and reset state
		//
		function onPointerDown(event) {
			if (pointers.length === 0) {
				scope.domElement.setPointerCapture(event.pointerId);
				scope.domElement.addEventListener('pointermove', onPointerMove);
				scope.domElement.addEventListener('pointerup', onPointerUp);
			}
			//
			addPointer(event);
			if (event.pointerType === 'touch') {
				onTouchStart(event);
			} else {
				onMouseDown(event);
			}
		}

		function onPointerMove(event) {
			if (event.pointerType === 'touch') {
				onTouchMove(event);
			} else {
				onMouseMove(event);
			}
		}

		function onPointerUp(event) {
			removePointer(event);
			if (pointers.length === 0) {
				scope.domElement.releasePointerCapture(event.pointerId);
				scope.domElement.removeEventListener('pointermove', onPointerMove);
				scope.domElement.removeEventListener('pointerup', onPointerUp);
			}
			scope.dispatchEvent(_endEvent);
			state = STATE.NONE;
		}

		function onMouseDown(event) {
			rotateStart.set(event.clientX, event.clientY);
			state = STATE.ROTATE;
			scope.dispatchEvent(_startEvent);
		}

		function onMouseMove(event) {
			handleMouseMoveRotate(event);
		}

		function onTouchStart(event) {
			trackPointer(event);
			handleTouchStartRotate();
			state = STATE.TOUCH_ROTATE;
			scope.dispatchEvent(_startEvent);
		}

		function onTouchMove(event) {
			trackPointer(event);
			handleTouchMoveRotate(event);
			scope.update();
		}

		function onContextMenu(event) {
			event.preventDefault();
		}

		function addPointer(event) {
			pointers.push(event);
		}

		function removePointer(event) {
			delete pointerPositions[event.pointerId];
			for (let i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId == event.pointerId) {
					pointers.splice(i, 1);
					return;
				}
			}
		}

		function trackPointer(event) {
			let position = pointerPositions[event.pointerId];
			if (position === undefined) {
				position = new Vector2();
				pointerPositions[event.pointerId] = position;
			}
			position.set(event.pageX, event.pageY);
		}

		function getSecondPointerPosition(event) {
			const pointer = (event.pointerId === pointers[0].pointerId) ? pointers[1] : pointers[0];
			return pointerPositions[pointer.pointerId];
		}

		//
		scope.domElement.addEventListener('contextmenu', onContextMenu);
		scope.domElement.addEventListener('pointerdown', onPointerDown);
		scope.domElement.addEventListener('pointercancel', onPointerUp);
		// force an update at start
		this.update();
	}
}
