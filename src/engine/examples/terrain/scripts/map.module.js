import * as engine from '../../../scripts/rep.module.js'
import * as m3d from '../../../scripts/m3d/rep.module.js'
import * as animator from '../../../scripts/libs/gsap/gsap.module.js'
import { noise } from '../../../scripts/libs/perlin.module.js'

import { handler_chunk } from './chunks.module.js'

class Handler_Map {
    constructor () {
        const scope = this

        this.fogVisible = false
        this.trees = {}

        this.biomes = [
            [ 'tundra', 0.99 ],
            [ 'taiga', 0.5 ],
            [ 'temp-grass', 0.99 ],
            ['temp-decid', 0.75 ],
            [ 'temp-conif', 0.75 ],
            [ 'sub-trop-desert', 0.99 ],
            [ 'savanna', 0.25 ],
            [ 'trop-seasonal', 0.75 ],
            [ 'trop-rain', 0.5 ],
        ]

        this.settings = {
            size: {
                width: 500,
                height: 500,
            }
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
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return Math.max( ...zValues )
            }
        
            calcMinHeight ( useIndexed ) {
                const zValues = new Array()
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return Math.min( ...zValues )
            }
        
            calcAvgHeight ( useIndexed ) {
                const zValues = new Array()
        
                if ( useIndexed ) this.vertices.indexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.indexed[ v ].position[ 2 ] ) )
                else this.vertices.nonIndexed.forEach( v => zValues.push( MAPGROUP.mesh.vertices.nonIndexed[ v ].position[ 2 ] ) )
        
                return ( zValues[ 0 ] + zValues[ 1 ] + zValues[ 2 ] ) / 3
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

    generateMacro () {
        const mult = MAPGROUP.size.width == 250 ? 2 :
            MAPGROUP.size.width == 500 ? 2.5 :
            MAPGROUP.size.width == 750 ? 2.75 :
            MAPGROUP.size.width == 1000 ? 3 : 3

        this.generateValues( 
            mult, 
            mult, 
            0.6, 
            'none',
            MAPGROUP.size.width, 
            MAPGROUP.size.width, 
            0.5
        ).then( values => {
            this.regenerate( values.heightMap, values.biomeMap ).then( data => {
                this.createMesh( data.width, data.height, data.heightMap, data.biomeMap ).then( geoParams => {
                    this.generateFog( geoParams ).then( () => {
                        this.generatePeaks( geoParams ).then( () => {
                            this.generateFaces().then( () => {
                                this.generateColors( geoParams ).then( () => {
                                    this.loadTrees().then( () => {
                                        this.generateTiles().then( () => {
                                            this.separateTilesByBiome().then( () => {
                                                this.generateTreeInstances().then( () => {
                                                    this.generateWater( geoParams ).then( () => {
                                                        this.animateWater()

                                                        MAPGROUP.fog.geometry.attributes.position.needsUpdate = true
                                                        MAPGROUP.fog.visible = false

                                                        MAPGROUP.water.geometry.attributes.position.needsUpdate = true

                                                        MAPGROUP.animateWater = true
                                                        MAPGROUP.initialized = true
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

    generateTiles () {
        return new Promise ( resolve => {
            const worker = new Worker( './scripts/workers/generators/tiles.worker.js' )

            worker.postMessage( [ 
                MAPGROUP.mesh.faces,
                JSON.stringify( MAPGROUP.mesh.vertices ),
                this.biomes
            ] )

            worker.onmessage = e => {
                MAPGROUP.tiles = e.data[ 0 ]

                resolve()
            }
        } )
    }

    generateTreeInstances () {
        return new Promise ( resolve => {
            MAPGROUP.instances.trees = {}

            const dummy = new engine.m3d.object3D()

            for ( const b in this.trees ) {
                for ( const h in this.trees[ b ] ) {
                    const trees = []

                    for ( let i = 0; i < MAPGROUP.tilesByBiome[ b ].length; i++ ) {
                        if ( MAPGROUP.tiles[ MAPGROUP.tilesByBiome[ b ][ i ] ].hasTree && 
                            MAPGROUP.tiles[ MAPGROUP.tilesByBiome[ b ][ i ] ].treeType && 
                            MAPGROUP.tiles[ MAPGROUP.tilesByBiome[ b ][ i ] ].treeType == h 
                        ) {
                            trees.push( MAPGROUP.tilesByBiome[ b ][ i ] )
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
                            MAPGROUP.tiles[ t ].center[ 0 ] + engine.math.random.number.between( -0.25, 0.25 ), 
                            MAPGROUP.tiles[ t ].center[ 2 ] + engine.math.random.number.between( -0.2, 0.1 ), 
                            -MAPGROUP.tiles[ t ].center[ 1 ] + engine.math.random.number.between( -0.25, 0.25 )
                        )

                        dummy.rotation.y = engine.m3d.util.math.degToRad( engine.math.random.number.between( -360, 360 ) )

                        dummy.scale.set( randomScale, randomScale, randomScale )

                        switch ( b ) {
                            case 'trop-rain': case 'sub-trop-desert':
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

                        MAPGROUP.instances.trees[ b ][ h ].instanceMatrix.needsUpdate = true
                    } )

                    MAPGROUP.add( MAPGROUP.instances.trees[ b ][ h ] )
                }
            }

            resolve()
        } )
    }

    generateWater ( geoParams ) {
        return new Promise ( resolve => {
            const worker = new Worker( './scripts/workers/generators/water.worker.module.js', {
                type: 'module'
            } )

            MAPGROUP.waterGeo = [ 
                new engine.m3d.geometry.buffer.plane( 
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width
                ),
                new engine.m3d.geometry.buffer.plane( 
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width,
                    MAPGROUP.size.width
                ),
            ]

            MAPGROUP.water = new engine.m3d.mesh.default(
                MAPGROUP.waterGeo[ 0 ],
                new engine.m3d.material.mesh.phong( { 
                    color: 0x08302f,
                    flatShading: true, 
                    opacity: 0.7,
                    transparent: true,
                } )
            )

            MAPGROUP.water.initPositions = []
            MAPGROUP.water.receiveShadow = true
            MAPGROUP.water.rotation.x = engine.m3d.util.math.degToRad( -90 )
            MAPGROUP.water.position.y = 0.15

            MAPGROUP.add( MAPGROUP.water )

            worker.postMessage( [ 
                MAPGROUP.waterGeo[ 0 ].attributes.position.array,
                MAPGROUP.waterGeo[ 1 ].attributes.position.array,
                geoParams.heightMap.width,
                geoParams.heightMap.height
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
                    this.loadTreeLOD( 'temp-decid.tall.darkgreen' ).then( () => {
                        this.loadTreeLOD( 'temp-decid.moderate.darkgreen' ).then( () => {
                            this.loadTreeLOD( 'temp-decid.moderate.orange' ).then( () => {
                                this.loadTreeLOD( 'temp-decid.moderate.yellow' ).then( () => {
                                    this.loadTreeLOD( 'sub-trop-desert.average.deepgreen' ).then( () => {
                                        this.loadTreeLOD( 'temp-decid.average.darkgreen' ).then( () => {
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

            console.log( this.trees )

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

    regenerate ( heightMap, biomeMap ) {
        return new Promise( resolve => {
            if ( MAPGROUP.instances.trees ) {
                for ( const t in MAPGROUP.instances.trees ) {
                    for ( const _t in MAPGROUP.instances.trees[ t ] ) {
                        MAPGROUP.remove( MAPGROUP.instances.trees[ t ][ _t ] )
                    }
                }
            }

			if ( MAPGROUP.mesh != null ) MAPGROUP.remove( MAPGROUP.mesh )
            if ( MAPGROUP.fog != null ) MAPGROUP.remove( MAPGROUP.fog )

			MAPGROUP.mesh = null
            MAPGROUP.fog = null

            if ( MAPGROUP.water != null ) {
                MAPGROUP.remove( MAPGROUP.water )

                if ( this.timelines.water != null ) {
                    this.timelines.water.kill()
                    this.timelines.water = null
                }
            }

            const data = {
                width: MAPGROUP.size.width,
                height: MAPGROUP.size.height,
                heightMap: heightMap,
                biomeMap: biomeMap,
            }

			resolve( data )
        } )
    }

    createMesh ( width, height, heightMap, biomeMap ) {
        return new Promise( resolve => {
            const geoParams = {
                width: width,
                height: height,
                heightMap: heightMap,
                biomeMap: biomeMap,
            }

            MAPGROUP.mesh = new engine.m3d.mesh.default(
                new engine.m3d.geometry.buffer.plane( 
                    geoParams.width,
                    geoParams.height,
                    geoParams.width,
                    geoParams.height
                ),
                new engine.m3d.material.mesh.standard( {
                    flatShading: true,
                    vertexColors: engine.m3d.vertexColors,
                } )
            )
            
            MAPGROUP.mesh.castShadow = true
            MAPGROUP.mesh.receiveShadow = true
            MAPGROUP.mesh.rotation.x = engine.m3d.util.math.degToRad( -90 )
            MAPGROUP.mesh.geometry.attributes.position.needsUpdate = true

            MAPGROUP.add( MAPGROUP.mesh )

            resolve( geoParams )
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

            const material = new engine.m3d.material.mesh.basic( {
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

    generatePeaks ( geoParams ) {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/generators/peaks.worker.js' )

            worker.postMessage( [ 
                MAPGROUP.mesh.geometry.attributes.position.array,
                geoParams.heightMap.data,
                geoParams.heightMap.width,
                geoParams.heightMap.height,
                MAPGROUP.elev.min,
                MAPGROUP.elev.max
            ] )

            worker.onmessage = e => {
                MAPGROUP.mesh.geometry.attributes.position.array = e.data[ 0 ]
                MAPGROUP.fog.geometry.attributes.position.array = e.data[ 0 ]
                MAPGROUP.mesh.vertices = JSON.parse( e.data[ 1 ] )

                resolve()
            }
        } )
    }

    generateCrust( geoParams ) {
        return new Promise( resolve => {
            MAPGROUP.mesh.vertices.indexed.forEach( v => {
                if ( !v.surface ) {
                    v.position[ 2 ] = -10
                    if ( v.position[ 0 ] == geoParams.width / 2 ) v.position[ 0 ] = ( geoParams.width / 2 ) - 1
                    if ( v.position[ 1 ] == geoParams.height / 2 ) v.position[ 1 ] = ( geoParams.height / 2 ) - 1
                    if ( v.position[ 0 ] == - ( geoParams.width / 2 ) ) v.position[ 0 ] = - ( geoParams.width / 2 ) + 1
                    if ( v.position[ 1 ] == - ( geoParams.height / 2 ) ) v.position[ 1 ] =  - ( geoParams.height / 2 ) + 1
    
                    v.indexes.forEach( ( i, index ) => MAPGROUP.mesh.geometry.attributes.position.array[ i ] = v.position[ index ] )
                }
            } )

            resolve()
        } ) 
    }

    generateFaces () {
        return new Promise( resolve => {
            MAPGROUP.mesh.faces = new Array()

        let face = new this.face(),
        indexedCount = 0,
        nonIndexedCount = 0,
        faceCount = 0

        MAPGROUP.mesh.geometry.index.array.forEach( v => {
            face.vertices.indexed.push( v )

            indexedCount++

            if ( indexedCount == 3 ) {
                MAPGROUP.mesh.faces.push( face )

                indexedCount = 0
                
                face = new this.face()
            }
        } )

        const vertices_copy = MAPGROUP.mesh.vertices,
        faces_copy = MAPGROUP.mesh.faces

        let newGeo = MAPGROUP.mesh.geometry.toNonIndexed()

        MAPGROUP.mesh.geometry = newGeo
        MAPGROUP.mesh.vertices = vertices_copy
        MAPGROUP.mesh.faces = faces_copy

        let vertex = new this.vertex(),
            count = 0

        MAPGROUP.mesh.geometry.attributes.position.array.forEach( ( v, index ) => {
            vertex.indexes.push( index )
            vertex.position.push( v )

            count++

            if ( count == 3 ) {
                MAPGROUP.mesh.vertices.nonIndexed.push( vertex )

                count = 0
                
                vertex = new this.vertex()
            }
        } )

        MAPGROUP.mesh.vertices.nonIndexed.forEach( ( v, index ) => {
            MAPGROUP.mesh.faces[ faceCount ].vertices.nonIndexed.push( index )

            nonIndexedCount++

            if ( nonIndexedCount == 3 ) {
                nonIndexedCount = 0

                faceCount++
            }
        } )

        resolve()
        } )
    }

    generateColors ( geoParams ) {
        return new Promise( resolve => {
            MAPGROUP.mesh.geometry.setAttribute( 'color', new engine.m3d.attribute.buffer( 
                new Float32Array( MAPGROUP.mesh.vertices.nonIndexed.length * 3 ), 
                3 
            ) )
    
            const color = new engine.m3d.color(),
                colorXYZ = MAPGROUP.mesh.geometry.attributes.color
    
            let tileNum = 0
    
            MAPGROUP.mesh.faces.forEach( ( f, ixf ) => {
                f.isCliff = false
                f.isCoast = false
        
                const min = f.calcMinHeight( false )
                const max = f.calcMaxHeight( false )
    
                /* get tile that this face belongs to */
                if ( ixf % 2 == 0 ) {
                    f.tile = tileNum
    
                    tileNum++
                } else f.tile = tileNum - 1
    
                /* color this face based upon biomeMap's value */
                f.biome = geoParams.biomeMap[ f.tile ]
    
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
                        f.terrainColor = 0x29751a // 0xd1a128 tree leaves
                        break
                    case 8:
                        f.terrainColor = 0x0d2600
                        break
                }
                    
                /* assign colors based upon the elev of points within face */
                if ( min >= MAPGROUP.elev.min && min < MAPGROUP.elev.min + 0.75 ) {
                    if ( f.biome == 0 ) {
                        f.isCliff = true
    
                        f.terrainColor = 0x5c5c5c // cliff
                    } else {
                        f.isCoast = true
    
                        f.terrainColor = 0xb8a763 // shore
                    }
                }
    
                if ( max >= MAPGROUP.elev.min + 7.5 && min < MAPGROUP.elev.min + 7.5 ) {
                    f.isCliff = true
    
                    f.terrainColor = 0x452b01 // mesa-side
                }
                    
                if ( min == MAPGROUP.elev.min && max == MAPGROUP.elev.min ) {
                    f.terrainColor = 0xb8a763
                }
    
                color.setHex( f.terrainColor )
    
                f.vertices.nonIndexed.forEach( v => {
                    colorXYZ.setXYZ( v, color.r, color.g, color.b )
                } )
            } )
    
            colorXYZ.needsUpdate = true

            resolve()
        } )
    }

    scaleOut ( val, smin, smax, emin, emax ) {
        const tx = ( val - smin ) / ( smax - smin )

        return ( emax - emin ) * tx + emin
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