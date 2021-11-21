import * as engine from '../../mystic.module.js'

class Minimap {
    constructor( container, planetsList, boundsWidth, boundsHeight, boundsDepth, padding ) {
        const scope = this
        
        this.params = {
            container: container,
            padding: padding,
            planetsList: planetsList,

            bounds: {
                depth: boundsDepth,
                width: boundsWidth,
                height: boundsHeight,
            }
        }

        this.bounds = this.params.container.getBoundingClientRect()
        this.bx = ( this.params.bounds.width + ( this.params.padding * 2 ) ) / 2
        this.by = ( this.params.bounds.height + ( this.params.padding * 2 ) ) / 2
        this.bz = this.params.bounds.depth / 2
        this.container = container
        this.initialized = false
        this.intx = this.bounds.width / ( this.params.bounds.width + ( this.params.padding * 2 ) )
        this.inty = this.bounds.height / ( this.params.bounds.height + ( this.params.padding * 2 ) )
        this.planetDOM = new Array()
        this.raycaster = new engine.m3d.ray.caster()
        this.raycaster.firstHitOnly = true

        this.coords = [ 
            new Array(
                new engine.m3d.vec2(),
                new engine.m3d.vec2(),
                new engine.m3d.vec2(),
                new engine.m3d.vec2()
            ),
            new Array(
                new engine.m3d.vec3(),
                new engine.m3d.vec3(),
                new engine.m3d.vec3(),
                new engine.m3d.vec3()
            ) 
        ]

        this.pDOM = class {
            constructor ( x, y, z ) {
                this.x = x
                this.y = y
                this.z = z
            }
        }
    }

    updatePositions () {
        // this.container.clear()

        console.log( this.params.padding )

        this.params.planetsList.forEach( p => {
            const position = p.group.position

            let x = 0, y = 0, z = 0

            if ( position.x == 0 ) x = ( this.bx * this.intx )
            else if ( position.x < 0 ) x = ( ( position.x + this.bx ) * this.intx )
            else if ( position.x > 0 ) x = ( ( position.x + this.bx ) * this.intx )

            if ( position.z == 0 ) y = ( this.by * this.inty )
            else if ( position.z < 0 ) y = ( ( position.z + this.by ) * this.inty )
            else if ( position.z > 0 ) y = ( ( position.z + this.by ) * this.inty )

            if ( position.y == 0 ) z = this.bz
            else if ( position.y < 0 || position.z > 0 ) z = position.y + this.bz

            this.container.render( `
                <map-planet style='margin-left: ${ x }px; 
                    margin-top: ${ y }px; 
                    transform: translate( -50%, -50% );
                    z-index: ${ Math.round( z ) };
                '>
                </map-planet>
            ` )

            this.planetDOM.push( new this.pDOM( x, y, z ) )
        } )
    }

    updateVectors ( camera, ...objects ) {
        const cameraView = this.container.qS( 'vector-view' )
            .qS( '#minimap-vectors' ).qS( '#camera-view' )

        /* lt */
        this.coords[ 0 ][ 0 ].x = ( 0 / window.innerWidth ) * 2 - 1
	    this.coords[ 0 ][ 0 ].y = - ( 0 / window.innerHeight ) * 2 + 1

        /* rt */
        this.coords[ 0 ][ 1 ].x = ( window.innerWidth / window.innerWidth ) * 2 - 1
	    this.coords[ 0 ][ 1 ].y = - ( 0 / window.innerHeight ) * 2 + 1

        /* lb */
        this.coords[ 0 ][ 2 ].x = ( 0 / window.innerWidth ) * 2 - 1
	    this.coords[ 0 ][ 2 ].y = - ( window.innerHeight / window.innerHeight ) * 2 + 1

        /* rb */
        this.coords[ 0 ][ 3 ].x = ( window.innerWidth / window.innerWidth ) * 2 - 1
	    this.coords[ 0 ][ 3 ].y = - ( window.innerHeight / window.innerHeight ) * 2 + 1

        this.raycaster = new engine.m3d.ray.caster()
        this.raycaster.firstHitOnly = true

        this.coords[ 0 ].forEach( ( c, ix ) => {
            this.raycaster.setFromCamera( c, camera )

            let intersections = this.raycaster.intersectObjects( [ ...objects ], true )

            if ( intersections.length > 0 ) {
                this.coords[ 1 ][ ix ] = new engine.m3d.vec3(
                    -intersections[ 0 ].point.x,
                    intersections[ 0 ].point.y,
                    -intersections[ 0 ].point.z
                )
            }
        } )

        const newPoints = new Array(
            { x: 0, y: 0, string: '' },
            { x: 0, y: 0, string: '' },
            { x: 0, y: 0, string: '' },
            { x: 0, y: 0, string: '' }
        )
                
        this.coords[ 1 ].forEach( ( p, ix ) => {
            if ( p.x < 0 || p.x > 0 ) newPoints[ ix ].x = ( this.bx + p.x ) * this.intx
            if ( p.x == 0 ) newPoints[ ix ].x = this.bx * this.intx
            if ( p.z < 0 || p.z > 0 ) newPoints[ ix ].y = ( this.by + p.z ) * this.inty
            if ( p.z == 0 ) newPoints[ ix ].y = this.by * this.inty

            // if ( newPoints[ ix ].x >= camera.far ) newPoints[ ix ].x = camera.far
            // if ( newPoints[ ix ].x <= -camera.far ) newPoints[ ix ].x = -camera.far
            // if ( newPoints[ ix ].y >= camera.far ) newPoints[ ix ].y = camera.far
            // if ( newPoints[ ix ].y <= -camera.far ) newPoints[ ix ].y = -camera.far

            newPoints[ ix ].string = `${ newPoints[ ix ].x },${ newPoints[ ix ].y }`
        } )

        cameraView.setAttribute( 'points', `${ newPoints[ 0 ].string } ${ newPoints[ 1 ].string } ${ newPoints[ 3 ].string } ${ newPoints[ 2 ].string }` )
    }

    init ( object3d ) {
        return new Promise( resolve => {
            this.container.style.backgroundColor = `#00161f`

            this.container.render( `
                <vector-view style='
                    position: absolute;
                    left: 0;
                    top: 0;
        
                    width: 100%;
                    height: 100%;
        
                    margin: 0;
        
                    pointer-events: none;
        
                    z-index: 999999999;
                '>
                    <svg id='minimap-vectors' width='100%' height='100%'>
                        <polygon id='camera-view' points="100,100 150,25 150,75 200,0"
                        fill="none" stroke="white" />
                    </svg>
                </vector-view> 
            ` )

            this.updatePositions()

            this.viewPlane = new engine.m3d.mesh.default(
                new engine.m3d.geometry.buffer.box(
                    this.params.bounds.width + ( this.params.padding * 2 ),
                    this.params.bounds.height + ( this.params.padding * 2 ),
                    this.params.bounds.depth + ( this.params.padding * 2 )
                ),
                new engine.m3d.mat.mesh.phong( {
                    opacity: 0,
                    side: engine.m3d.backSide,
                    transparent: true,
                } )
            )

            // this.viewPlane.position.y = -this.params.bounds.depth

            object3d.add( this.viewPlane )

            this.initialized = true

            resolve()
        } )
    }
}

export { Minimap }