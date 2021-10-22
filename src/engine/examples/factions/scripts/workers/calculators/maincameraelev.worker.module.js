import * as engine from '../../../../../scripts/rep.module.js'
import { MAPGROUP } from '../../handlers/macromap.module.js'

let castDirection = new engine.m3d.vec3( 0, -1, 0 )
let castFrom = new engine.m3d.vec3()

self.onmessage = e => {
    self.postMessage( [ 11 ] )

    console.log( 'yo' )

    const camPos = new engine.m3d.vec3( e.data[ 0 ], e.data[ 1 ], e.data[ 2 ] )

    const raycaster = new engine.m3d.ray.caster( camPos.clone(), castDirection )
    raycaster.firstHitOnly = true

    castFrom.copy( camPos )
    castFrom.y += 1000

    raycaster.set( castFrom, castDirection )

    var intersections = raycaster.intersectObjects( [ MAPGROUP.mesh ] )

    // if ( intersections.length > 0 ) {
    //     self.postMessage( [ intersections[ 0 ].point.y + e.data[ 3 ] ] )
    // } else {
        
    // }
}