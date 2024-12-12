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
        console.log(this.present, brick);
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
            console.log(i - 1, prevId, this.IdToVoxel(prevId, i - 1))
        }
    }

    addVoxel(voxel) {
        const lod = this.#nbLoDs - 1
        const vId = this.voxelId(voxel, lod);
        this.addVoxelById(vId);
        console.log(lod, voxel)

        let voxels = [voxel];
        let prevVoxel = voxel;
        for(let i = lod; i > 0; --i) {
            prevVoxel = this.previousLoDVoxel(prevVoxel)
            voxels.unshift(prevVoxel)
            console.log(i - 1, prevVoxel)
        }

        let brick = this.#rootBrick;
        let previousVoxel = {x: 0, y: 0, z:0};

        for(let i = 0; i < this.#nbLoDs; ++i) {
            console.log(previousVoxel);
            console.log(voxels[i]);
            let voxel = voxels[i];
            let voxel1 = {
                x: voxel.x - previousVoxel.x * DIVISIONS,
                y: voxel.y - previousVoxel.y * DIVISIONS,
                z: voxel.z - previousVoxel.z * DIVISIONS,
            }
            console.log(voxel1)
            // let voxel1 = {x: voxel.x * DIVISIONS, y: voxel.y * DIVISIONS, z: voxel.z * DIVISIONS}
            let id = voxel1.x + DIVISIONS * (voxel1.y + DIVISIONS * voxel1.z)

            previousVoxel = voxel;
            console.log(id);
            console.log(brick.present & (BigInt(1) << BigInt(id)))
            /// existing node
            // if(brick.present & (1 << id)){
            //     console.log(brick)

            // }
            // /// no existing node
            // else {
            //     /// if leaf, add value to present
            //    if(brick.leaf){

            //    }
            //    /// if node, search or add next brick
            //    else {

            //    }
            // }
            const mask = (BigInt(1) << BigInt(id))
            if(brick.leaf) { /// leaf brick
                console.log("leaf brick", brick)
                brick.present |= mask;
            } else { /// node brick
                console.log("node brick", brick)
                let childBrick;
                if(brick.present & mask){
                    /// child brick exists
                    console.log(brick)
                    childBrick = brick.children[id];
                }
                else { 
                    /// create child brick
                    console.log("creating brick")
                    console.log("leaf:", i, i == (this.#nbLoDs - 1))
                    childBrick = new Brick(i == (this.#nbLoDs - 1));
                    // brick.present |= mask;
                    brick.addChild(id, childBrick);
                }
                brick = childBrick
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

    viewBricks(grid) {
        console.log(this.#rootBrick)

        if(grid) {
            let cells = [{x:0, y:0, z:0, lod: 0}];
            let bricks = [this.#rootBrick];

            let cell = {x:0, y:0, z:0};
            // let lod = 0;
            let brick = this.#rootBrick;

            for(let c = 0; c < cells.length; ++c) {
                let cell = cells[c];
                let brick = bricks[c];

                if(brick.leaf)
                    continue;
                grid.showCell(cell.lod, cell);

                for(let i = 0; i < 64; ++i) {
                    if(brick.present & (BigInt(1) << BigInt(i))) {
                        console.log("present", i)
                        let childCell = {
                            x: i % DIVISIONS + cell.x * DIVISIONS,
                            y: ~~(i / DIVISIONS) % DIVISIONS + cell.y * DIVISIONS,
                            z: ~~(i / (DIVISIONS * DIVISIONS)) + cell.z * DIVISIONS,
                            lod: cell.lod + 1
                        }
                        
                        console.log("child", childCell, childCell.lod)
                        cells.push(childCell)
                        bricks.push(brick.children[i])
                    }
                }
            }

            grid.update()
        }
        
    }

    viewVoxel(voxelViewer) {
            let cells = [{x:0, y:0, z:0, lod: 0}];
            let bricks = [this.#rootBrick];

            let cell = {x:0, y:0, z:0};
            // let lod = 0;
            let brick = this.#rootBrick;

            for(let c = 0; c < cells.length; ++c) {
                let cell = cells[c];
                let brick = bricks[c];
                // grid.showCell(cell.lod, cell);

                if(brick.leaf){
                    console.log("leaf brick")
                    voxelViewer.showCell(cell.lod, cell);
                    continue;
                }

                for(let i = 0; i < 64; ++i) {
                    if(brick.present & (BigInt(1) << BigInt(i))) {
                        console.log("present", i)
                        let childCell = {
                            x: i % DIVISIONS + cell.x * DIVISIONS,
                            y: ~~(i / DIVISIONS) % DIVISIONS + cell.y * DIVISIONS,
                            z: ~~(i / (DIVISIONS * DIVISIONS)) + cell.z * DIVISIONS,
                            lod: cell.lod + 1
                        }
                        
                        console.log("child", childCell, childCell.lod)
                        cells.push(childCell)
                        bricks.push(brick.children[i])
                    }
                }
            }

            voxelViewer.update()
        
    }
}