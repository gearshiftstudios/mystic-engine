import * as engine from '../../../scripts/rep.module.js'
import * as m3d from '../../../scripts/m3d/rep.module.js'
import { noise } from '../../../scripts/libs/perlin.module.js'

import { handler_chunk } from './chunks.module.js'

class Handler_Map {
    constructor () {
        this.settings = {
            size: {
                width: 256,
                height: 256,
            }
        }
    }

    create ( width, height ) {
        let _w = ( width && typeof width == 'number' ) ? width : this.settings.size.width,
            _h = ( height && typeof height == 'number' ) ? height : this.settings.size.height

        if ( !engine.math.isWhole( _w / handler_chunk.size ) ) _w = this.settings.size.width
        if ( !engine.math.isWhole( _h / handler_chunk.size ) ) _h = this.settings.size.height

        const map = new engine.m3d.map( _w, _h )

        // map.heightMap = values.heightMap
        // map.biomeMap = values.biomeMap

        return map
    }

    generateMacro () {
        this.generateValues( 2, 2, 0.6, 'none', MAPGROUP.size.width, MAPGROUP.size.width, 0.5 )
            .then( values => {
                MAPGROUP.regenerate( values.heightMap, values.biomeMap )
                    .then( () => {
                        this.loadTrees().then( trees => {
                            MAPGROUP.trees = trees
                            
                            console.log( MAPGROUP.trees )
                        } )
                    } )
            } )
    }

    loadTrees () {
        return new Promise ( resolve => {
            const trees = {
                'tundra': {},
                'taiga': {},
                'temp-decid': {},
            }

            /* load in temperate deciduous trees */ 
            this.loadTreeLOD( './objects/trees/temp-decid.tall.mobjx' )
                .then( tallLOD => {
                    trees[ 'temp-decid' ][ 'tall' ] = tallLOD

                    this.loadTreeLOD( './objects/trees/temp-decid.moderate.mobjx' )
                        .then( moderateLOD => {
                            trees[ 'temp-decid' ][ 'moderate' ] = moderateLOD

                            resolve( trees )
                        } )
                } )
        } )
    }

    loadTreeLOD ( file ) {
        return new Promise ( resolve => {
            engine.file.mystic.retrieve( file )
                .then( data => {
                    m3d.parser.mobjx.parse( data ).then( lod => resolve( lod ) )
                } )
        } )
    }

    async generateValues ( _mainMulti, _secondMulti, _exp, _mask, _width, _height, _seaLevel ) {
        let canvas = document.getElementById( 'debug-canvas' ),
            ctx = canvas.getContext( '2d' ),
    
            cellSize = 1,
    
            multiplierPerlin = _mainMulti,
            octaveMulti = _secondMulti,
            exp = _exp,
            mask = _mask,
            width = _width + 1,
            height = _height + 1,
            seaLevel = _seaLevel
    
        canvas.width = width * cellSize
        canvas.height = height * cellSize
    
        let heightMap = [],
            tempMap = [],
            moistMap = [],
            biomeMap = [],
            archipelagoMask = [],
            grtLakesMask = []
    
        function convertTo1D ( map ) {
            let out = []

            for ( let y = 0; y < height; y++ ) {
                for ( let x = 0; x < width; x++ ) out.push( map[ x ][ y ] )
            }

            return ( out )
        }
    
        function draw () {
            ctx.clearRect( 0, 0, canvas.width, canvas.height )
          
            for ( let x = 0; x < width; x++ ) {
                for ( let y = 0; y < height; y++ ) {
                    ctx.fillStyle = `rgb(${ heightMap[ x ][ y ]*  255 },${ heightMap[ x ][ y ] * 255 },${ heightMap[ x ][ y ] * 255 })`
                    ctx.fillRect( x * cellSize, y * cellSize, cellSize, cellSize )
                }
            }
        }
    
        function initMasks () {
            for ( let x = 0; x < width; x++ ) {
                archipelagoMask.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        d = Math.sqrt( nx * nx + ny * ny ) / Math.sqrt( 0.5 )

                    archipelagoMask[x][y] = d
                }
            }

            for ( let x = 0; x < width; x++ ) {
                grtLakesMask.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        d = Math.sqrt( nx * nx + ny * ny ) / Math.sqrt( 0.5 )
                        
                    d = Math.pow( d, 2.5 )

                    grtLakesMask[ x ] [y ] = -d
                }
            }
        }
    
        function initHM () {
            noise.seed( Math.random() )

            for ( let x = 0; x < width; x++ ) {
                heightMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        e = 1 * octaveMulti * noise.perlin2( 1 * nx * multiplierPerlin * octaveMulti, 1 * ny * multiplierPerlin * octaveMulti )
                        + 0.5 * octaveMulti * noise.perlin2( 2 * nx * multiplierPerlin * octaveMulti, 2 * ny * multiplierPerlin * octaveMulti )
                        + 0.25 * octaveMulti * noise.perlin2( 4 * nx * multiplierPerlin * octaveMulti, 4 * ny * multiplierPerlin * octaveMulti )

                    e = e / ( 1 + 0.5 + 0.25 )
                    e += 1.0
                    e /= 2.0
    
                    if ( e <= seaLevel ) e = 0
    
                    e -= seaLevel

                    if ( mask !== 'great lakes' ) {
                        if ( e <= 0 ) e = 0
                    } else {
                        if  (e <= 0 ) e = 0
                    }

                    let value = e
                    value = Math.pow( e, exp )

                    heightMap[ x ][ y ] = value
                }
            }
        }
    
        function initTM () {
            noise.seed( Math.random() )

            for ( let x = 0; x < width; x++ ) {
                tempMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5

                    tempMap[ x ][ y ] = noise.perlin2( nx * multiplierPerlin, ny * multiplierPerlin )
                }
            }
        }
    
        function initMM () {
            noise.seed( Math.random() )
            
            for ( let x = 0; x < width; x++ ) {
                moistMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5

                    moistMap[ x ][ y ] = noise.perlin2( nx * multiplierPerlin, ny * multiplierPerlin )
                }
            }
        }
    
        // 0 = tundra
        // 1 = taiga
        // 2 = temp grassland
        // 3 = temp decid forest
        // 4 = temp conif forest
        // 5 = sub trop desert
        // 6 = savanna
        // 7 = trop seasonal forest
        // 8 = trop rainforest
    
        function biomeCheck () {
            for ( let x = 0; x < width; x++ ) {
                biomeMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    if ( tempMap[ x ][ y ] <= -0.3 ) biomeMap[ x ][ y ] = 0
                    else if ( tempMap[ x ][ y ] <= -0.1 ) {
                        if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                        else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                        else biomeMap[ x ][ y ] = 1
                    } else if ( moistMap[ x ][ y ] <= 0.35 ) {
                        if ( moistMap[ x ][ y ] <= -0.425 ) biomeMap[ x ][ y ] = 5
                        else if ( moistMap[ x ][ y ] <= -0.3 ) biomeMap[ x ][ y ] = 2
                        else if ( moistMap[ x ][ y ] <= 0.3) biomeMap[ x ][ y ] = 3
                        else biomeMap[ x ][ y ] = 4
                    } else {
                        if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 5
                        else if ( moistMap[ x ][ y ] <= -0.275 ) biomeMap[ x ][ y ] = 6
                        else if ( moistMap[ x ][ y ] <= 0.2 ) biomeMap[ x ][ y ] = 7
                        else biomeMap[ x ][ y ] = 8
                    }
                }
            }
        }
    
        function applyMask ( mask ) {
            switch ( mask ) {
                case 'archipelago':
                    for ( let x = 0; x < width; x++ ) {
                        for ( let y = 0; y < height; y++ ) heightMap[ x ][ y ] -= archipelagoMask[ x ][ y ] / 1.25
                    }

                    break
                case 'great lakes':
                    for ( let x = 0; x < width; x++ ) {
                        for ( let y = 0; y < height; y++ ) {
                            
                            heightMap[ x ][ y ] += ( grtLakesMask[ x ][ y ] ) * 1.5

                            if ( heightMap[ x ][ y ] <= 0 ) heightMap[ x ][ y ] = 0
                            
                            heightMap[ x ][ y ] -= 0.5
                            heightMap[ x ][ y ] *= -1
                            heightMap[ x ][ y ] += 0.2

                            if ( heightMap[ x ][ y ] < 0.7 ) heightMap[ x ][ y ] *= 0.5
                        }
                    }

                    break
            }
        }
    
        initMasks()
        initHM()
        applyMask( mask )
        initTM()
        initMM()
        biomeCheck()
        draw()

        console.log( convertTo1D( biomeMap ) )

        return {
            biomeMap: convertTo1D( biomeMap ),
            heightMap: ctx.getImageData( 0, 0, canvas.width, canvas.height ),
        }
    }
    
    // generateValues( 2, 2, 0.6, 'none', 512, 512, 0.5 )
}

const MAPREP = new Handler_Map()
const MAPGROUP = MAPREP.create() 

export { MAPREP as rep, MAPGROUP as group }