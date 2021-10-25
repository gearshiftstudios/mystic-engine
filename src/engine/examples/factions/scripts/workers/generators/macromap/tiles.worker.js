onmessage = e => {
    const classes = {
        tile: class {
            constructor ( face1, face2, vertices, center, biome, isCliff, isCoast ) {
                this.a = face1
                this.b = face2
                this.biome = biome
                this.center = center // [ x, z, y ]
                this.faces = [ face1, face2 ]
                this.vertices = vertices
                this.hasTree = Math.random() >= biomes[ biome ][ 1 ]
                this.isCliff = isCliff
                this.isCoast = isCoast
                this.settlementId = null
            }
        }
    }

    const chunkFaces = e.data[ 0 ],
        chunkVertices = e.data[ 1 ],
        biomes = e.data[ 2 ],
        mapWidth = e.data[ 3 ],
        mapHeight = e.data[ 4 ],
        chunkSize = e.data[ 5 ],

        chunkTiles = new Array()

    chunkFaces.forEach( ( cf, ixcf ) => {
        const tiles = new Array()

        cf.forEach( ( f, ix ) => {     
            if ( ix % 2 == 0 ) {
                const points = [ [], [] ],
    
                face = { 
                    a: [
                        ix,
                        {
                            a: f.vertices.nonIndexed[ 0 ],
                            b: f.vertices.nonIndexed[ 1 ],
                            c: f.vertices.nonIndexed[ 2 ],
                        },
                        f.isCliff,
                        f.isCoast,
                        f.isCrust
                    ], 
                    b: [
                        ix + 1,
                        {
                            a: cf[ ix + 1 ].vertices.nonIndexed[ 0 ],
                            b: cf[ ix + 1 ].vertices.nonIndexed[ 1 ],
                            c: cf[ ix + 1 ].vertices.nonIndexed[ 2 ],
                        },
                        cf[ ix + 1 ].isCliff,
                        cf[ ix + 1 ].isCoast,
                        cf[ ix + 1 ].isCrust
                    ] 
                }
    
                let cliff = false, coast = false, crust = false
    
                if ( face.a[ 2 ] || face.b[ 2 ] ) cliff = true
                if ( face.a[ 3 ] || face.b[ 3 ] ) coast = true
                if ( face.a[ 4 ] || face.b[ 4 ] ) crust = true
    
                for ( const p in face.a[ 1 ] ) points[ 0 ].push( face.a[ 1 ][ p ] )
    
                for ( const p in face.b[ 1 ] ) {
                    if ( !points[ 0 ].includes( face.b[ 1 ][ p ] ) ) points[ 0 ].push( face.b[ 1 ][ p ] )
                }
    
                points[ 1 ].push(
                    (
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 0 ] ].position[ 0 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 1 ] ].position[ 0 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 2 ] ].position[ 0 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 3 ] ].position[ 0 ]
                    ) / 4,
                    -(
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 0 ] ].position[ 1 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 1 ] ].position[ 1 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 2 ] ].position[ 1 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 3 ] ].position[ 1 ]
                    ) / 4,
                    (
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 0 ] ].position[ 2 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 1 ] ].position[ 2 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 2 ] ].position[ 2 ] +
                        chunkVertices[ ixcf ].nonIndexed[ points[ 0 ][ 3 ] ].position[ 2 ]
                    ) / 4
                )
                
                if ( !crust ) {
                    tiles.push( new classes.tile( 
                        face.a[ 0 ], 
                        face.b[ 0 ],
                        [
                            points[ 0 ][ 0 ],
                            points[ 0 ][ 1 ],
                            points[ 0 ][ 2 ],
                            points[ 0 ][ 3 ]
                        ],
                        points[ 1 ], 
                        f.biome,
                        cliff,
                        coast
                    ) )
                }
            }
        } )

        chunkTiles.push( tiles )
    } )

    let ix = 0

    const allTiles = new Array()

    for ( 
        let h = -( ( mapHeight / 2 ) - ( chunkSize / 2 ) ); 
        h < mapHeight / 2; 
        h += chunkSize
    ) {
        for ( 
            let w = -( ( mapWidth / 2 ) - ( chunkSize / 2 ) ); 
            w < mapWidth / 2; 
            w += chunkSize
        ) {
            chunkTiles[ ix ].forEach( t => {
                const cx = w + t.center[ 0 ],
                    cy = h + t.center[ 1 ]

                allTiles.push( new classes.tile(
                    t.a, 
                    t.b,
                    t.vertices,
                    new Array( cx, cy, t.center[ 2 ] ), 
                    t.biome,
                    t.isCliff,
                    t.isCoast
                ) )
            } )

            ix++
        }
    }

    postMessage( [ chunkTiles, allTiles ] )
}