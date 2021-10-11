import * as engine from '../../../scripts/rep.module.js'

class Chunk {
    constructor () {
        this.geometry = handler_chunk.geometry[ 0 ]

        this.lods = [
            new THREE.Mesh( handler_chunk.geometry[ 0 ], handler_chunk.material.wireframe ),
            new THREE.Mesh( handler_chunk.geometry[ 1 ], handler_chunk.material.wireframe ),
            new THREE.Mesh( handler_chunk.geometry[ 2 ], handler_chunk.material.wireframe )
        ]
    }
}

class Handler_Chunk {
    constructor () {
        this.size = 16

        this.geometry = [
            this.createGeometry(),
            this.createGeometry( 2 ),
            this.createGeometry( 4 )
        ]
    }

    createGeometry ( reduction = 1 ) {
        return new engine.m3d.geometry.regular.plane( this.size, this.size, this.size / reduction, this.size / reduction )
    }
}

const handler_chunk = new Handler_Chunk()

export { Chunk, handler_chunk }