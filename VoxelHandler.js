import * as THREE from 'three';

const DIVISIONS = 4;
const BRICKSIZE = Math.pow(DIVISIONS, 3);

class Brick {
    leaf;
    children = new Array(BRICKSIZE);
    constructor(leaf = false) {
        this.leaf = leaf;
        this.present = BigInt(0);
    }

    addChild(id, brick) {
        this.present |= (BigInt(1) << BigInt(id));
        this.children[id] = brick;
        // console.log(this.present, brick);
    }
} 

export class VoxelHandler {
    #nbLoDs;
    #nbVoxels;
    #rootBrick;

    #exp = [1]; /// Math.pow(DIVISIONS, 0)

    constructor (nbLoDs) {
        this.#nbLoDs = nbLoDs;
        this.#nbVoxels = Math.pow(BRICKSIZE, nbLoDs);

        console.log(`divisions : ${DIVISIONS}`);
        console.log(`number of LoDs : ${this.#nbLoDs}`);
        console.log(`brick size : ${BRICKSIZE}`);
        console.log(`number of voxels : ${this.#nbVoxels}`);

        for(let lod = 1; lod <= nbLoDs; ++lod)
            this.#exp[lod] = this.#exp[lod - 1] * DIVISIONS; /// Math.pow(DIVISIONS, lod)

        this.#rootBrick = new Brick();
    }

    /// adds a voxel at the max lod level
    /// goes down the brick tree down to the lowest lod
    addVoxelById(vId) {
        const lod = this.#nbLoDs - 1
        let prevId = vId;
        const prevIds = []
        for(let i = lod; i > 0; --i) {
            prevId = this.previousLoDId(prevId, i)
            prevIds.push()
            // console.log(i - 1, prevId, this.IdToVoxel(prevId, i - 1))
        }
    }

    addVoxel(voxel) {
        console.log("adding voxel", voxel)
        const lod = this.#nbLoDs - 1
        console.log(lod)
        const vId = this.voxelId(voxel, lod);
        this.addVoxelById(vId);
        // console.log(lod, voxel)

        let voxels = [voxel];
        let prevVoxel = voxel;
        for(let i = lod; i > 0; --i) {
            prevVoxel = this.previousLoDVoxel(prevVoxel)
            voxels.unshift(prevVoxel)
            // console.log(i - 1, prevVoxel)
        }

        let brick = this.#rootBrick;
        let previousVoxel = {x: 0, y: 0, z:0};
        // voxels.unshift({x: 0, y: 0, z:0})
        console.log(voxels)

        

        for(let i = 0; i < this.#nbLoDs; ++i) {
            // console.log(previousVoxel);
            // console.log(voxels[i]);
            let voxel = voxels[i];
            let voxel1 = {
                x: voxel.x - previousVoxel.x * DIVISIONS,
                y: voxel.y - previousVoxel.y * DIVISIONS,
                z: voxel.z - previousVoxel.z * DIVISIONS,
            }
            let id = voxel1.x + DIVISIONS * (voxel1.y + DIVISIONS * voxel1.z)
            console.log(voxel1)
            previousVoxel = voxel;
            
            const mask = (BigInt(1) << BigInt(id))
            console.log(mask, i, brick.leaf,this.#nbLoDs - 1)
            if(brick.leaf) { /// leaf brick
                console.log("leaf", id)
                brick.present |= mask;
                console.log(brick.present)
            } else { /// node brick
                let childBrick;
                if(brick.present & mask){
                    console.log("childbrick exists", lod, id)
                    /// child brick exists
                    childBrick = brick.children[id];
                }
                else { 
                    /// create child brick
                    console.log("childbrick doesn't exists", lod, id, i == (this.#nbLoDs - 2))
                    childBrick = new Brick(i == (this.#nbLoDs - 2));
                    brick.addChild(id, childBrick);
                    brick.present |= mask;
                    console.log(childBrick)
                    childBrick.voxel = voxel1
                }
                brick = childBrick;
            }
        }

        // this.viewBricks()
    }

    previousLoDVoxel(voxel) {
        return {
            x: ~~(voxel.x / DIVISIONS), 
            y: ~~(voxel.y / DIVISIONS), 
            z: ~~(voxel.z / DIVISIONS), 
        }
    }

    nextLoDVoxel(voxel) {
        return {
            x: voxel.x * DIVISIONS, 
            y: voxel.y * DIVISIONS, 
            z: voxel.z * DIVISIONS, 
        }
    }

    previousLoDId(vId, lod) {
        const exp = this.#exp[lod + 1];
        const exp_1 = this.#exp[lod];

        const vId_1 = ~~((vId % exp) / DIVISIONS)
            + exp_1 * ~~(~~(vId / exp) % exp / DIVISIONS)
            + (exp_1 * exp_1) * ~~(~~(vId / (exp * exp)) / DIVISIONS);

        return vId_1;
    }

    nextLoDId(vId, lod) {
        const exp = this.#exp[lod + 1];
        const exp1 = this.#exp[lod + 2];

        const vId_1 = ~~((vId % exp) * DIVISIONS)
            + exp1 * ~~(~~(vId / exp) % exp * DIVISIONS)
            + (exp1 * exp1) * ~~(~~(vId / (exp * exp)) * DIVISIONS);

        return vId_1;
    }

    voxelId(voxel, lod = 0) {
        const exp = this.#exp[lod + 1];
        const vId = voxel.x + exp * voxel.y + exp * exp * voxel.z;

        return vId;
    }

    /// debug
    IdToVoxel(vId, lod) {
        let exp = Math.pow(DIVISIONS, lod + 1);
        return {
            x: vId % exp,
            y: ~~((vId / exp)) % exp,
            z: ~~(vId / (exp * exp)),
        }
    }

    viewBricks() {
        console.log(this.#rootBrick)

        let cells = [{x:0, y:0, z:0, lod: 0}];
        let bricks = [this.#rootBrick];

        for(let c = 0; c < cells.length; ++c) {
            let cell = cells[c];
            let brick = bricks[c];

            if(brick.leaf)
                continue;
            // this.grid.showCell(cell.lod, cell);

            for(let i = 0; i < 64; ++i) {
                if(brick.present & (BigInt(1) << BigInt(i))) {
                    let childCell = {
                        x: i % DIVISIONS + cell.x * DIVISIONS,
                        y: ~~(i / DIVISIONS) % DIVISIONS + cell.y * DIVISIONS,
                        z: ~~(i / (DIVISIONS * DIVISIONS)) + cell.z * DIVISIONS,
                        lod: cell.lod + 1
                    }
                    
                    cells.push(childCell)
                    bricks.push(brick.children[i])
                }
            }
        }
        console.log(bricks)
        // this.grid.update()
        
    }

    viewVoxel() {
            let cells = [{x:0, y:0, z:0, lod: 0}];
            let bricks = [this.#rootBrick];

            for(let c = 0; c < cells.length; ++c) {
                let cell = cells[c];
                let brick = bricks[c];
                // console.log(cell, brick)
                // if(brick.leaf){
                //     this.voxelViewer.showCell(cell.lod, cell);
                //     continue;
                // }

                for(let i = 0; i < 64; ++i) {
                    if(brick.present & (BigInt(1) << BigInt(i))) {
                        let childCell = {
                            x: i % DIVISIONS + cell.x * DIVISIONS,
                            y: ~~(i / DIVISIONS) % DIVISIONS + cell.y * DIVISIONS,
                            z: ~~(i / (DIVISIONS * DIVISIONS)) + cell.z * DIVISIONS,
                            lod: cell.lod + 1
                        }
                        
                        // cells.push(childCell)
                        // bricks.push(brick.children[i])

                        if(brick.leaf){
                            this.voxelViewer.showCell(childCell.lod, childCell);
                            // continue;
                        }
                        else{
                            cells.push(childCell)
                            bricks.push(brick.children[i])
                        }
                    }
                }
            }

            this.voxelViewer.update()
        
    }

    setGrid(grid) {
        this.grid = grid;
    }

    setVoxelViewer(voxelViewer) {
        this.voxelViewer = voxelViewer;
    }

    #epsilon = 0.00000001;

    #dirSigns = new THREE.Vector3();
    #moves = new THREE.Vector3();
    #invDir = new THREE.Vector3();
    #timeSteps = new THREE.Vector3();

    #initiateMarch(ray) {
          /// get ray signs for each axis
        this.#dirSigns.set(
            ray.direction.x >= 0 ? 1 : 0,
            ray.direction.y >= 0 ? 1 : 0,
            ray.direction.z >= 0 ? 1 : 0,
        );

        /// get integer displacements on each axis
        this.#moves.copy(this.#dirSigns).multiplyScalar(2).sub(new THREE.Vector3(1, 1, 1));
    
        /// inverse of the direction of the ray to avoid 
        this.#invDir.set(
            1 / ray.direction.x,
            1 / ray.direction.y,
            1 / ray.direction.z,
        );

        this.#timeSteps.set(
            1 / ray.direction.x,
            1 / ray.direction.y,
            1 / ray.direction.z,
        );
        this.#timeSteps.multiply(this.#moves)

        const {entryPoint, entry, exit} = this.#computeEntryPoint(ray);

        if(entry < exit)
            this.#stepThroughCell(new THREE.Vector3(0, 0, 0), ray, entryPoint, entry, exit, 0);
          else 
            this.grid.showCell(0);
    }

    #computeEntryPoint(ray) {
        const direction = ray.direction.clone();
        const origin = ray.origin.clone();
      
      
        const tTo0 = new THREE.Vector3(
          - origin.x / (direction.x != 0 ? direction.x : Infinity),
          - origin.y / (direction.y != 0 ? direction.y : Infinity),
          - origin.z / (direction.z != 0 ? direction.z : Infinity),
        )
      
        const tTo1 = new THREE.Vector3(
          (1 - origin.x) / (direction.x != 0 ? direction.x : 0),
          (1 - origin.y) / (direction.y != 0 ? direction.y : 0),
          (1 - origin.z) / (direction.z != 0 ? direction.z : 0),
        )
        
        const tMin = new THREE.Vector3(
          Math.max(0, this.#dirSigns.x ? tTo0.x : tTo1.x), 
          Math.max(0, this.#dirSigns.y ? tTo0.y : tTo1.y), 
          Math.max(0, this.#dirSigns.z ? tTo0.z : tTo1.z) 
        );
      
        const tMax = new THREE.Vector3(
          Math.min(Number.MAX_VALUE, this.#dirSigns.x ? tTo1.x : tTo0.x), 
          Math.min(Number.MAX_VALUE, this.#dirSigns.y ? tTo1.y : tTo0.y), 
          Math.min(Number.MAX_VALUE, this.#dirSigns.z ? tTo1.z : tTo0.z) 
        );
      
        const entry = Math.max(Math.max(tMin.x, tMin.y), tMin.z);
        const exit = Math.min(Math.min(tMax.x, tMax.y), tMax.z);
      
        const entryPoint = origin.clone().addScaledVector(direction, entry)
      
        entryPoint.clamp(new THREE.Vector3(0,0,0), new THREE.Vector3(1,1,1))
        return {entryPoint, entry, exit}
    }

    #stepThroughCell(cell, ray, entryPoint, entryT, exitT, lod = 0, globalCell = new THREE.Vector3(), brick = this.#rootBrick) {  
        if(lod >= this.#nbLoDs)
          return;
        
        // console.log(lod, brick)
        if(!brick.present){
            // console.log("empty brick");
            return;
        }
        // console.log("non empty brick", lod);


        /// rescaling time from [0,1]² -> [0,4]²
        const timeToExit = (exitT - entryT) * 4;
        
        /// entry point: [0, 1]²
        /// first point : [0, 4]²
        const firstPoint = entryPoint.clone().sub(cell).multiplyScalar(4);
      
        /// DEBUG
        const globalCellLod = globalCell.clone().multiplyScalar(4).add(cell);
        this.grid.showCell(lod, globalCellLod);
        // console.log(lod, cell, globalCellLod)
        /// 
      
        const nextBoundary = firstPoint.clone().floor().add(this.#dirSigns);
        const closestBoundary = nextBoundary.clone().sub(firstPoint).multiply(this.#invDir);


        closestBoundary.x += closestBoundary.x < this.#epsilon ? this.#timeSteps.x : 0;
        closestBoundary.y += closestBoundary.y < this.#epsilon ? this.#timeSteps.y : 0;
        closestBoundary.z += closestBoundary.z < this.#epsilon ? this.#timeSteps.z : 0;
        
        const previousStep =  closestBoundary.clone().sub(this.#timeSteps);

        let prevMove = new THREE.Vector3()
        if(Math.abs(previousStep.x) < Math.abs(previousStep.y) && Math.abs(previousStep.x) < Math.abs(previousStep.z)) {
            prevMove.x += this.#moves.x;
          }else if(Math.abs(previousStep.y) < Math.abs(previousStep.z)) {
            prevMove.y += this.#moves.y;
          }
          else {
            prevMove.z += this.#moves.z;
          }


        const voxel = firstPoint.clone().floor();
        voxel.clamp(new THREE.Vector3(0,0,0), new THREE.Vector3(3,3,3));
        let t = 0;
        let i = 0;
        const hits = new Array(10);
        const voxelHits = new Array(10);
        const moves = new Array(10);

        let traversed = BigInt(0);
        do {
          moves[i] = prevMove.clone()
          hits[i] = t;
          voxelHits[i] = voxel.clone();
          traversed |= BigInt(1) << BigInt(this.voxelId(voxel));
          if(closestBoundary.x < closestBoundary.y && closestBoundary.x < closestBoundary.z) {
            t = closestBoundary.x;
            closestBoundary.x += this.#timeSteps.x;
            voxel.x += this.#moves.x;
            prevMove.multiplyScalar(0).x += this.#moves.x;
          }else if(closestBoundary.y < closestBoundary.z) {
            t = closestBoundary.y;
            closestBoundary.y += this.#timeSteps.y;
            voxel.y += this.#moves.y;
            prevMove.multiplyScalar(0).y += this.#moves.y;
          }
          else {
            t = closestBoundary.z;
            closestBoundary.z += this.#timeSteps.z;
            voxel.z += this.#moves.z;
            prevMove.multiplyScalar(0).z += this.#moves.z;
          }
      
          ++i;
        } while(t < timeToExit - this.#epsilon && i < 10)
        hits[i] = timeToExit;
      
        // console.log("leaf:", brick.leaf)
        // console.log("traversed:", traversed)
        // console.log("non empty:", traversed & brick.present)
        if(!(traversed & brick.present))
            return
      
        for(let j = 0; j < i; ++j) {
            const vId = this.voxelId(voxelHits[j]);
            if(brick.present & (BigInt(1) << BigInt(vId))) {
                if(brick.leaf) {
                    const globalCellLod2 = globalCellLod.clone().multiplyScalar(4).add(voxelHits[j]);
                    console.log("leaf brick hit", globalCellLod2)
                    console.log(closestBoundary)
                    this.addVoxel(globalCellLod2.sub(moves[j]))
                    // this.voxelViewer.showCell(globalCellLod2)
                    return globalCellLod2;
                }

                let end = this.#stepThroughCell(
                    voxelHits[j].clone(),
                    ray,
                    firstPoint.clone().addScaledVector(ray.direction, hits[j]),
                    hits[j],
                    hits[j+1],
                    lod+1,
                    globalCellLod,
                    brick.children[vId]
                );

                if(end) 
                    return end
                // console.log(lod, end)
            }
        }
    }

    traverse(ray) {
        console.log(ray)
        this.#initiateMarch(ray);
        this.viewVoxel()
        this.voxelViewer.update()
    }
}