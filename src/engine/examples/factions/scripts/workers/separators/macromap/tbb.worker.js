onmessage = e => {
    const chunkTiles = e.data[ 0 ],
        biomes = e.data[ 1 ],
        trees = JSON.parse( e.data[ 2 ] )

        const tilesChunksByBiome = new Array(),
            waterChunksTiles = new Array()

        chunkTiles.forEach( tx => {
            const tilesByBiome = {},
                waterTiles = new Array()

            tx.forEach( ( t, ix ) => {
                if ( !tilesByBiome[ biomes[ t.biome ][ 0 ] ] ) tilesByBiome[ biomes[ t.biome ][ 0 ] ] = []
            
                if ( t.center[ 2 ] > 0 ) {
                    if ( !t.isCliff && !t.isCoast ) {
                        if ( t.hasTree && trees[ biomes[ t.biome ][ 0 ] ] ) {
                            t.treeType = Object.keys( trees[ biomes[ t.biome ][ 0 ] ] )[ Math.floor( 
                                Math.random() * Object.keys( trees[ biomes[ t.biome ][ 0 ] ] ).length
                            ) ]
                        }
            
                        tilesByBiome[ biomes[ t.biome ][ 0 ] ].push( ix )
                    }
                } else waterTiles.push( ix )
            } )

            tilesChunksByBiome.push( tilesByBiome )
            waterChunksTiles.push( waterTiles )
        } )

    postMessage( [ 
        tilesChunksByBiome,
        waterChunksTiles,
        chunkTiles
    ] )
}