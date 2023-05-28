import {
	Quaternion,
	Mesh,
	Vector3,
	Vector2
} from 'three';

export class SpinMesh {

	/**
	 *
	 * @param {Mesh} mesh
	 * @param {Vector3} rotAxis
	 * @param {number} damping
	 * @param {number} snapping
	 * @param {number} motor
	 */
	constructor(mesh, rotAxis, motor = 0, damping = 0.0005, snapping = 0.05) {
		this.mesh = mesh;
		this.rotAxis = rotAxis;
		this.defaultOffset = new Vector3();
		this.defaultRot = mesh.quaternion.clone();

		this.rotation = 0;
		this.spin = 0;
		this.dampingFactor = damping;
		this.snappingFactor = snapping;
		this.motor = motor;
	}

	/**
	 *
	 * @param {Vector2} pointerStart
	 * @param {Vector2} pointerEnd
	 * @param {number} containerHeight
	 */
	calcDeltaRotation = function (pointerStart, pointerEnd, containerHeight) {
		let deltaPos = new Vector2();
		deltaPos.subVectors(pointerEnd, pointerStart);
		const offsetScaling = Math.max(1, this.defaultOffset.length());
		return Math.PI * deltaPos.x / containerHeight / offsetScaling;
	};

	getRotation() {
		return this.rotation;
	}

	/**
	 *
	 * @param {number }spin
	 */
	setSpin(spin) {
		this.spin = spin;
	}

	setOffset(offset) {
		this.defaultOffset = offset.clone();
	}

	/**
	 *
	 * @param {boolean} isSnapping - is object tied to mouse and follows it
	 */
	rotate(isSnapping) {
		//make rotation slower the bigger the radius
		if (isSnapping) {
			this.rotation += this.spin * this.snappingFactor;
		} else {
			this.rotation += this.motor + this.spin;
			this.spin *= (1 - this.dampingFactor);
		}

		let newRot = new Quaternion().setFromAxisAngle(this.rotAxis, this.rotation);
		newRot.multiply(this.defaultRot);
		this.mesh.setRotationFromQuaternion(newRot);

		if (this.defaultOffset.length() > 0) {
			const newOffset = this.defaultOffset.clone().applyQuaternion(new Quaternion().setFromAxisAngle(this.rotAxis, this.rotation));
			this.mesh.position.copy(newOffset)
		}
	}

	/**
	 * Adapt mesh's spin to free spinning physics after mouse release
	 */
	startFreeSpin() {
		this.spin *= this.snappingFactor;

		if (Math.sign(this.spin) !== Math.sign(this.motor)) {
			this.motor *= -1;
		}
		this.spin -= this.motor;
	}
}

export class CompositeSpinMesh {

	/**
	 *
	 * @param {SpinMesh[]} spinMeshes
	 */
	constructor(spinMeshes) {
		this.spinMeshes = spinMeshes;
		this.rotation = 0;
	}

	/**
	 *
	 * @param {Vector2} pointerStart
	 * @param {Vector2} pointerEnd
	 * @param {number} containerHeight
	 */
	calcDeltaRotation = function (pointerStart, pointerEnd, containerHeight) {
		return this.spinMeshes[0].calcDeltaRotation(pointerStart, pointerEnd, containerHeight);
	};


	setSpin(spin) {
		for (const mesh of this.spinMeshes) {
			mesh.setSpin(spin);
		}
	}

	getRotation() {
		return this.spinMeshes[0].rotation;
	}

	rotate(isSnapping) {
		for (const mesh of this.spinMeshes) {
			mesh.rotate(isSnapping);
		}
	}

	startFreeSpin() {
		for (const mesh of this.spinMeshes) {
			mesh.startFreeSpin();
		}
	}
}