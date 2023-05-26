import {
	EventDispatcher,
	Quaternion,
	Vector2,
} from 'three';

import {SpinMesh} from "./spinMesh";


export class InputManager extends EventDispatcher {

	constructor(domElement) {
		super();
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll

		this.spinMeshes = [];

		const scope = this;
		scope.domElement.addEventListener('mousemove', onMouseMove);
		scope.domElement.addEventListener('mousedown', onMouseDown);
		scope.domElement.addEventListener('mouseup', onMouseUp);

		let isDieHeld = false;
		let mouseRot = 0;

		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();

		this.update = function () {
			return function update() {
				let die = this.spinMeshes[0];

				if (isDieHeld) {
					die.setSpin(mouseRot - die.rotation);
				}
				die.rotate(isDieHeld);
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
				mouseRot = scope.spinMeshes[0].rotation;
			}
		}

		function onMouseUp() {
			if (!isDieHeld) {
				return;
			}
			isDieHeld = false;
			const element = scope.domElement;
			//set cube speed to whatever it snapped last
			scope.spinMeshes[0].spin *= scope.spinMeshes[0].snappingFactor;
		}
	}

	/**
	 *
	 * @param {SpinMesh} spinMesh
	 */
	addSpinMesh(spinMesh) {
		this.spinMeshes.push(spinMesh)
	}
}