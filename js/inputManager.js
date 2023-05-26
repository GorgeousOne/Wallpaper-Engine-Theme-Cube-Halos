import {
	EventDispatcher,
	Quaternion,
	Vector2,
} from 'three';

export class InputManager extends EventDispatcher {

	constructor(domElement, cube, axis, defaultRot) {
		super();
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll

		const scope = this;
		scope.domElement.addEventListener('mousemove', onMouseMove);
		scope.domElement.addEventListener('mousedown', onMouseDown);
		scope.domElement.addEventListener('mouseup', onMouseUp);

		let isDieHeld = false;
		let rotation = 0;
		let mouseRot = 0;
		let spin = 0;

		let dampingFactor = 0.005;
		let snappingFactor = 0.05;

		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();

		this.update = function () {
			return function update() {

				if (isDieHeld) {
					spin = mouseRot - rotation;
					rotation += spin * snappingFactor;

				} else {
					rotation += spin;
					spin *= (1 - dampingFactor);
				}
				let newRot = new Quaternion().setFromAxisAngle(axis, rotation);
				newRot.multiply(defaultRot);
				cube.setRotationFromQuaternion(newRot);
			}
		}();

		function rotateMouse(angle) {
			mouseRot += angle;
		}

		function onMouseMove(event) {
			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart);

			if (isDieHeld) {
				const element = scope.domElement;
				rotateMouse(2 * Math.PI * rotateDelta.x / element.clientHeight);
			}
			rotateStart.copy(rotateEnd);
		}

		function onMouseDown(event) {
			const element = scope.domElement;
			const mid = new Vector2(
				element.clientWidth / 2,
				element.clientHeight / 2);

			rotateStart.set(event.clientX, event.clientY);

			if (mid.distanceTo(rotateStart) < 0.5 * mid.y) {
				isDieHeld = true;
				mouseRot = rotation;
			}
		}

		function onMouseUp() {
			isDieHeld = false;
			const element = scope.domElement;
			spin = 2 * Math.PI * rotateDelta.x / element.clientHeight;
		}
	}
}