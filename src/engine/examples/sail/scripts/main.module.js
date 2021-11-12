/* Import engine-side scripts */ 
import * as engine from '../../../scripts/mystic.module.js'
import { EProg } from '../../../scripts/eprog.module.js'
import * as stats from '../../../scripts/libs/stats.module.js'

import { Ammo } from '../../../scripts/libs/ammo.module.js'
import { Water_LowPoly_Shader } from '../../../scripts/m3d/water/lowpoly-shader.module.js'
import * as listeners from './listeners.module.js'

/* Create program class */ 
class Program extends EProg {
    constructor ( name, mainEnvContainer ) {
        super( name, mainEnvContainer )

        this.water = new Water_LowPoly_Shader( 20, 20 )

        this.temp = {
            mixer: null,
            clock: new engine.m3d.clock()
        }

        /* Define animation loop */ 
        this.animate = () => {
            stats.element.begin()

            var delta = this.temp.clock.getDelta()

            if ( listeners.initialized ) listeners.recursive()
            if ( this.water.initialized ) this.water.update()

            this.environments.main.render()

            stats.element.end()

            requestAnimationFrame( this.animate )
        }
    }

    init () {
        Ammo().then( ( data ) => {
            this.environments.main.initPhysics( data )

            /* initialize core element prototypes */
            engine.core.init().then( () => {
                stats.init().then( () => {
                    listeners.init().then( () => {
                        this.water.init( this.environments.main.scene ).then( () => {
                            this.animate()
                        } )
                    } )
                } )
            } )
        } )
    }
}

/* Create program */ 
window.program = new Program(
    'Sail Example',
    document.body
)

/* Initialize and run the program */ 
window.program.init()