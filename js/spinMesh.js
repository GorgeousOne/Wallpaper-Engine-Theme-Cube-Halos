import {
	EventDispatcher,
	Quaternion,
	Mesh,
	Vector3
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
	constructor(mesh, rotAxis,  motor=0, damping=0.005, snapping=0.05) {
		this.mesh = mesh;
		this.rotAxis = rotAxis;
		this.defaultRot = mesh.quaternion.clone();

		this.rotation = 0;
		this.spin = 0;
		this.dampingFactor = damping;
		this.snappingFactor = snapping;
		this.motor = motor;
	}

	/**
	 *
	 * @param {number }spin
	 */
	setSpin(spin) {
		this.spin = spin;
	}

	/**
	 *
	 * @param {boolean} isSnapping - is object tied to mouse and follows it
	 */
	rotate(isSnapping) {
		if (isSnapping) {
			this.rotation += this.spin * this.snappingFactor;
		} else {
			this.rotation += this.motor + this.spin;
			this.spin *= (1 - this.dampingFactor);
		}

		let newRot = new Quaternion().setFromAxisAngle(this.rotAxis, this.rotation);
		newRot.multiply(this.defaultRot);
		this.mesh.setRotationFromQuaternion(newRot);
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