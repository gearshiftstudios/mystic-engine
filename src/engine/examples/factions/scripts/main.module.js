import * as engine from '../../../scripts/rep.module.js'
import * as m3d_enviroment from '../../../scripts/m3d/environments/environment.module.js'
import { Stats } from '../../../scripts/libs/stats.module.js'

import * as handler_nations from './handlers/nations.module.js'
import * as handler_map from './handlers/map.module.js'

class Program {
    constructor () {
        this.macromap = handler_map.group
        this.stats = new Stats()

        this.handlers = {
            nations: handler_nations.rep,
            map: handler_map.rep,
        }

        this.environment = m3d_enviroment.create( document.body)
            .modify( {
                alwaysResize: true,
                name: 'map-selection',
                subClass: 'sp-sk-pregame',
            } ).store().retrieve()

        this.animate = () => {
            this.stats.begin()

            this.render()

            this.stats.end()

            requestAnimationFrame( this.animate )
        }
    }

    render () {
        this.environment.render()

        if ( this.macromap && this.macromap.water && this.macromap.initialized ) {
            if ( this.macromap.animateWater ) this.macromap.water.geometry.attributes.position.needsUpdate = true
        }
    }

    init () {
        /* initialize core element prototypes */
        engine.core.init().then( () => {
            this.stats.showPanel( 0 )

            document.body.isShowing = true
            document.body.appendChild( this.stats.dom )

            window.onresize = () => this.environment.resize()

            this.environment.scene.add( this.macromap )

            this.handlers.map.init().then( () => {
                this.handlers.nations.init().then( () => {
                    App.gEBI( 'm3d-gui.macromap' ).show()
                    App.gEBI( 'm3d-gui.nationpicker' ).show()

                    this.animate()
                } )
            } )
        } )
    }
}

window.program = new Program()
window.program.init()