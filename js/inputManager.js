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

		let draggedMesh;
		let mouseRot = 0;

		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();

		this.update = function () {
			return function update() {
				for (const mesh of this.spinMeshes) {
					const isDragged = mesh === draggedMesh;

					if (isDragged) {
						mesh.setSpin(mouseRot - mesh.getRotation());
					}
					mesh.rotate(isDragged);
				}
			}
		}();

		function rotateMouse(angle) {
			mouseRot += angle;
		}

		function onMouseMove(event) {
			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart);

			if (draggedMesh !== null) {
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
			const radius = mid.distanceTo(rotateStart) / mid.y;

			if (radius < 0.35) {
				draggedMesh = scope.spinMeshes[0];
			} else if (radius < .65) {
				draggedMesh = scope.spinMeshes[1];
			} else {
				draggedMesh = scope.spinMeshes[2];
			}
			mouseRot = draggedMesh.getRotation();
		}

		function onMouseUp() {
			if (draggedMesh === null) {
				return;
			}
			draggedMesh.startFreeSpin();
			draggedMesh = null;
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