import * as engine from '../../../../scripts/rep.module.js'
import * as m3d from '../../../../scripts/m3d/rep.module.js'

import { Program_Module } from '../module.module.js'

class Handler_MainCamera extends Program_Module {
    constructor ( category = 'Main Camera Handler' ) {
        super( category )

        this.initialized = false
        this.castDirection = new engine.m3d.vec3( 0, -1, 0 )
        this.castFrom = new engine.m3d.vec3()
        this.elevOffset = 15
        this.helper = null
        this.minElev = 0
    }

    updateCameraElev () {
        const camera = program.environments.main.camera

        const raycaster = new engine.m3d.ray.caster( camera.position.clone(), this.castDirection )
        raycaster.firstHitOnly = true

        this.castFrom.copy( camera.position )
        this.castFrom.y += 1000

        raycaster.set( this.castFrom, this.castDirection )

        var intersections = raycaster.intersectObject( program.macromap.mesh )

        if ( intersections.length > 0 ) {
            this.minElev = intersections[ 0 ].point.y + this.elevOffset

            if ( camera.position.y <= this.minElev ) camera.position.y = this.minElev
        }
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