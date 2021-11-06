import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d from '../../../../scripts/m3d/rep.module.js'

import { Program_Module } from '../module.module.js'
import * as handler_minimap from './minimap.module.js'

class Handler_MainCamera extends Program_Module {
    constructor ( category = 'Main Camera Handler' ) {
        super( category )

        this.initialized = false
        this.castDirection = new engine.m3d.vec3( 0, -1, 0 )
        this.castFrom = new engine.m3d.vec3()
        this.elevOffset = 15
        this.helper = null
        this.minElev = 0
        this.minimapElement = null
        this.raycaster = null

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

        this.mouse = {
            coords: {
                screen: new engine.m3d.vec2(),
            },
        }
    }

    updateCameraElev () {
        const camera = program.environments.main.camera
        
        this.minimapElement = App.body.state( 'minimap-ui' )
            .qS( '#minimap' ).qS( 'vector-view' )
            .qS( '#minimap-vectors' )

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

            let intersections = this.raycaster.intersectObjects( [ program.macromap.background.paper, program.macromap.chunkMeshes ], true )

            if ( intersections.length > 0 ) {
                this.coords[ 1 ][ ix ] = new engine.m3d.vec3(
                    intersections[ 0 ].point.x,
                    intersections[ 0 ].point.y,
                    intersections[ 0 ].point.z
                )
            }
        } )

        handler_minimap.rep.update.minimap( this.coords[ 1 ] )

        // this.raycaster = new engine.m3d.ray.caster( camera.position.clone(), this.castDirection )
        // this.raycaster.firstHitOnly = true

        // this.castFrom.copy( camera.position )
        // this.castFrom.y += 1000

        // this.raycaster.set( this.castFrom, this.castDirection )

        // let intersections = this.raycaster.intersectObject( program.macromap.chunkMeshes, true )

        // if ( intersections.length > 0 ) {
        //     this.minElev = intersections[ 0 ].point.y + this.elevOffset

        //     if ( camera.position.y <= this.minElev ) camera.position.y = this.minElev
        // }
    }

    init () {
        return new Promise( resolve => {
            const camera = program.environments.main.camera

            const controls = program.environments.main.controls,
                viewAngle = engine.m3d.util.math.degToRad( 30 )
            
            controls.enableRotate = false
            controls.maxDistance = program.macromap.size.width / 1.667
            controls.maxPolarAngle = viewAngle
            controls.minPolarAngle = viewAngle

            resolve()
        } )
    }
}

const MAINCAMERAREP = new Handler_MainCamera()

export { MAINCAMERAREP, MAINCAMERAREP as rep }