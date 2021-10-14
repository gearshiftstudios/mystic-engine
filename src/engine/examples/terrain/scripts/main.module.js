import * as engine from '../../../scripts/rep.module.js'
import * as m3d from '../../../scripts/m3d/rep.module.js'
import * as m3d_enviroment from '../../../scripts/m3d/environments/environment.module.js'
import * as m3d_gui from '../../../scripts/m3d/gui/dat.gui.module.js'
import { Stats } from '../../../scripts/libs/stats.module.js'

import * as handler_map from './map.module.js'

class Program {
    constructor () {
        this.count = 0
        this.gui = new m3d_gui.class()
        this.lod = new engine.m3d.lod()
        this.map = handler_map.group
        this.stats = new Stats()

        this.handlers = {
            map: handler_map.rep,
        }

        this.environment = m3d_enviroment.create( document.body, {
            // camera: new engine.m3d.camera.flat( 0, 0, document.body.offsetWidth, document.body.offsetHeight, 0.1, 2000 )
        } ).modify( {
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

        this.generate = {
            map: {
                macro: () => {}
            }
        }
    }

    render () {
        this.environment.render()

        if ( this.map && this.map.water && this.map.initialized ) {
            if ( this.map.animateWater ) this.map.water.geometry.attributes.position.needsUpdate = true
        }

        // if ( this.map.water ) this.map.water.material.uniforms[ 'time' ].value += 0.25 / 60.0

        // if ( this.map && this.map.initialized ) {
        //     for ( let i = 0; i < this.map.waterSharingVertices.length; i++ ) {
        //         var z = +this.map.water.geometry.vertices[ i ].z
        //         this.map.water.geometry.vertices[ i ].z = Math.sin(( i + this.count * 0.02)) * (this.map.water.geometry.vertices[i].tempZ - (this.map.water.geometry.vertices[i].tempZ* 0.6))
        //         this.map.mesh.geometry.vertices[ i ].z = this.map.water.geometry.vertices[ i ].z
        //         this.map.mesh.geometry.verticesNeedUpdate = true
          
        //         this.count += 0.1
        //     }
        // }
    }

    async init () {
        engine.core.init()

        this.stats.showPanel( 0 )

        document.body.isShowing = true
        document.body.appendChild( this.stats.dom )

        window.onresize = () => this.environment.resize()

        this.environment.scene.add( this.map )

        handler_map.rep.generateMacro()

        const gui_folder$static = this.gui.addFolder( 'Static' )

        gui_folder$static.add( this.map.size, 'width', {
            'Tiny': 250,
            'Small': 500,
            'Normal': 750,
            'Large': 1000
        } ).name( 'Size' )

        gui_folder$static.add( handler_map.rep, 'generateMacro' ).name( 'Regenerate' )

        const gui_folder$static_elevation = gui_folder$static.addFolder( 'Elevation' )
        gui_folder$static_elevation.add( this.map.elev, 'max', 0, 35 ).name( 'Max' )
        gui_folder$static_elevation.open()

        gui_folder$static.open()

        const gui_folder$live = this.gui.addFolder( 'Live' )

        const gui_folder$live_water = gui_folder$live.addFolder( 'Water' )
        gui_folder$live_water.add( this.map, 'animateWater' ).name( 'Animate' ).listen()
        gui_folder$live_water.open()

        const gui_folder$live_fog = gui_folder$live.addFolder( 'Fog of War' )
        gui_folder$live_fog.add( this.handlers.map, 'toggleFog' ).name( 'Toggle' ).listen()
        gui_folder$live_fog.open()

        const gui_folder$live_position = gui_folder$live.addFolder( 'Position' )
        gui_folder$live_position.add( this.map.position, 'x', 0 ).name( 'X' )
        gui_folder$live_position.add( this.map.position, 'y', 0 ).name( 'Y' )
        gui_folder$live_position.add( this.map.position, 'z', 0 ).name( 'Z' )
        gui_folder$live_position.open()

        gui_folder$live.open()

        this.animate()
    }
}

window.program = new Program()
window.program.init()