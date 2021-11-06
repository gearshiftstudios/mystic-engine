import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d from '../../../../scripts/m3d/rep.module.js'
import * as animator from '../../../../scripts/libs/gsap/gsap.module.js'
import { noise } from '../../../../scripts/libs/perlin.module.js'

import { Program_Module } from '../module.module.js'

import * as handler_minimap from './minimap.module.js'

window.dummy = new engine.m3d.object3D()

class Map extends engine.m3d.object3D {
    constructor ( width, height, elevMax, mult ) {
        super()

        this.animateWater = false
        this.biomePreset = 0
        this.chunks = new Array()
        this.initialized = false
        this.instances = {}
        this.inScene = false
        this.isGroup = true
        this.isMap = true
        this.isMapGroup = true
        this.mult = mult
        this.type = 'Map'

        this.waterDetails = {
            uniforms: {

            }
        }

        this.elev = {
            max: elevMax,
            min: 0,
        }

        this.size = {
            width: width,
            height: height,
        }

        this.dev = {
            chunks: {
                boundsVisible: false
            },
        }
    }

    toggleChunkBounds () {
        if ( !this.dev.chunks.boundsVisible ) {
            this.chunks.forEach( c => {
                c.bounds.visible = true
                c.bounds.update()
            } )

            this.dev.chunks.boundsVisible = true
        } else {
            this.chunks.forEach( c => c.bounds.visible = false )

            this.dev.chunks.boundsVisible = false
        }
    }
}

class Chunk {
    constructor ( x, y, z, geometry, material, index ) {
        this.index = index
        this.instances = {}
        this.mesh = new engine.m3d.mesh.default( geometry, material )

        this.position = {
            map: new engine.m3d.vec3( x, y, z ),
        }
    }
}

class Handler_Map extends Program_Module {
    constructor ( category = 'Map Handler' ) {
        super( category )

        const scope = this
        
        this.fogVisible = false
        this.trees = {}

        this.chunks = {
            hovered: new Array(),
            selected: new Array(),

            point: {
                hovered: new Array(),
                selected: new Array(),
            },
        }

        this.tiles = {
            hovered: new Array(),
            selected: new Array(),

            point: {
                hovered: new Array(),
                selected: new Array(),
            },
        }

        this.biomes = [
            [ 'tundra', 0.99, 0.99 ],
            [ 'taiga', 0.75, 0.75 ],
            [ 'temp-grass', 0.99, 0.99 ],
            [ 'temp-decid', 0.75, 0.75 ],
            [ 'temp-conif', 0.75, 0.75 ],
            [ 'sub-trop-desert', 0.99, 0.99 ],
            [ 'savanna', 0.90, 0.90 ],
            [ 'trop-seasonal', 0.5, 0.5 ],
            [ 'trop-rain', 0.5, 0.5 ],
        ]

        this.settings = {
            mult: 2.5,

            biomes: {
                preset: 0,
            },
            elev: {
                max: 16,
                water: 0.3,
            },
            size: {
                width: 200,
                height: 200,
            },
            chunk: {
                amount: [ 0, 0 ],
                boundsVisible: false,
                size: 50,
            },
        }

        this.timelines = {
            water: null
        }

        this.tile = class {
            constructor ( face1, face2, vertices, center, biome, isCliff, isCoast ) {
                this.a = face1
                this.b = face2
                this.biome = biome
                this.center = center // [ x, y ]
                this.faces = [ face1, face2 ]
                this.vertices = vertices
                this.hasTree = Math.random() >= scope.biomes[ biome ][ 1 ]
                this.isCliff = isCliff
                this.isCoast = isCoast
            }
        }

        this.vertex = class {
            constructor () {
                this.indexes = new Array()
                this.position = new Array()
                this.surface = false
            }
        }

        this.face = class {
            constructor () {
                this.vertices = { indexed: new Array(), nonIndexed: new Array() }
                this.terrainType = null
                this.terrainColor = null
                this.tile = 0
            }
        
            calcMaxHeight ( useIndexed ) {
                const zValues = new Array()
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return Math.max( ...zValues )
            }
        
            calcMinHeight ( useIndexed ) {
                const zValues = new Array()
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return Math.min( ...zValues )
            }
        
            calcAvgHeight ( useIndexed ) {
                const zValues = new Array()
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return ( zValues[ 0 ] + zValues[ 1 ] + zValues[ 2 ] ) / 3
            }
        }
    }

    create ( width, height ) {
        let _w = ( width && typeof width == 'number' ) ? width : this.settings.size.width,
            _h = ( height && typeof height == 'number' ) ? height : this.settings.size.height

        if ( !engine.math.isWhole( _w / 20 ) ) _w = this.settings.size.width
        if ( !engine.math.isWhole( _h / 20 ) ) _h = this.settings.size.height

        const map = new Map( _w, _h, this.settings.elev.max, this.settings.mult )

        // map.heightMap = values.heightMap
        // map.biomeMap = values.biomeMap

        return map
    }

    animateWater () {
        this.timelines.water = new animator.TimelineMax( { yoyo: true, repeat: -1 } )

        this.timelines.water.to( 
            MAPGROUP.water.geometry.attributes.position.array,
            { 
                endArray: MAPGROUP.waterGeo[ 1 ].attributes.position.array, 
                duration: 2,
            }
        )
    }

    checkPreset () {
        return new Promise( resolve => {
            const preset = MAPGROUP.biomePreset,
                leaflets = App.body.state( 'macromap-generation' )
                    .qS( '#macromap-generation-panel' )
                    .qSA( 'leaflet' )
            
            for ( let i = 0; i < leaflets.length; i++ ) {
                if ( leaflets[ i ].hasAttribute( 'preset' ) ) {
                    const number = Number( leaflets[ i ].getAttribute( 'preset' ) )

                    if ( number == preset ) leaflets[ i ].qS( 'input' ).checked = true
                    else leaflets[ i ].qS( 'input' ).checked = false
                }
            }

            resolve()
        } )
    }

    resetGenerationPanel () {
        return new Promise( resolve => {
            this.checkPreset().then( () => {
                const leaflets = App.body.state( 'macromap-generation' )
                    .qS( '#macromap-generation-panel' )
                    .qSA( 'leaflet' )
                
                MAPGROUP.size.width = this.settings.size.width
                MAPGROUP.size.height = this.settings.size.height

                App.body.state( 'macromap-generation' )
                    .qS( '#macromap-generation-panel' )
                    .qS( '#size' ).qS( 'input' ).value = this.settings.size.width

                MAPGROUP.elev.max = this.settings.elev.max

                App.body.state( 'macromap-generation' )
                    .qS( '#macromap-generation-panel' )
                    .qS( '#elevation' ).qS( 'input' ).value = this.settings.elev.max

                MAPGROUP.mult = this.settings.mult

                App.body.state( 'macromap-generation' )
                    .qS( '#macromap-generation-panel' )
                    .qS( '#fractal' ).qS( 'input' ).value = this.settings.mult
            
                for ( let i = 0; i < leaflets.length; i++ ) {
                    if ( leaflets[ i ].hasAttribute( 'biome' ) ) {
                        const number = Number( leaflets[ i ].getAttribute( 'biome' ) )

                        let result

                        this.biomes[ number ][ 1 ] = this.biomes[ number ][ 2 ]

                        switch ( this.biomes[ number ][ 2 ] ) {
                            case 1:
                                result = 0
                                break
                            case 0.99:
                                result = 1
                                break
                            case 0.95:
                                result = 2
                                break
                            case 0.75:
                                result = 3
                                break
                            case 0.5:
                                result = 4
                                break
                        }

                        leaflets[ i ].qS( 'input' ).value = result
                    }

                    if ( leaflets[ i ].hasAttribute( 'preset' ) ) {
                        const number = Number( leaflets[ i ].getAttribute( 'preset' ) )
    
                        if ( number == this.settings.biomes.preset ) leaflets[ i ].qS( 'input' ).checked = true
                        else leaflets[ i ].qS( 'input' ).checked = false
                    }
                }

                resolve()
            } )
        } )
    }
    
    toggleFog () {
        if ( MAPGROUP.initialized ) {
            if ( this.fogVisible ) {
                MAPGROUP.fog.visible = false

                program.environment.enableSkybox()

                this.fogVisible = false
            } else {
                MAPGROUP.fog.visible = true

                program.environment.scene.background = new engine.m3d.color( 0x000000 )

                this.fogVisible = true
            }
        }
    }

    colorTile ( chunkIndex, tileIndex, color ) {
        if ( chunkIndex ) {
            if ( tileIndex ) {
                const chunk = MAPGROUP.chunks[ chunkIndex ],
                    tile = MAPGROUP.chunks[ chunkIndex ].tiles[ tileIndex ]

                const colorXYZ = chunk.mesh.geometry.getAttribute( 'color' ),

                    colors = new Array(
                        new engine.m3d.color( color ? color : chunk.faces[ tile.a ].terrainColor ),
                        new engine.m3d.color( color ? color : chunk.faces[ tile.b ].terrainColor )
                    )

                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 0 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 1 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 2 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )

                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 0 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 1 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 2 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )

                colorXYZ.needsUpdate = true
            }
        }
    }

    getTileHeightMax ( chunkIndex, tileIndex ) {
        if ( chunkIndex ) {
            if ( tileIndex ) {
                const chunk = MAPGROUP.chunks[ chunkIndex ],
                    tile = MAPGROUP.chunks[ chunkIndex ].tiles[ tileIndex ]

                const verticesHeight = [
                    MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 0 ] ].indexes[ 2 ] ],
                    MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 1 ] ].indexes[ 2 ] ],
                    MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 2 ] ].indexes[ 2 ] ],
                    MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 3 ] ].indexes[ 2 ] ]
                ]

                return Math.max( ...verticesHeight )
            }
        }
    }

    setTileHeight ( chunkIndex, tileIndex, height, removeTree = false ) {
        return new Promise( resolve => {
            if ( chunkIndex ) {
                if ( MAPGROUP.allTiles[ tileIndex ].chunkTileIndex && ( 
                    MAPGROUP.allTiles[ tileIndex ].chunkTileIndex >= 0 && 
                    MAPGROUP.allTiles[ tileIndex ].chunkTileIndex < MAPGROUP.chunks[ chunkIndex ].tiles.length 
                ) ) {
                    const chunk = MAPGROUP.chunks[ chunkIndex ],
                        tile = MAPGROUP.chunks[ chunkIndex ].tiles[ MAPGROUP.allTiles[ tileIndex ].chunkTileIndex ],
                        tileVerticesXY = new Array()
    
                    for ( let i = 0; i < chunk.faces[ tile.a ].vertices.nonIndexed.length; i++ ) {
                        MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                            .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 2 ] ] = height
    
                        tileVerticesXY.push(
                            `${ MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 0 ] ]
                            }.${ MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 1 ] ] }`
                        )
    
                        MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                    }
    
                    for ( let i = 0; i < chunk.faces[ tile.b ].vertices.nonIndexed.length; i++ ) {
                        MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                            .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 2 ] ] = height
    
                        tileVerticesXY.push(
                            `${ MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 0 ] ]
                            }.${ MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 1 ] ] }`
                        )
    
                        MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                    }
    
                    if ( tile.treeInfo ) {
                        dummy.castShadow = true
                        dummy.receiveShadow = true
    
                        tile.treeInfo[ 4 ] = ( removeTree == true ) ? -20 : height
    
                        dummy.position.set( 
                            tile.treeInfo[ 3 ],
                            tile.treeInfo[ 4 ],
                            tile.treeInfo[ 5 ]
                        )
    
                        dummy.rotation.set( 
                            tile.treeInfo[ 6 ],
                            tile.treeInfo[ 7 ],
                            tile.treeInfo[ 8 ]
                        )
    
                        dummy.scale.set( 
                            tile.treeInfo[ 9 ],
                            tile.treeInfo[ 10 ],
                            tile.treeInfo[ 11 ]
                        )
    
                        dummy.updateMatrix()
    
                        MAPGROUP.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .setMatrixAt( tile.treeInfo[ 2 ], dummy.matrix )
    
                        MAPGROUP.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .instanceMatrix.needsUpdate = true
                    }
    
                    for ( let i = 0; i < MAPGROUP.allTiles[ tileIndex ].adjacencies.length; i++ ) {
                        const aChunkIndex = MAPGROUP.allTiles[ MAPGROUP.allTiles[ tileIndex ].adjacencies[ i ] ].chunkIndex,
                            aChunk = MAPGROUP.chunks[ aChunkIndex ],
                            aTile = MAPGROUP.chunks[ aChunkIndex ].tiles[ MAPGROUP.allTiles[ MAPGROUP.allTiles[ tileIndex ].adjacencies[ i ] ].chunkTileIndex ]
    
                        for ( let f = 0; f < aChunk.faces[ aTile.a ].vertices.nonIndexed.length; f++ ) {
                            const stringed = `${ MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 0 ] ]
                            }.${ MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 1 ] ] }` 

                            tileVerticesXY.forEach( vxy => {
                                if ( vxy == stringed ) {
                                    MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                        .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                } else {
                                    const newString = {
                                        x: Number( stringed.split( '.' )[ 0 ] ),
                                        y: Number( stringed.split( '.' )[ 1 ] ),
                                    }

                                    const newXY = {
                                        x: Number( vxy.split( '.' )[ 0 ] ),
                                        y: Number( vxy.split( '.' )[ 1 ] ),
                                    }

                                    if ( 
                                        newString.x == -( this.settings.chunk.size / 2 ) && 
                                        newXY.x == this.settings.chunk.size / 2  &&
                                        newString.y == newXY.y
                                    ) {
                                        MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.x == this.settings.chunk.size / 2 && 
                                        newXY.x == -( this.settings.chunk.size / 2 ) &&
                                        newString.y == newXY.y
                                    ) {
                                        MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.y == -( this.settings.chunk.size / 2 ) && 
                                        newXY.y == this.settings.chunk.size / 2  &&
                                        newString.x == newXY.x
                                    ) {
                                        MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.y == this.settings.chunk.size / 2 && 
                                        newXY.y == -( this.settings.chunk.size / 2 ) &&
                                        newString.x == newXY.x
                                    ) {
                                        MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }
                                }
                            } )
    
                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                        }
    
                        for ( let f = 0; f < aChunk.faces[ aTile.b ].vertices.nonIndexed.length; f++ ) {
                            const stringed = `${ MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 0 ] ]
                            }.${ MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 1 ] ] }`
    
                                tileVerticesXY.forEach( vxy => {
                                    if ( vxy == stringed ) {
                                        MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    } else {
                                        const newString = {
                                            x: Number( stringed.split( '.' )[ 0 ] ),
                                            y: Number( stringed.split( '.' )[ 1 ] ),
                                        }
    
                                        const newXY = {
                                            x: Number( vxy.split( '.' )[ 0 ] ),
                                            y: Number( vxy.split( '.' )[ 1 ] ),
                                        }
    
                                        if ( 
                                            newString.x == -( this.settings.chunk.size / 2 ) && 
                                            newXY.x == this.settings.chunk.size / 2  &&
                                            newString.y == newXY.y
                                        ) {
                                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.x == this.settings.chunk.size / 2 && 
                                            newXY.x == -( this.settings.chunk.size / 2 ) &&
                                            newString.y == newXY.y
                                        ) {
                                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.y == -( this.settings.chunk.size / 2 ) && 
                                            newXY.y == this.settings.chunk.size / 2  &&
                                            newString.x == newXY.x
                                        ) {
                                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.y == this.settings.chunk.size / 2 && 
                                            newXY.y == -( this.settings.chunk.size / 2 ) &&
                                            newString.x == newXY.x
                                        ) {
                                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ MAPGROUP.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
                                    }
                                } )
    
                            MAPGROUP.chunks[ aChunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                        }

                        this.updateTileColor( aChunkIndex, MAPGROUP.allTiles[ tileIndex ].adjacencies[ i ] )
                    }

                    resolve( [ chunkIndex, tileIndex ] )
                }
            }
        } )
    }

    updateTileColor ( chunkIndex, tileIndex, buildMode = null ) {
        return new Promise( resolve => {
            const tile = MAPGROUP.allTiles[ tileIndex ]

            const color = new engine.m3d.color(),
                colorXYZ = MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.color

            const searchZValues = face => {
                const zValues = new Array()

                MAPGROUP.chunks[ chunkIndex ].faces[ face ].vertices.nonIndexed.forEach( v => zValues.push( 
                    MAPGROUP.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ MAPGROUP.chunks[ chunkIndex ].vertices.nonIndexed[ v ].indexes[ 2 ] ]
                ) )

                return zValues
            }

            const calcMaxHeight = face => {
                const zValues = searchZValues( face )

                return Math.max( ...zValues )
            }

            const calcMinHeight = face => {
                const zValues = searchZValues( face )

                return Math.min( ...zValues )
            }
            
            const updateFace = ( face ) => {
                console.log( face )

                const min = calcMinHeight( face )
                const max = calcMaxHeight( face )
        
                switch ( MAPGROUP.chunks[ chunkIndex ].faces[ face ].biome ) {
                    case 0:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x8a9488
                        break
                    case 1:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x214010
                        break
                    case 2:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x174000
                        break
                    case 3:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x174000
                        break
                    case 4:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x102e00
                        break
                    case 5:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0xeecc44
                        break
                    case 6:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x4a4924
                        break
                    case 7:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x0d2600 // 0xd1a128 tree leaves
                        break
                    case 8:
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x0d2600
                        break
                }
                        
                /* assign colors based upon the elev of points within face */
                if ( min >= MAPGROUP.elev.min - 0.3 && min < MAPGROUP.elev.min + 0.75 ) {
                    if ( MAPGROUP.chunks[ chunkIndex ].faces[ face ].biome == 0 ) {
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x5c5c5c // cliff
                    } else {
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].isCoast = true
        
                        MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0xb8a763 // shore
                    }
                }
                        
                if ( min == MAPGROUP.elev.min && max == MAPGROUP.elev.min ) {
                    MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x255e6b
                }

                if ( max - min >= 1 ) {
                    MAPGROUP.chunks[ chunkIndex ].faces[ face ].isCliff = true

                    MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x3a3a3a
                }
    
                if ( min < MAPGROUP.elev.min - 1 ) {
                    MAPGROUP.chunks[ chunkIndex ].faces[ face ].isCrust = true
    
                    MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x452b01
                }

                if ( buildMode != null ) {
                    switch ( buildMode ) {
                        case 'settlement':
                            MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor = 0x7a6615
                            break
                    }
                }
        
                color.setHex( MAPGROUP.chunks[ chunkIndex ].faces[ face ].terrainColor )
        
                MAPGROUP.chunks[ chunkIndex ].faces[ face ].vertices.nonIndexed.forEach( v => {
                    colorXYZ.setXYZ( v, color.r, color.g, color.b )
                } )
                
                colorXYZ.needsUpdate = true
            }

            updateFace( tile.a )
            updateFace( tile.b )

            resolve()
        } )
    }

    updateSelectedTiles ( height, buildMode ) {
        return new Promise( resolve => {
            this.tiles.selected.forEach( t => {
                t = t.split( '.' )
            
                this.setTileHeight(
                    Number( t[ 0 ] ),
                    Number( t[ 1 ] ),
                    height,
                    true
                ).then( data => {
                    this.updateTileColor( data[ 0 ], data[ 1 ], buildMode )
                } )
            } )

            handler_minimap.rep.update.pixels()

            resolve()
        } )
    }

    /* generation */ 
    generateMacro ( mult = 2 ) {
        return new Promise( resolve => {
            const finish = () => {
                // this.animateWater()

                program.environments.main.controls.maxDistance = program.macromap.size.width / 1.667
    
                handler_minimap.rep.update.pixels()
    
                MAPGROUP.water[ 0 ].geometry.attributes.position.needsUpdate = true
                MAPGROUP.water[ 1 ].geometry.attributes.position.needsUpdate = true

                MAPGROUP.animateWater = true
                MAPGROUP.initialized = true
    
                program.loader( 'macromap' ).finishTask()

                resolve()
            }

            MAPGROUP.initialized = false

            program.loader( 'macromap' ).start()

            this.generateHeightmapCanvases().then( () => {
                this.generateChunkData( mult, mult, 0.6, 'none', MAPGROUP.size.width, MAPGROUP.size.height, 0.5, MAPGROUP.biomePreset ).then( () => {
                    this.drawChunkData().then( () => {
                        program.loader( 'macromap' ).finishTask()

                        this.regenerateChunks().then( () => {
                            program.loader( 'macromap' ).finishTask()

                            this.generateChunkMeshes().then( () => {
                                program.loader( 'macromap' ).finishTask()

                                this.generateChunkPeaks().then( () => {
                                    program.loader( 'macromap' ).finishTask()

                                    this.generateChunkFaces().then( () => {
                                        program.loader( 'macromap' ).finishTask()
    
                                        this.generateChunkColors().then( () => {
                                            program.loader( 'macromap' ).finishTask()

                                            this.loadTrees().then( () => {
                                                program.loader( 'macromap' ).finishTask()

                                                this.generateChunkTiles().then( () => {
                                                    program.loader( 'macromap' ).finishTask()

                                                    this.separateChunkTilesByBiome().then( () => {
                                                        program.loader( 'macromap' ).finishTask()

                                                        this.generateChunkTreeInstances().then( () => {
                                                            program.loader( 'macromap' ).finishTask()

                                                            this.generateBackground().then( () => {
                                                                program.loader( 'macromap' ).finishTask()

                                                                this.generateWater().then( () => {
                                                                    program.loader( 'macromap' ).finishTask()
    
                                                                    handler_minimap.rep.generate().then( () => {
                                                                        handler_minimap.rep.init().then( () => {
                                                                            program.loader( 'macromap' ).finishTask()
    
                                                                            this.checkPreset().then( () => {
                                                                                program.loader( 'macromap' ).finishTask()

                                                                                finish()
                                                                            } )
                                                                        } )
                                                                    } )
                                                                } )
                                                            } )
                                                        } )
                                                    } )
                                                } )
                                            } )
                                        } )
                                    } )
                                } )
                            } )
                        } )
                    } )
                } )
            } )
        } )
    }

    generateHeightmapCanvases () {
        return new Promise( resolve => {
            if ( App.body.state( 'debug' ).canvas( 'macromap' ) ) App.body.state( 'debug' ).canvas( 'macromap' ).remove()
            if ( App.body.state( 'debug' ).canvas( 'biomes-macromap' ) ) App.body.state( 'debug' ).canvas( 'biomes-macromap' ).remove()
            
            App.body.state( 'debug' ).create().canvas( 'macromap' )
            App.body.state( 'debug' ).create().canvas( 'biomes-macromap' )

            this.settings.chunk.amount[ 0 ] = MAPGROUP.size.width / this.settings.chunk.size
            this.settings.chunk.amount[ 1 ] = MAPGROUP.size.height / this.settings.chunk.size

            for ( let h = 0; h < this.settings.chunk.amount[ 1 ]; h++ ) {
                for ( let w = 0; w < this.settings.chunk.amount[ 0 ]; w++ ) {
                    const n = ( h * this.settings.chunk.amount[ 0 ] + w )

                    if ( App.body.state( 'debug' ).canvas( `chunk-${ n }` ) ) App.body.state( 'debug' ).canvas( `chunk-${ n }` ).remove()
                    if ( App.body.state( 'debug' ).canvas( `biomes-chunk-${ n }` ) ) App.body.state( 'debug' ).canvas( `biomes-chunk-${ n }` ).remove()
            
                    App.body.state( 'debug' ).create().canvas( `chunk-${ n }` )
                    App.body.state( 'debug' ).create().canvas( `biomes-chunk-${ n }` )

                    const hCanvas = App.body.state( 'debug' ).canvas( `chunk-${ n }` )
                    const bCanvas = App.body.state( 'debug' ).canvas( `biomes-chunk-${ n }` )

                    hCanvas.width = this.settings.chunk.size + 3
                    hCanvas.height = this.settings.chunk.size + 3

                    bCanvas.width = this.settings.chunk.size + 2
                    bCanvas.height = this.settings.chunk.size + 2
                } 
            }

            const canvases = App.body.state( 'debug' ).qSA( 'canvas' )

            for ( let i = 0; i < canvases.length; i++ ) {
                let ctx = canvases[ i ].getContext( '2d' )
                
                ctx.fillStyle = 'rgb(0,0,0)'
                ctx.fillRect( 0, 0, canvases[ i ].width, canvases[ i ].height )
            }

            resolve()
        } )
    }

    generateChunkData ( _mainMulti, _secondMulti, _exp, _mask, _width, _height, _seaLevel, _biomePreset ) {
        return new Promise( resolve => {
            let canvas = App.body.state( 'debug' ).canvas( 'macromap' ),
                ctx = canvas.getContext( '2d' ),

                bCanvas = App.body.state( 'debug' ).canvas( 'biomes-macromap' ),
                bctx = bCanvas.getContext( '2d' ),
    
                cellSize = 1,
    
                multiplierPerlin = _mainMulti,
                octaveMulti = _secondMulti,
                exp = _exp,
                mask = _mask,
                width = _width + 3,
                height = _height + 3,
                seaLevel = _seaLevel
    
            canvas.width = width * cellSize
            canvas.height = height * cellSize

            bCanvas.width = _width * cellSize
            bCanvas.height = _height * cellSize
    
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
                    ctx.fillStyle = `rgb(${ heightMap[ x ][ y ] *  255 },${ heightMap[ x ][ y ] * 255 },${ heightMap[ x ][ y ] * 255 })`
                    ctx.fillRect( x * cellSize, y * cellSize, cellSize, cellSize )
                }
            }
        }

        function drawBiomes () {
            MAPGROUP.biomeColorMap = {}

            bctx.clearRect( 0, 0, bCanvas.width, bCanvas.height )
          
            for ( let x = 0; x < _width; x++ ) {
                for ( let y = 0; y < _height; y++ ) {
                    let color

                    switch ( biomeMap[ x ][ y ] ) {
                        case 0:
                            color = 20

                            MAPGROUP.biomeColorMap[ 20 ] = 0
                            break
                        case 1:
                            color = 40

                            MAPGROUP.biomeColorMap[ 40 ] = 1
                            break
                        case 2:
                            color = 60

                            MAPGROUP.biomeColorMap[ 60 ] = 2
                            break
                        case 3:
                            color = 80

                            MAPGROUP.biomeColorMap[ 80 ] = 3
                            break
                        case 4:
                            color = 100

                            MAPGROUP.biomeColorMap[ 100 ] = 4
                            break
                        case 5:
                            color = 120

                            MAPGROUP.biomeColorMap[ 120 ] = 5
                            break
                        case 6:
                            color = 140

                            MAPGROUP.biomeColorMap[ 140 ] = 6
                            break
                        case 7:
                            color = 160

                            MAPGROUP.biomeColorMap[ 160 ] = 7
                            break
                        case 8:
                            color = 180

                            MAPGROUP.biomeColorMap[ 180 ] = 8
                            break
                    }

                    bctx.fillStyle = `rgb(${ color },${ color },${ color })`
                    bctx.fillRect( x * cellSize, y * cellSize, cellSize, cellSize )
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
            // console.log(tempMap)
            for ( let x = 0; x < width; x++ ) {
                biomeMap.push( [] )
                for ( let y = 0; y < height; y++ ) {
                    switch ( _biomePreset ) {
                        case 0:
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 1: 
                            if ( moistMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 2: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else biomeMap[ x ][ y ] = 6
                            }

                            break
                        case 3: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 4: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else biomeMap[ x ][ y ] = 2
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else biomeMap[ x ][ y ] = 7
                            }

                            break
                        case 5: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 6: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 7: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            }

                            break
                        case 8: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else biomeMap[ x ][ y ] = 7
                            }

                            break
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
            drawBiomes()

            const chunkMaps = new Array()

            for ( let ch = 0; ch < MAPGROUP.size.height; ch += 50 ) {
                for ( let cw = 0; cw < MAPGROUP.size.width; cw += 50 ) {
                    chunkMaps.push( {
                        x: cw,
                        y: ch,
                        data: ctx.getImageData( cw, ch, 51, 51 ),
                        biomes: bctx.getImageData( cw, ch, 50, 50 ),
                    } )
                }
            }

            MAPGROUP.heightMaps = chunkMaps

            resolve()
        } )
    }

    drawChunkData () {
        return new Promise( resolve => {
            MAPGROUP.chunkHeightMaps = new Array()
            MAPGROUP.chunkBiomeMaps = new Array()

            MAPGROUP.heightMaps.forEach( ( h, ix ) => {
                let canvas = App.body.state( 'debug' ).qS( `#chunk-${ ix }` ),
                    ctx = canvas.getContext( '2d' ),
                    
                    bCanvas = App.body.state( 'debug' ).qS( `#biomes-chunk-${ ix }` ),
                    bctx = bCanvas.getContext( '2d' ) 


                const start = { x: 1, y: 1, bx: 1, by: 1 }

                for ( let y = 0; y < h.data.height; y++ ) {
                    start.y = 1 + y
                    start.x = 1

                    for ( let x = 0; x < h.data.width; x++ ) {
                        const n = ( y * h.data.height + x ),
                            hColor = h.data.data[ n * 4 ]

                        start.x = 1 + x

                        ctx.fillStyle = `rgb(${ hColor },${ hColor },${ hColor })`
                        ctx.fillRect( start.x * 1, start.y * 1, 1, 1 )
                    }
                }

                for ( let y = 0; y < h.biomes.height; y++ ) {
                    start.by = 1 + y
                    start.bx = 1

                    for ( let x = 0; x < h.biomes.width; x++ ) {
                        const n = ( y * h.biomes.height + x ),
                            bColor = h.biomes.data[ n * 4 ]

                        start.bx = 1 + x

                        bctx.fillStyle = `rgb(${ bColor },${ bColor },${ bColor })`
                        bctx.fillRect( start.bx * 1, start.by * 1, 1, 1 )
                    }
                }

                MAPGROUP.chunkHeightMaps.push( ctx.getImageData( 0, 0, canvas.width, canvas.width ) )
                MAPGROUP.chunkBiomeMaps.push( bctx.getImageData( 0, 0, bCanvas.width, bCanvas.width ) )
            } )

            resolve()
        } )
    }

    regenerateChunks () {
        return new Promise( resolve => {
            if ( MAPGROUP.instances.trees ) {
                for ( const t in MAPGROUP.instances.trees ) {
                    for ( const _t in MAPGROUP.instances.trees[ t ] ) {
                        MAPGROUP.remove( MAPGROUP.instances.trees[ t ][ _t ] )
                    }
                }
            }

            if ( MAPGROUP.chunks != null && MAPGROUP.chunks.length > 0 ) {
                for ( let i = 0; i < MAPGROUP.chunks.length; i++ ) {
                    MAPGROUP.chunkMeshes.remove( MAPGROUP.chunks[ i ].mesh )
                }

                MAPGROUP.chunks = new Array()
            }

            if ( MAPGROUP.water ) {
                if ( MAPGROUP.water[ 0 ] != null ) {
                    MAPGROUP.remove( MAPGROUP.water[ 0 ] )
    
                    MAPGROUP.water[ 0 ] = null
    
                    if ( MAPGROUP.water[ 1 ] != null ) {
                        MAPGROUP.remove( MAPGROUP.water[ 1 ] )
        
                        MAPGROUP.water[ 1 ] = null
                    }
                }
            }

            if ( MAPGROUP.background ) {
                if ( MAPGROUP.background.paper != null ) {
                    MAPGROUP.remove( MAPGROUP.background.paper )
                   
                    MAPGROUP.background.paper = null
                }

                if ( MAPGROUP.background.grid != null ) {
                    MAPGROUP.remove( MAPGROUP.background.grid )
                   
                    MAPGROUP.background.grid = null
                }
            }

            resolve()
        } )
    }

    generateChunkMeshes () {
        return new Promise( resolve => {
            MAPGROUP.chunks = new Array()
            MAPGROUP.chunkGeometry = new Array()
            MAPGROUP.chunkMeshes = new engine.m3d.group()
            
            MAPGROUP.add( MAPGROUP.chunkMeshes )

            let ix = 0

            for ( 
                let h = -( ( MAPGROUP.size.height / 2 ) - ( this.settings.chunk.size / 2 ) ); 
                h < MAPGROUP.size.height / 2; 
                h += this.settings.chunk.size
            ) {
                for ( 
                    let w = -( ( MAPGROUP.size.width / 2 ) - ( this.settings.chunk.size / 2 ) ); 
                    w < MAPGROUP.size.width / 2; 
                    w += this.settings.chunk.size 
                ) {
                    const chunk = new Chunk( 
                        w, 0, h,
                        new engine.m3d.geometry.buffer.plane(
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2
                        ),
                        new engine.m3d.mat.mesh.standard( {
                            flatShading: true,
                            vertexColors: true,
                        } ),
                        ix
                    )
                    
                    // chunk.mesh.castShadow = true
                    chunk.mesh.chunkIndex = ix
                    chunk.mesh.receiveShadow = true
                    chunk.mesh.position.set( w, 0, h )
                    chunk.mesh.rotation.x = engine.m3d.util.math.degToRad( -90 )

                    MAPGROUP.chunkMeshes.add( chunk.mesh )
                    MAPGROUP.chunkGeometry.push( chunk.mesh.geometry.attributes.position.array )
                    MAPGROUP.chunks.push( chunk )

                    ix++
                }
            }

            resolve()
        } )
    }

    generateChunkPeaks () {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/generators/macromap/peaks.worker.js' )

            worker.postMessage( [
                MAPGROUP.chunkHeightMaps,
                MAPGROUP.chunkGeometry,
                this.settings.chunk.size,
                MAPGROUP.elev.min,
                MAPGROUP.elev.max
            ] )

            worker.onmessage = e => {
                MAPGROUP.chunks.forEach( ( c, ix ) => {
                    c.mesh.geometry.attributes.position.array = e.data[ 0 ][ ix ]
                    c.vertices = e.data[ 1 ][ ix ]

                    c.mesh.geometry.attributes.position.needsUpdate = true

                    c.bounds = new engine.m3d.helper.box.default( c.mesh, 0xff00ff )
                    c.bounds.visible = false

                    MAPGROUP.add( c.bounds )

                    resolve()
                } )
            }
        } )
    }

    generateChunkFaces () {
        return new Promise( resolve => {
            MAPGROUP.chunkVertices = new Array()

            MAPGROUP.chunks.forEach( c => {
                c.faces = new Array()

                let face = new this.face(),
                indexedCount = 0,
                nonIndexedCount = 0,
                faceCount = 0

                c.mesh.geometry.index.array.forEach( v => {
                    face.vertices.indexed.push( v )
        
                    indexedCount++
        
                    if ( indexedCount == 3 ) {
                        c.faces.push( face )
        
                        indexedCount = 0
                        
                        face = new this.face()
                    }
                } )
        
                const vertices_copy = c.vertices,
                faces_copy = c.faces
        
                let newGeo = c.mesh.geometry.toNonIndexed()
        
                c.mesh.geometry = newGeo
                c.vertices = vertices_copy
                c.faces = faces_copy
        
                let vertex = new this.vertex(), count = 0
        
                c.mesh.geometry.attributes.position.array.forEach( ( v, index ) => {
                    vertex.indexes.push( index )
                    vertex.position.push( v )
        
                    count++
        
                    if ( count == 3 ) {
                        c.vertices.nonIndexed.push( vertex )
        
                        count = 0
                        
                        vertex = new this.vertex()
                    }
                } )
        
                c.vertices.nonIndexed.forEach( ( v, index ) => {
                    c.faces[ faceCount ].vertices.nonIndexed.push( index )
        
                    nonIndexedCount++
        
                    if ( nonIndexedCount == 3 ) {
                        nonIndexedCount = 0
        
                        faceCount++
                    }
                } )

                MAPGROUP.chunkVertices.push( c.vertices )
            } )

            resolve()
        } )
    }

    generateChunkColors () {
        return new Promise( resolve => {
            MAPGROUP.chunkFaces = new Array()

            MAPGROUP.chunks.forEach( ( c, ix ) => {
                c.mesh.geometry.setAttribute( 'color', new engine.m3d.attribute.buffer( 
                    new Float32Array( c.vertices.nonIndexed.length * 3 ), 
                    3 
                ) )
        
                const color = new engine.m3d.color(),
                    colorXYZ = c.mesh.geometry.attributes.color
        
                let tileNum = 0
        
                c.faces.forEach( ( f, ixf ) => {
                    f.isCliff = false
                    f.isCoast = false
                    f.isCrust = false

                    const searchZValues = ( useIndexed ) => {
                        const zValues = new Array()
        
                        if ( useIndexed ) f.vertices.indexed.forEach( v => zValues.push( c.vertices.indexed[ v ].indexes[ 2 ] ) )
                        else f.vertices.nonIndexed.forEach( v => zValues.push( 
                            c.mesh.geometry.attributes.position.array[ c.vertices.nonIndexed[ v ].indexes[ 2 ] ]
                        ) )

                        return zValues
                    }

                    const calcMaxHeight = ( useIndexed = false ) => {
                        const zValues = searchZValues( useIndexed )

                        return Math.max( ...zValues )
                    }

                    const calcMinHeight = ( useIndexed = false ) => {
                        const zValues = searchZValues( useIndexed )

                        return Math.min( ...zValues )
                    }
            
                    const min = calcMinHeight()
                    const max = calcMaxHeight()
        
                    /* get tile that this face belongs to */
                    if ( ixf % 2 == 0 ) {
                        f.tile = tileNum
        
                        tileNum++
                    } else f.tile = tileNum - 1
        
                    /* color this face based upon biomeMap's value */
                    f.biome = MAPGROUP.biomeColorMap[ MAPGROUP.chunkBiomeMaps[ ix ].data[ f.tile * 4 ] ]
        
                    // 0 = tundra
                    // 1 = taiga
                    // 2 = temp grassland
                    // 3 = temp decid forest
                    // 4 = temp conif forest
                    // 5 = sub trop desert
                    // 6 = savanna
                    // 7 = trop seasonal forest
                    // 8 = trop rainforest
        
                    switch ( f.biome ) {
                        case 0:
                            f.terrainColor = 0x8a9488
                            break
                        case 1:
                            f.terrainColor = 0x214010
                            break
                        case 2:
                            f.terrainColor = 0x174000
                            break
                        case 3:
                            f.terrainColor = 0x174000
                            break
                        case 4:
                            f.terrainColor = 0x102e00
                            break
                        case 5:
                            f.terrainColor = 0xeecc44
                            break
                        case 6:
                            f.terrainColor = 0x4a4924
                            break
                        case 7:
                            f.terrainColor = 0x0d2600 // 0xd1a128 tree leaves
                            break
                        case 8:
                            f.terrainColor = 0x0d2600
                            break
                    }
                        
                    /* assign colors based upon the elev of points within face */
                    if ( min >= MAPGROUP.elev.min - 0.3 && min < MAPGROUP.elev.min + 0.75 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = 0x5c5c5c // cliff
                        } else {
                            f.isCoast = true
        
                            f.terrainColor = 0xb8a763 // shore
                        }
                    }
                        
                    if ( min == MAPGROUP.elev.min && max == MAPGROUP.elev.min ) {
                        f.terrainColor = 0x255e6b
                    }

                    if ( max - min >= 1 ) {
                        f.isCliff = true

                        f.terrainColor = 0x3a3a3a
                    }
    
                    if ( min < MAPGROUP.elev.min - 1 ) {
                        f.isCrust = true
    
                        f.terrainColor = 0x452b01
                    }
        
                    color.setHex( f.terrainColor )
        
                    f.vertices.nonIndexed.forEach( v => {
                        colorXYZ.setXYZ( v, color.r, color.g, color.b )
                    } )
                } )

                MAPGROUP.chunkFaces.push( c.faces )
        
                colorXYZ.needsUpdate = true
            } )

            resolve()
        } )
    }

    generateChunkTiles () {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/generators/macromap/tiles.worker.js' )

            MAPGROUP.chunkTiles = new Array()

            worker.postMessage( [ 
                MAPGROUP.chunkFaces,
                MAPGROUP.chunkVertices,
                this.biomes,
                MAPGROUP.size.width,
                MAPGROUP.size.height,
                this.settings.chunk.size
            ] )

            worker.onmessage = e => {
                MAPGROUP.chunks.forEach( ( c, ix ) => {
                    c.tiles = e.data[ 0 ][ ix ]

                    MAPGROUP.chunkTiles.push( c.tiles )
                } )

                MAPGROUP.allTiles = e.data[ 1 ]
                MAPGROUP.chunkFacesRelTiles = e.data[ 2 ]
                MAPGROUP.chunkFaces = e.data[ 3 ]

                MAPGROUP.chunkFaces.forEach( ( cf, ix ) => {
                    MAPGROUP.chunks[ ix ].faces = cf
                } )

                resolve()
            }
        } )
    }

    separateChunkTilesByBiome () {
        return new Promise ( resolve => {
            const worker = new Worker( './scripts/workers/separators/macromap/tbb.worker.js' )

            worker.postMessage( [ 
                MAPGROUP.chunkTiles,
                this.biomes,
                JSON.stringify( this.trees ),
                MAPGROUP.allTiles
            ] )

            worker.onmessage = e => {
                MAPGROUP.chunkTiles = new Array()

                MAPGROUP.chunks.forEach( ( c, ix ) => {
                    c.tilesByBiome = e.data[ 0 ][ ix ]
                    c.waterTiles = e.data[ 1 ][ ix ]
                    c.tiles = e.data[ 2 ][ ix ]

                    MAPGROUP.chunkTiles.push( c.tiles )
                } )

                MAPGROUP.allTiles = e.data[ 3 ]
                MAPGROUP.allTilesByBiome = JSON.parse( e.data[ 4 ] )
                MAPGROUP.allWaterTiles = e.data[ 5 ]

                resolve()
            }
        } )
    }

    generateChunkTreeInstances () {
        return new Promise ( resolve => {
            MAPGROUP.instances.trees = {}

            for ( const b in this.trees ) {
                for ( const h in this.trees[ b ] ) {
                    const trees = []

                    if ( MAPGROUP.allTilesByBiome[ b ] ) {
                        for ( let i = 0; i < MAPGROUP.allTilesByBiome[ b ].length; i++ ) {
                            if ( MAPGROUP.allTiles[ MAPGROUP.allTilesByBiome[ b ][ i ] ].hasTree && 
                                MAPGROUP.allTiles[ MAPGROUP.allTilesByBiome[ b ][ i ] ].treeType && 
                                MAPGROUP.allTiles[ MAPGROUP.allTilesByBiome[ b ][ i ] ].treeType == h 
                            ) {
                                trees.push( MAPGROUP.allTilesByBiome[ b ][ i ] )
                            }
                        }
                    }
                    
                    const uniScale = this.trees[ b ][ h ].uniScale
                    const geometry = this.trees[ b ][ h ].levels[ 0 ].object.children[ 0 ].geometry.clone()
                    const material = this.trees[ b ][ h ].levels[ 0 ].object.children[ 0 ].material

                    if ( !MAPGROUP.instances.trees[ b ] ) MAPGROUP.instances.trees[ b ] = {}
    
                    MAPGROUP.instances.trees[ b ][ h ] = new engine.m3d.mesh.instanced( geometry, material, trees.length )
                    MAPGROUP.instances.trees[ b ][ h ].castShadow = true

                    trees.forEach( ( t, ix ) => {
                        let randomScale = uniScale + engine.math.random.number.between( 0, 0.05 )

                        dummy.position.set( 
                            MAPGROUP.allTiles[ t ].center[ 0 ] + engine.math.random.number.between( -0.25, 0.25 ),
                            MAPGROUP.allTiles[ t ].center[ 2 ] + engine.math.random.number.between( -0.2, 0.1 ),
                            MAPGROUP.allTiles[ t ].center[ 1 ] + engine.math.random.number.between( -0.25, 0.25 )
                        )

                        dummy.rotation.y = engine.m3d.util.math.degToRad( engine.math.random.number.between( -360, 360 ) )

                        dummy.scale.set( randomScale, randomScale, randomScale )

                        switch ( b ) {
                            case 'trop-rain': case 'trop-seasonal': case 'sub-trop-desert':
                                randomScale = 0.035 + engine.math.random.number.between( 0, 0.005 )

                                dummy.rotation.set(
                                    engine.m3d.util.math.degToRad( engine.math.random.number.between( -15, 15 ) ),
                                    engine.m3d.util.math.degToRad( engine.math.random.number.between( -360, 360 ) ),
                                    engine.m3d.util.math.degToRad( engine.math.random.number.between( -15, 15 ) )
                                )

                                break
                        }

                        dummy.scale.set( randomScale, randomScale, randomScale )

                        dummy.castShadow = true
                        dummy.receiveShadow = true

                        dummy.updateMatrix()

                        MAPGROUP.instances.trees[ b ][ h ].setMatrixAt( ix, dummy.matrix )

                        MAPGROUP.chunks[ MAPGROUP.allTiles[ t ].chunkIndex ]
                            .tiles[ MAPGROUP.allTiles[ t ].chunkTileIndex ]
                            .treeInfo = new Array( 
                                b, 
                                h, 
                                ix, 
                                dummy.position.x, 
                                dummy.position.y,
                                dummy.position.z,
                                dummy.rotation.x, 
                                dummy.rotation.y,
                                dummy.rotation.z,
                                dummy.scale.x, 
                                dummy.scale.y,
                                dummy.scale.z
                            )

                        MAPGROUP.instances.trees[ b ][ h ].instanceMatrix.needsUpdate = true
                    } )

                    MAPGROUP.add( MAPGROUP.instances.trees[ b ][ h ] )
                }
            }

            resolve()
        } )
    }

    generateBackground () {
        return new Promise( resolve => {
            const width = MAPGROUP.size.width * 5,
                height = MAPGROUP.size.height * 5,
                gridColor = 0x2b1a06

            const texture = new engine.m3d.loader.texture().load( './assets/backgrounds/paper.1080.seamless.nt.png' )
            texture.wrapS = engine.m3d.repeatWrapping
            texture.wrapT = engine.m3d.repeatWrapping
            texture.repeat.set( 20, 20 )

            MAPGROUP.background = {
                paper: new engine.m3d.mesh.default(
                    new engine.m3d.geometry.buffer.plane( width, height, 1, 1 ),
                    new engine.m3d.mat.mesh.basic( { flatShading: true, map: texture } )
                ),
                grid: new engine.m3d.helper.grid( width, width / 8, gridColor, gridColor ),
            }

            MAPGROUP.background.paper.position.y = -0.6
            MAPGROUP.background.paper.rotation.x = engine.m3d.util.math.degToRad( -90 )

            MAPGROUP.background.grid.position.y = -0.6

            MAPGROUP.add( MAPGROUP.background.paper )
            MAPGROUP.add( MAPGROUP.background.grid )

            resolve()
        } )
    }

    generateWater () {
        return new Promise ( resolve => {
            const worker = new Worker( './scripts/workers/generators/water.worker.module.js', {
                type: 'module'
            } )

            MAPGROUP.waterGeo = [ 
                new engine.m3d.geometry.buffer.plane( 
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width * 2,
                    MAPGROUP.size.width * 2
                ),
                new engine.m3d.geometry.buffer.plane( 
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width * 2,
                    MAPGROUP.size.width * 2
                ),
            ]

            MAPGROUP.water = [
                new engine.m3d.mesh.default(
                    MAPGROUP.waterGeo[ 0 ],
                    new engine.m3d.mat.mesh.phong( { 
                        color: 0x255e6b,
                        flatShading: true, 
                        opacity: 0.7,
                        transparent: true,
                    } )
                ),
                new engine.m3d.mesh.default(
                    MAPGROUP.waterGeo[ 1 ],
                    new engine.m3d.mat.mesh.phong( { 
                        color: 0x255e6b,
                        flatShading: true, 
                        opacity: 0.7,
                        transparent: true,
                    } )
                )
            ]

            MAPGROUP.water[ 0 ].initPositions = []
            MAPGROUP.water[ 0 ].receiveShadow = true
            MAPGROUP.water[ 0 ].rotation.x = engine.m3d.util.math.degToRad( -90 )
            MAPGROUP.water[ 0 ].position.y = 0.15

            MAPGROUP.water[ 1 ].initPositions = []
            MAPGROUP.water[ 1 ].receiveShadow = true
            MAPGROUP.water[ 1 ].rotation.x = engine.m3d.util.math.degToRad( -90 )
            MAPGROUP.water[ 1 ].position.y = 0.25

            MAPGROUP.add( MAPGROUP.water[ 0 ] )
            MAPGROUP.add( MAPGROUP.water[ 1 ] )

            worker.postMessage( [ 
                MAPGROUP.waterGeo[ 0 ].attributes.position.array,
                MAPGROUP.waterGeo[ 1 ].attributes.position.array,
                MAPGROUP.size.width,
                MAPGROUP.size.height
            ] )

            worker.onmessage = e => {
                MAPGROUP.waterGeo[ 0 ].attributes.position.array = e.data[ 0 ]
                MAPGROUP.waterGeo[ 1 ].attributes.position.array = e.data[ 1 ]

                resolve()
            }
        } )
    }

    loadTrees () {
        return new Promise ( resolve => {
            /* load in temperate deciduous trees */ 

            this.loadTreeLOD( 'tundra.tall.darkgreen' ).then( () => {
                this.loadTreeLOD( 'taiga.tall.darkgreen' ).then( () => {
                    this.loadTreeLOD( 'temp-grass.tall.darkgreen' ).then( () => {
                        this.loadTreeLOD( 'temp-decid.tall.darkgreen' ).then( () => {
                            this.loadTreeLOD( 'temp-decid.moderate.darkgreen' ).then( () => {
                                this.loadTreeLOD( 'sub-trop-desert.average.deepgreen' ).then( () => {
                                    this.loadTreeLOD( 'temp-decid.average.darkgreen' ).then( () => {
                                        this.loadTreeLOD( 'trop-seasonal.average.deepgreen' ).then( () => {
                                            this.loadTreeLOD( 'trop-seasonal.average.lightgreen' ).then( () => {
                                                this.loadTreeLOD( 'trop-rain.average.deepgreen' ).then( () => {
                                                    this.loadTreeLOD( 'trop-rain.average.lightgreen' ).then( () => {
                                                        resolve()
                                                    } )
                                                } )
                                            } )
                                        } )
                                    } )
                                } )
                            } )
                        } )
                    } )
                } )
            } )
        } )
    }

    /* read *.mobjx file and export LOD */ 
    loadTreeLOD ( file ) {
        return new Promise ( resolve => {
            engine.file.mystic.retrieve( `./objects/trees/${ file }.mobjx` ).then( data => { // retrieve the data from the file
                m3d.parser.mobjx.parse( data ).then( lod => { // parse the data retrieved from file
                    /* get the tree's info */
                    
                    lod.uniScale = data.lod.uniScale

                    file = file.split( '.' ) // separate the biome and height

                    const biome = file[ 0 ], // retrieve biome
                        height = file[ 1 ] + file[ 2 ] // retrieve height

                    /* export LOD */ 
                    if ( !this.trees[ biome ] ) this.trees[ biome ] = {} // check if the sub-object with the name of the biome exists

                    this.trees[ biome ][ height ] = lod // export LOD to its biome and height

                    resolve()
                } )
            } )
        } )
    }

    separateTilesByBiome () {
        return new Promise ( resolve => {
            const worker = new Worker( './scripts/workers/separators/tbb.worker.js' )

            worker.postMessage( [ 
                MAPGROUP.tiles,
                this.biomes,
                JSON.stringify( this.trees )
            ] )

            worker.onmessage = e => {
                MAPGROUP.tilesByBiome = JSON.parse( e.data[ 0 ] )
                MAPGROUP.waterTiles = e.data[ 1 ]
                MAPGROUP.tiles = e.data[ 2 ]

                resolve()
            }
        } )
    }

    generateFog ( geoParams ) {
        return new Promise( resolve => {
            MAPGROUP.fogMask = []

            const area = geoParams.width * geoParams.height

            for ( let i = 0; i < area; i++ ) MAPGROUP.fogMask.push( 1 )

            if ( area == 250000 ) {
                MAPGROUP.fogMask[ 249498 ] = 0
                MAPGROUP.fogMask[ 249497 ] = 0
                MAPGROUP.fogMask[ 249496 ] = 0

                MAPGROUP.fogMask[ 248998 ] = 0
                MAPGROUP.fogMask[ 248997 ] = 0
                MAPGROUP.fogMask[ 248996 ] = 0

                MAPGROUP.fogMask[ 248498 ] = 0
                MAPGROUP.fogMask[ 248497 ] = 0
                MAPGROUP.fogMask[ 248496 ] = 0
            }
         
            //create a typed array to hold texture data
            const data = new Uint8Array( MAPGROUP.fogMask.length )

            //copy mask into the typed array
            data.set( MAPGROUP.fogMask.map( v => v * 255 ) )

            //create the texture
            const texture = new engine.m3d.texture.data( 
                data, 
                geoParams.width, 
                geoParams.height, 
                engine.m3d.luminanceFormat, 
                engine.m3d.unassigned.byteType 
            )
         
            texture.flipY = true
            texture.wrapS = engine.m3d.clampToEdgeWrapping
            texture.wrapT = engine.m3d.clampToEdgeWrapping

            //it's likely that our texture will not have "power of two" size, meaning that mipmaps are not going to be supported on WebGL 1.0, so let's turn them off
            texture.generateMipmaps = false
         
            texture.magFilter = engine.m3d.linearFilter
            texture.minFilter = engine.m3d.linearFilter
         
            texture.needsUpdate = true
         
            const geometry = new engine.m3d.geometry.buffer.plane( 
                geoParams.width, 
                geoParams.height, 
                geoParams.width, 
                geoParams.height 
            )

            const material = new engine.m3d.mat.mesh.basic( {
                color: 0x000000, 
                alphaMap: texture, 
                transparent: true, 
                opacity:0.9
            } )
        
            // construct a mesh
            MAPGROUP.fog = new engine.m3d.mesh.default( geometry, material ); 

            // add the mesh to the scene
            MAPGROUP.add( MAPGROUP.fog );
        
            MAPGROUP.fog.rotation.x = engine.m3d.util.math.degToRad( -90 )
            MAPGROUP.fog.position.y = 0.3

            resolve()
        } )
    }

    generateSpatialAudio () {
        return new Promise( resolve => {
            const listener = new engine.m3d.audio.listener()
            program.environments.main.camera.add( listener )

            const sound = new engine.m3d.audio.positional( listener )

            // load a sound and set it as the PositionalAudio object's buffer
            const audioLoader = new engine.m3d.loader.audio()
            audioLoader.load( './sounds/environment/seagulls.mp3', function( buffer ) {
	            sound.setBuffer( buffer )
	            sound.setRefDistance( 10 )
                sound.loop = true
                sound.autoplay = true
	            sound.play()
            } )

            MAPGROUP.add( sound )

            resolve()
        } )
    }

    scaleOut ( val, smin, smax, emin, emax ) {
        const tx = ( val - smin ) / ( smax - smin )

        return ( emax - emin ) * tx + emin
    }

    init () {
        return new Promise( resolve => {
            this.generateMacro( this.settings.mult ).then( () => {
                this.generateSpatialAudio().then( () => {
                    this.log.output( 'Map Handler has been initialized' ).reg()

                    resolve()
                } )
            } )
        } )
    }
}

const MAPREP = new Handler_Map()
const MAPGROUP = MAPREP.create() 

export { MAPREP, MAPREP as rep, MAPGROUP, MAPGROUP as group }