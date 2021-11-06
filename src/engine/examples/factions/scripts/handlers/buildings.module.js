import { Program_Module } from '../module.module.js'
import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d_loader_gltf from '../../../../scripts/m3d/loaders/gltfe.module.js'
import { Pawn } from './pawn.module.js'

class Handler_Buildings extends Program_Module {
    constructor ( category = 'Buildings Handler' ) {
        super( category )

        this.loader = {
            gltf: new m3d_loader_gltf.eLoader(),
        }
    }

    init () {
        return new Promise( resolve => {
            this.loader.gltf.load( './models/units/naval/carrack.castilian.glb', model => {
                console.log( model )

                model.scene.position.y = program.handlers.macromap.settings.elev.water

                const test = new Pawn( model, 'fleet', null, 'Test Fleet', true )
                test.animations.play( 'infinite' ).section( 'idle' )

                // model.scene.traverse( ( child ) => {
                //     if ( child.isMesh ) {
                //         child.castShadow = true
                //         // child.receiveShadow = true
                //         // child.geometry.computeVertexNormals()
                //     }
                // } )
    
                // program.environments.main.scene.add( model.scene )

                // program.temp.mixer = new engine.m3d.animation.mixer( model.scene )
        
                // model.animations.forEach( ( clip ) => {
                //     console.log( clip )

                //     program.temp.mixer.clipAction( clip ).play()
                // } )

                resolve()
            } )

            resolve()
        } )
    }
}

const BUILDINGSREP = new Handler_Buildings()

export { BUILDINGSREP as rep, Handler_Buildings }