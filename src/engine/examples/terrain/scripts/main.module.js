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

        if ( this.map && this.map.initialized ) this.map.water.geometry.attributes.position.needsUpdate = true

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

        var hemiLight = new engine.m3d.light.hemisphere( 0xffffff, 0xffffff, 0.6 );
            hemiLight.color.setHSL( 0.6, 0.75, 0.5 );
            hemiLight.groundColor.setHSL( 0.095, 0.5, 0.5 );
            hemiLight.position.set( 0, 500, 0 );
            this.environment.scene.add( hemiLight );

            var dirLight = new engine.m3d.light.directional( 0xffffff, 1 )
            dirLight.position.set( -250, 250, 250 )

            dirLight.castShadow = true
            dirLight.shadow.camera.near = 0.000001
            dirLight.shadow.camera.far = 2000
            dirLight.shadow.camera.right = 500
            dirLight.shadow.camera.left = -500
            dirLight.shadow.camera.top = 500
            dirLight.shadow.camera.bottom = -500
            dirLight.shadow.mapSize.width = 100000
            dirLight.shadow.mapSize.height = 100000

            this.environment.scene.add( dirLight )
            this.environment.scene.add( dirLight.target )

            const dirLightHelper = new engine.m3d.helper.light.directional( dirLight )
            this.environment.scene.add( dirLightHelper )

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