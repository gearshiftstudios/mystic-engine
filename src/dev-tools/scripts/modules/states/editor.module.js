import { State } from '../state.module.js'
import * as engine from '../../../../engine/scripts/rep.module.js'
import * as m3d_controls from '../../../../engine/scripts/m3d/controls/orbit.module.js'
import * as m3d_environment from '../../../../engine/scripts/m3d/environments/environment.module.js'

class Editor extends State {
    constructor ( category, domElement, envName ) {
        super( category, domElement, envName )

        this.domElement = domElement
        this.environment = m3d_environment.create( this.domElement, {
            camera: new engine.m3d.camera.depth(
                75,
                this.domElement.offsetWidth / this.domElement.offsetHeight,
                0.1,
                1000
            ),
        } ).modify( {
            alwaysResize: true,
            subClass: 'editors',
            name: envName,
        } ).store().retrieve()

        this.grid = {
            lod: new engine.m3d.lod(),
            levels: [
                new engine.m3d.helper.grid( 5000, 5000, 'green', '#262626' ),
                new engine.m3d.helper.grid( 5000, 500, 'green' ),
                new engine.m3d.helper.grid( 5000, 50, 'green' )
            ],
        }
    }

    editorInit () {
        this.environment.scene.background = new engine.m3d.color( 0x141414 )
        this.environment.scene.fog = new engine.m3d.fog( new engine.m3d.color( 0x141414 ), 0.1, 100 )

        this.environment.scene.gltfModels = new engine.m3d.group()
        this.environment.scene.add( this.environment.scene.gltfModels )

        this.environment.lights.hemisphere = engine.m3d.create.light( 'hemisphere', 0xffffff, 0x000000, 1 )
            .store().addTo( this.environment.scene ).retrieve()

            this.environment.lights.hemisphere.position.set( 0, 100, 0 )

        this.environment.lights.directional = engine.m3d.create.light( 'directional', 0xffffff, 1 )
            .store().addTo( this.environment.scene ).retrieve()

            this.environment.lights.directional.position.set( 50, 50, 50 )
        
        this.environment.lights.hemisphere.position.set( 0, 100, 0 )

        this.grid.levels.forEach( ( l, ix ) => {
            this.grid.lod.addLevel( l, ix == 0 ? 0 : ix == 1 ? 25 : ix == 2 ? 100 : 0 )
        } )

        this.environment.scene.add( this.grid.lod )
    }
}

export { Editor }