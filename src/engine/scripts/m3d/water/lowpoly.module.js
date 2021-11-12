import * as engine from '../../mystic.module.js'

const defaults = {
    animation: 'fade',
    color: 0x255e6b,
    existingFloor: false,
    opacity: 1,
    size: 10,
    shiny: true,
}

const dummy = new engine.m3d.object3D()

let instancedMesh = null

class Water_LowPoly {
    constructor (
        width = defaults.size,
        height = defaults.size,
        widthSegments = width * 2,
        heightSegments = height * 2,

        options = {
            animation: defaults.animation,
            color: defaults.color,
            existingFloor: defaults.existingFloor,
            opacity: defaults.opacity,
            shiny: defaults.shiny,
        }
    ) {
        this.initialzied = false

        this.params = {
            height: height,
            heightSegments: heightSegments,
            width: width,
            widthSegments: widthSegments,

            options: {
                animation: options.animation ? options.animation : defaults.animation,
                color: options.color ? options.color : defaults.color,
                existingFloor: options.existingFloor ? options.existingFloor : defaults.existingFloor,
                opacity: options.opacity ? options.opacity : defaults.opacity,
                shiny: options.shiny ? options.shiny : defaults.shiny,
            }
        }

        this.meshMaterial = this.params.options.shiny ? 'phong' : 'standard'
        this.iCount = 0
        this.posCount = 0
        this.waveCount = 0

        this.meshGeometry = new Array(
            this.params.width,
            this.params.height,
            this.params.widthSegments,
            this.params.heightSegments
        )

        this.meshParams = { 
            color: this.params.options.color,
            flatShading: true, 
            opacity: this.params.options.opacity,
            transparent: true,
        }

        const setMeshProperties = f => {
            // this.forms[ f ].initPositions = new Array( ...geometry[ f ].attributes.position.array )
            this.forms[ f ].receiveShadow = true
            this.forms[ f ].rotation.x = engine.m3d.util.math.degToRad( -90 )
            this.forms[ f ].position.y = 0.1
        }

        switch ( this.params.options.animation ) {
            case 'fade':
                this.forms = new Array(
                    new engine.m3d.mesh.default(
                        new engine.m3d.geometry.buffer.plane( ...this.meshGeometry ),
                        new engine.m3d.mat.mesh[ this.meshMaterial ]( this.meshParams )
                    ),
                    new engine.m3d.mesh.default(
                        new engine.m3d.geometry.buffer.plane( ...this.meshGeometry ),
                        new engine.m3d.mat.mesh[ this.meshMaterial ]( this.meshParams )
                    )
                )

                setMeshProperties( 0 )
                setMeshProperties( 1 )

                break
            case 'waves':
                this.forms = new Array(
                    new engine.m3d.mesh.default(
                        new engine.m3d.geometry.buffer.plane( ...this.meshGeometry ),
                        new engine.m3d.mat.mesh[ this.meshMaterial ]( this.meshParams )
                    )
                )

                setMeshProperties( 0 )

                break
        }
    }

    init ( object ) {
        return new Promise( resolve => {
            switch ( this.params.options.animation ) {
                case 'fade':
                    let fadeWorker = new Worker( '../../scripts/m3d/water/workers/lowpoly-fade.worker.module.js' )

                    if ( object ) {
                        object.add( this.forms[ 0 ] )
                        object.add( this.forms[ 1 ] )
                    }

                    fadeWorker.postMessage( [ 
                        this.forms[ 0 ].geometry.attributes.position.array,
                        this.forms[ 1 ].geometry.attributes.position.array,
                        this.params.widthSegments,
                        this.params.heightSegments
                    ] )

                    fadeWorker.onmessage = e => {
                        this.forms[ 0 ].geometry.attributes.position.array = e.data[ 0 ]
                        this.forms[ 1 ].geometry.attributes.position.array = e.data[ 1 ]

                        this.forms[ 0 ].geometry.attributes.position.needsUpdate = true
                        this.forms[ 1 ].geometry.attributes.position.needsUpdate = true

                        this.initialzied = true

                        resolve()
                    }

                    break
                case 'waves':
                    const wavesWorker = new Worker( '../../scripts/m3d/water/workers/lowpoly-waves.worker.module.js' )

                    if ( object ) object.add( this.forms[ 0 ] )

                    wavesWorker.postMessage( [ 
                        this.forms[ 0 ].geometry.attributes.position.array,
                        this.params.widthSegments,
                        this.params.heightSegments
                    ] )

                    wavesWorker.onmessage = e => {
                        this.forms[ 0 ].zGeo = e.data[ 0 ]

                        this.initialzied = true

                        resolve()
                    }

                    break
            }
        } )
    }

    update () {
        switch ( this.params.options.animation ) {
            case 'fade':
                this.forms[ 0 ].material.opacity = this.params.options.opacity + Math.sin( new Date().getTime() * 0.0025 )
                this.forms[ 1 ].material.opacity = this.params.options.opacity - Math.sin( new Date().getTime() * 0.0025 )

                break
            case 'waves':
                this.posCount = 0

                for ( let i = 0; i < this.forms[ 0 ].geometry.attributes.position.array.length; i++ ) {
                    if ( this.forms[ 0 ].zGeo[ i ] != null ) {
                        if ( this.posCount == 0 ) {
                            this.forms[ 0 ].geometry.attributes.position.array[ i ] = this.forms[ 0 ].zGeo[ i ] + Math.sin( new Date().getTime() * 0.0004 ) * 0.1
                        } else if ( this.posCount == 1 ) {
                            this.forms[ 0 ].geometry.attributes.position.array[ i ] = this.forms[ 0 ].zGeo[ i ] - Math.sin( new Date().getTime() * 0.0004 ) * 0.1
                        } else if ( this.posCount == 2 ) {
                            this.forms[ 0 ].geometry.attributes.position.array[ i ] = Math.sin( ( ( i / 3 ) + this.waveCount * 0.0003 ) ) 
                                * ( this.forms[ 0 ].zGeo[ i ] - ( this.forms[ 0 ].zGeo[ i ] * 0.6 ) )
                        }

                        this.posCount++
                        this.waveCount += 0.1

                        if ( this.posCount == 3 ) this.posCount = 0
                    }
                }

                this.forms[ 0 ].geometry.attributes.position.needsUpdate = true

                break
        }
    }
}

function generateWaveChunks ( width = 200, height = 200, chunkSize = 10, chunkDetail = chunkSize * 2 ) {
    const water = new Water_LowPoly( chunkSize, chunkSize, chunkDetail, chunkDetail, { animation: 'waves' } )

    water.init().then( () => {
        const geometry = water.forms[ 0 ].geometry
        const material = water.forms[ 0 ].material
    
        instancedMesh = new engine.m3d.mesh.instanced( geometry, material, ( width / chunkSize ) * ( height / chunkSize ) )

        for ( let i = 0; i < instancedMesh.count; i++ ) {
            dummy.position.set( 0, 0, 0 )
            dummy.rotation.x = engine.m3d.util.math.degToRad( -90 ) 

            dummy.castShadow = false
            dummy.receiveShadow = true

            dummy.updateMatrix()

            instancedMesh.setMatrixAt( i, dummy.matrix )

            instancedMesh.instanceMatrix.needsUpdate = true
        }

        program.environments.main.scene.add( instancedMesh )
    } )
}

function updateWaveChunks () {
    if ( instancedMesh != null ) {
        for ( let i = 0; i < instancedMesh.count; i++ ) {
            dummy.position.set( 0, 0, 0 )
            dummy.rotation.x = engine.m3d.util.math.degToRad( -90 ) 

            dummy.castShadow = false
            dummy.receiveShadow = true

            dummy.updateMatrix()

            instancedMesh.setMatrixAt( i, dummy.matrix )

            instancedMesh.instanceMatrix.needsUpdate = true
        }
    }
}

export { Water_LowPoly, generateWaveChunks }