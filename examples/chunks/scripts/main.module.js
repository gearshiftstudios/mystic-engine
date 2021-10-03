import * as engine from '../../../scripts/rep.module.js'
import * as m3d_enviroment from '../../../scripts/m3d/environments/environment.module.js'
import { Stats } from '../../../scripts/libs/stats.module.js'

import * as handler_map from './map.module.js'
import { handler_chunk } from './chunks.module.js'

class Program {
    constructor () {
        this.lod = new engine.m3d.lod()
        this.stats = new Stats()
        this.map = handler_map.rep.create() 

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
    }

    render () {
        this.environment.render()
    }

    async init () {
        engine.core.init()

        document.body.isShowing = true

        window.onresize = () => this.environment.resize()

        this.environment.scene.add( this.map )

        const hemiLight = engine.m3d.create.light( 'hemishphere', 0xffffff, 0x080820, 1 ).store().retrieve()
        hemiLight.position.set( 0, 100, 0 )

        this.environment.scene.add( hemiLight )

        const heightMap = await handler_map.rep.generateValues( 2, 2, 0.6, 'none', this.map.size.width, this.map.size.height, 0.5 )

        await this.map.createSolid( 
            this.environment.scene, 
            this.map.size.width, 
            this.map.size.height,
            heightMap
        )

        const textureLoader = new engine.m3d.loader.texture(),

		skyboxTexture = textureLoader.load( '../../assets/textures/skybox/sky.9.jpeg', () => {
			const rt = new engine.m3d.webgl.renderTargetCube( skyboxTexture.image.height )
			rt.fromEquirectangularTexture( this.environment.renderers.webgl, skyboxTexture )

			this.environment.scene.background = rt.texture
		} )

        this.animate()
    }
}

window.program = new Program()
window.program.init()