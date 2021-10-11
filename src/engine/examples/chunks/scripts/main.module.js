import * as engine from '../../../scripts/rep.module.js'
import * as m3d from '../../../scripts/m3d/rep.module.js'
import * as m3d_enviroment from '../../../scripts/m3d/environments/environment.module.js'
import * as m3d_gui from '../../../scripts/m3d/gui/dat.gui.module.js'
import { Stats } from '../../../scripts/libs/stats.module.js'

import * as handler_map from './map.module.js'

class Program {
    constructor () {
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
    }

    async init () {
        engine.core.init()

        document.body.isShowing = true

        window.onresize = () => this.environment.resize()

        this.environment.scene.add( this.map )

        const hemiLight = engine.m3d.create.light( 'hemisphere', 0xffffff, 0x080820, 1 ).store().retrieve()
        hemiLight.position.set( 0, 100, 0 )

        this.environment.scene.add( hemiLight )

        const textureLoader = new engine.m3d.loader.texture(),

		skyboxTexture = textureLoader.load( '../../assets/textures/skybox/sky.9.jpeg', () => {
			const rt = new engine.m3d.webgl.renderTargetCube( skyboxTexture.image.height )
			rt.fromEquirectangularTexture( this.environment.renderers.webgl, skyboxTexture )

			this.environment.scene.background = rt.texture
		} )

        handler_map.rep.generateMacro()

        const gui_folder$static = this.gui.addFolder( 'Static' )

        const gui_folder$static_elevation = gui_folder$static.addFolder( 'Elevation' )
        gui_folder$static_elevation.add( this.map.elev, 'max', 0, 35 ).name( 'Max Height' )
        gui_folder$static_elevation.open()

        gui_folder$static.add( this.map.size, 'width', {
            'Tiny': 256,
            'Small': 512,
            'Normal': 1024,
            'Large': 1536,
            'Huge': 2048,
            'Massive': 4096,
        } ).name( 'Size' )

        gui_folder$static.add( handler_map.rep, 'generateMacro' ).name( 'Regenerate' )

        gui_folder$static.open()

        const gui_folder$live = this.gui.addFolder( 'Live' )

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