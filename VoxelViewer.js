import * as THREE from 'three';

const DIVS = 4;
const SIZE = 4;

export class VoxelViewer {
	#totalCellNb;
	#nbLoDs;
	#mesh;
	#scene;
	#lodOffsets = [];
	#instanceMatrix;
	#visibleCells = [];
    // #voxelOffset = 
	
	constructor(nbLoDs = 1) {
		this.#nbLoDs = nbLoDs;
		this.#totalCellNb = Math.pow(Math.pow(DIVS, 3), nbLoDs );
		// console.log("total cells", this.#totalCellNb)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        for(let i = 0; i < 72; ++i) {
            geometry.attributes.position.array[i] += 0.5
        }
        const material = new THREE.MeshStandardMaterial( {color: 0x00aaff} );

        this.#mesh = new THREE.InstancedMesh(geometry, material, this.#totalCellNb);

		const matrix = new THREE.Matrix4();
		const position = new THREE.Vector3();
   		const rotation = new THREE.Quaternion()
        const size = SIZE / Math.pow(4, nbLoDs);
        const scale = new THREE.Vector3(size, size, size);
		for(let i = 0; i < this.#totalCellNb; ++i) {
			matrix.compose(position, rotation, scale);
			// matrix.toArray(this.#instanceMatrix, i*16);
            this.#mesh.setMatrixAt(i, matrix)
		}

		this.#mesh.instanceMatrix.needsUpdate = true
	}

	addTo(scene) {
		this.#scene = scene;
		this.#scene.add(this.#mesh);
	}

	remove() {
		this.#scene.remove(this.#mesh);
	}

	#voxelId(cell, lod) {
		return cell.x + Math.pow(4, lod+1) * cell.y + Math.pow(Math.pow(4, lod+1), 2) * cell.z;
	}

	showCell(lod = 0, cell = new THREE.Vector3(0, 0, 0)) {
		const id = this.#voxelId(cell, lod);
		// console.log(id, cell)
   		const rotation = new THREE.Quaternion();

		const size = SIZE / Math.pow(4, lod);
		const size1 = SIZE / Math.pow(4, lod + 1);
		const scale = new THREE.Vector3(size, size, size);

		const position = new THREE.Vector3(
			cell.x * size,
			cell.y * size,
			cell.z * size
		);

		const matId = this.#visibleCells.length;
		this.#visibleCells.push(id);

		const matrix = new THREE.Matrix4();
		matrix.compose(position, rotation, scale);
        
        // console.log(id, matrix)
        this.#mesh.setMatrixAt(matId, matrix)

		this.#mesh.instanceMatrix.needsUpdate = true
	}

	update() {
		this.#mesh.instanceMatrix.needsUpdate = true
		this.#mesh.count = this.#visibleCells.length;
		// console.log(this.#visibleCells.length)
	}

	hideCell( cell = new THREE.Vector3(0, 0, 0)) {
		// const offset = this.#lodOffsets[lod];
		// const id = this.#voxelId(cell, lod);
		// const matrix = new THREE.Matrix4().multiplyScalar(0);
        // this.#mesh.setMatrixAt(i, matrix)
		

		// this.#mesh.instanceMatrix.needsUpdate = true
	}

	reset() {
		const matrix = new THREE.Matrix4().multiplyScalar(0);
		this.#visibleCells.length = 0;
		for(let i = 0; i < this.#totalCellNb; ++i) {
			matrix.toArray(this.#instanceMatrix, i*16);
		}
	}
}