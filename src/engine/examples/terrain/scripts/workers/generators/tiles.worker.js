onmessage = e => {
    const classes = {
        tile: class {
            constructor ( face1, face2, vertices, center, biome, isCliff, isCoast ) {
                this.a = face1
                this.b = face2
                this.biome = biome
                this.center = center // [ x, y ]
                this.faces = [ face1, face2 ]
                this.vertices = vertices
                this.hasTree = Math.random() >= biomes[ biome ][ 1 ]
                this.isCliff = isCliff
                this.isCoast = isCoast
            }
        }
    }

    const faces = e.data[ 0 ],
        vertices = JSON.parse( e.data[ 1 ] ),
        biomes = e.data[ 2 ],

        tiles = new Array()

    faces.forEach( ( f, ix ) => {
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
                    f.isCoast
                ], 
                b: [
                    ix + 1,
                    {
                        a: faces[ ix + 1 ].vertices.nonIndexed[ 0 ],
                        b: faces[ ix + 1 ].vertices.nonIndexed[ 1 ],
                        c: faces[ ix + 1 ].vertices.nonIndexed[ 2 ],
                    },
                    faces[ ix + 1 ].isCliff,
                    faces[ ix + 1 ].isCoast
                ] 
            }

            let cliff = false, coast = false

            if ( face.a[ 2 ] || face.b[ 2 ] ) cliff = true
            if ( face.a[ 3 ] || face.b[ 3 ] ) coast = true

            for ( const p in face.a[ 1 ] ) points[ 0 ].push( face.a[ 1 ][ p ] )

            for ( const p in face.b[ 1 ] ) {
                if ( !points[ 0 ].includes( face.b[ 1 ][ p ] ) ) points[ 0 ].push( face.b[ 1 ][ p ] )
            }

            points[ 1 ].push(
                (
                    vertices.nonIndexed[ points[ 0 ][ 0 ] ].position[ 0 ] +
                    vertices.nonIndexed[ points[ 0 ][ 1 ] ].position[ 0 ] +
                    vertices.nonIndexed[ points[ 0 ][ 2 ] ].position[ 0 ] +
                    vertices.nonIndexed[ points[ 0 ][ 3 ] ].position[ 0 ]
                ) / 4,
                (
                    vertices.nonIndexed[ points[ 0 ][ 0 ] ].position[ 1 ] +
                    vertices.nonIndexed[ points[ 0 ][ 1 ] ].position[ 1 ] +
                    vertices.nonIndexed[ points[ 0 ][ 2 ] ].position[ 1 ] +
                    vertices.nonIndexed[ points[ 0 ][ 3 ] ].position[ 1 ]
                ) / 4,
                (
                    vertices.nonIndexed[ points[ 0 ][ 0 ] ].position[ 2 ] +
                    vertices.nonIndexed[ points[ 0 ][ 1 ] ].position[ 2 ] +
                    vertices.nonIndexed[ points[ 0 ][ 2 ] ].position[ 2 ] +
                    vertices.nonIndexed[ points[ 0 ][ 3 ] ].position[ 2 ]
                ) / 4
            )

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
    } )

    postMessage( [ tiles ] )
}