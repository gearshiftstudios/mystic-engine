import * as engine from '../../mystic.module.js'

class Minimap {
    constructor ( container, scene, boundsWidth, boundsHeight, boundsDepth ) {
        const scope = this

        this.params = {
            container: container,
            scene: scene,

            bounds: {
                depth: boundsDepth,
                height: boundsHeight,
                width: boundsWidth,
            },
        }

        this.initialized = false
        this.camera = new engine.m3d.camera.flat( 0, 0, 0, 0 )
        this.viewport = container

        this.renderers = { 
            webgl: new engine.m3d.renderer.webgl(), 
            css: null 
        }

        this.update = {
            all: function () {
                return new Promise( resolve => {
                    this.render().then( () => {
                        this.projection().then( () => {
                            this.pixels().then( () => {
                                resolve()
                            } )
                        } )
                    } )
                } )
            },
            render: () => {
                return new Promise( resolve => {
                    this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
                    this.renderers.webgl.setSize( this.viewport.offsetWidth, this.viewport.offsetHeight )

                    resolve()
                } )
            },
            pixels: () => {
                return new Promise( resolve => {
                    this.renderers.webgl.render(
                        this.params.scene,
                        this.camera
                    )

                    resolve()
                } )
            },
            projection: () => {
                return new Promise( resolve => {
                    this.camera = new engine.m3d.camera.flat(
                        this.params.bounds.width / -2,
                        this.params.bounds.width / 2,
                        this.params.bounds.height / 2,
                        this.params.bounds.height / -2,
                        -this.params.bounds.depth,
                        this.params.bounds.depth
                    )

                    this.camera.lookAt( new engine.m3d.vec3( 0, -1, 0 ) )
                    this.camera.updateProjectionMatrix()

                    resolve()
                } )
            },
            minimap: ( points ) => {
                const cameraView = App.body.state( 'minimap-ui' )
                    .qS( '#minimap' ).qS( 'vector-view' )
                    .qS( '#minimap-vectors' ).qS( '#camera-view' )

                const bounds = this.viewport.getBoundingClientRect()

                const msw = this.params.bounds.width,
                    msh = this.params.bounds.height,
                    intx = bounds.width / msw,
                    inty = bounds.height / msh,
                    bx = -msw / 2,
                    by = -msh / 2

                const newPoints = new Array(
                    { x: 0, y: 0, string: '' },
                    { x: 0, y: 0, string: '' },
                    { x: 0, y: 0, string: '' },
                    { x: 0, y: 0, string: '' }
                )
                
                points.forEach( ( p, ix ) => {
                    if ( p.x < 0 || p.x > 0 ) newPoints[ ix ].x = ( ( msw / 2 ) + p.x ) * intx
                    if ( p.x == 0 ) newPoints[ ix ].x = ( msw / 2 ) * intx
                    if ( p.z < 0 || p.z > 0 ) newPoints[ ix ].y = ( ( msh / 2 ) + p.z ) * inty
                    if ( p.z == 0 ) newPoints[ ix ].y = ( msh / 2 ) * inty

                    newPoints[ ix ].string = `${ newPoints[ ix ].x },${ newPoints[ ix ].y }`
                } )

                cameraView.setAttribute( 'points', `${ newPoints[ 0 ].string } ${ newPoints[ 1 ].string } ${ newPoints[ 3 ].string } ${ newPoints[ 2 ].string }` )
            },
        }
    }

    generate () {
        return new Promise( resolve => {
            this.update.all().then( () => {
                program.environments.main.scene.add( this.camera )

                this.renderers.webgl.outputEncoding = engine.m3d.encoding.gamma
                this.renderers.webgl.gammaFactor = 2.2
                this.renderers.webgl.shadowMap.enabled = false
                this.renderers.webgl.domElement.style.pointerEvents = 'auto'

                this.viewport.appendChild( this.renderers.webgl.domElement )

                this.init()

                resolve()
            } )
        } )
    }

    init () {
        return new Promise( resolve => {
            const scope = this

            // this.viewport.onclick = function ( e ) {
            //     const bounds = this.getBoundingClientRect()

            //     const wx = e.clientX - bounds.left,
            //         wy = e.clientY - bounds.top

            //     const msw = scope.params.bounds.width,
            //         msh = scope.params.bounds.height,
            //         intx = msw / bounds.width,
            //         inty = msh / bounds.height,
            //         bx = -msw / 2,
            //         by = -msh / 2

            //     scope.moveTo(
            //         bx + ( wx * intx ),
            //         by + ( wy * inty ),
            //     )
            // }

            this.initialized = true

            resolve()
        } )
    }

    // moveTo ( x, z ) {
    //     program.environments.main.controls.panTo( x, z )
    // }
}

export { Minimap }