import { Parser } from '../parser.module.js'
import * as engine from '../../mystic.module.js'

class Parser_MOBJX extends Parser {
    constructor ( category = 'MOBJX' ) {
        super( category )
    }

    parse ( fileData ) {
        const lod = new engine.m3d.lod()

        let count = 0

        return new Promise( ( resolve, reject ) => {
            for ( const s in fileData.gltf.scenes ) {
                this.loader.gltf.parse( fileData.gltf.scenes[ s ], '', ( gltf ) => {
                    count++

                    gltf.scene.name = s
                    gltf.scene.visible = false
        
                    gltf.scene.scale.set( 
                        fileData.lod.uniScale, 
                        fileData.lod.uniScale, 
                        fileData.lod.uniScale 
                    )
        
                    fileData.lod.levels.forEach( l => {
                        if ( l[ 0 ] == s ) lod.addLevel( gltf.scene, l[ 1 ] * fileData.lod.uniScale )
                    } )

                    if ( count == Object.keys( fileData.gltf.scenes ).length ) resolve( lod )
                }, reject )
            }
        } )
    }
}

export { Parser_MOBJX, Parser_MOBJX as parser }