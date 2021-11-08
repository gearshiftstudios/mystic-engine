import * as engine from '../../mystic.module.js'

const defaults = {
    animation: 'fade',
    color: 0x255e6b,
    existingFloor: false,
    opacity: 0.7,
    size: 10,
    shiny: true,
}

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

        switch ( this.params.options.animation ) {
            case 'fade':
                const geometry = new Array(
                    new engine.m3d.geometry.buffer.plane( 
                        this.params.width,
                        this.params.height,
                        this.params.widthSegments,
                        this.params.heightSegments,
                    ),
                    new engine.m3d.geometry.buffer.plane( 
                        this.params.width,
                        this.params.height,
                        this.params.widthSegments,
                        this.params.heightSegments,
                    )
                )

                this.forms = new Array(
                    new engine.m3d.mesh.default(
                        geometry[ 0 ],
                        new engine.m3d.mat.mesh[ this.meshMaterial ]( { 
                            color: this.params.options.color,
                            flatShading: true, 
                            opacity: this.params.options.opacity,
                            transparent: true,
                        } )
                    ),
                    new engine.m3d.mesh.default(
                        geometry[ 1 ],
                        new engine.m3d.mat.mesh[ this.meshMaterial ]( { 
                            color: this.params.options.color,
                            flatShading: true, 
                            opacity: this.params.options.opacity,
                            transparent: true,
                        } )
                    )
                )

                this.forms[ 0 ].initPositions = new Array( ...geometry[ 0 ].attributes.position.array )
                this.forms[ 0 ].receiveShadow = true
                this.forms[ 0 ].rotation.x = engine.m3d.util.math.degToRad( -90 )
                this.forms[ 0 ].position.y = 0.1

                this.forms[ 1 ].initPositions = new Array( ...geometry[ 1 ].attributes.position.array )
                this.forms[ 1 ].receiveShadow = true
                this.forms[ 1 ].rotation.x = engine.m3d.util.math.degToRad( -90 )
                this.forms[ 1 ].position.y = 0.1

                break
        }
    }

    init ( object ) {
        return new Promise( resolve => {
            if ( object ) {
                object.add( this.forms[ 0 ] )
                object.add( this.forms[ 1 ] )
            }

            const worker = new Worker( '../../scripts/m3d/water/workers/lowpoly.worker.module.js' )

            worker.postMessage( [ 
                this.forms[ 0 ].geometry.attributes.position.array,
                this.forms[ 1 ].geometry.attributes.position.array,
                this.params.widthSegments,
                this.params.heightSegments
            ] )

            worker.onmessage = e => {
                this.forms[ 0 ].geometry.attributes.position.array = e.data[ 0 ]
                this.forms[ 1 ].geometry.attributes.position.array = e.data[ 1 ]

                this.forms[ 0 ].geometry.attributes.position.needsUpdate = true
                this.forms[ 1 ].geometry.attributes.position.needsUpdate = true

                this.initialzied = true

                resolve()
            }
        } )
    }

    update () {
        switch ( this.params.options.animation ) {
            case 'fade':
                this.forms[ 0 ].material.opacity = this.params.options.opacity + Math.sin( new Date().getTime() * 0.0025 )
                this.forms[ 1 ].material.opacity = this.params.options.opacity - Math.sin( new Date().getTime() * 0.0025 )

                break
        }
    }
}

export { Water_LowPoly }