import * as engine from '../../../../../scripts/mystic.module.js'

onmessage = e => {
    const classes = {
        vertex: class {
            constructor () {
                this.indexes = new Array()
                this.position = new Array()
                this.surface = false
            }
        }
    }

    const waterGeo = {
        0: e.data[ 0 ],
        1: e.data[ 1 ]
    }

    const heightMapWidth = e.data[ 2 ]
    const heightMapHeight = e.data[ 3 ]

    const waterVertices = {
        indexed: new Array(),
        nonIndexed: new Array(),
        positionSortedNI: new Array(),
        simplifiedNI: new Array(),
    }

    for ( const w in waterGeo ) {
        let count = 0

        let vertex = new classes.vertex(),
            vCount = 0

        waterGeo[ w ].forEach( ( v ,ix ) => {
            vertex.indexes.push( ix )
            vertex.position.push( v )

            vCount++

            if ( vCount == 3 ) {
                waterVertices.indexed.push( vertex )

                vCount = 0
                    
                vertex = new classes.vertex()
            }
        } )

        for ( let i = 0; i < waterGeo[ w ].length; i++ ) {
            count++

            if ( count < 3 ) waterGeo[ w ][ i ] += engine.math.random.number.between( -0.35, 0.35 )
            if ( count == 3 ) waterGeo[ w ][ i ] += engine.math.random.number.between( -0.15, 0.15 )
        }

        for ( let hpx = 0; hpx < heightMapHeight; hpx++ ) {
            for ( let wpx = 0; wpx < heightMapWidth; wpx++ ) {
                const n = ( hpx * ( heightMapHeight ) + wpx ),
    
                vertex = waterVertices.indexed[ n ],
                x = vertex.indexes[ 0 ],
                y = vertex.indexes[ 1 ],
                z = vertex.indexes[ 2 ]
    
                if ( hpx != 0 &&
                hpx != heightMapHeight - 1 &&
                wpx != 0 &&
                wpx != heightMapWidth - 1 ) {
                    waterGeo[ w ][ x ] += engine.math.random.number.between( -0.35, 0.35 ) //jitter y
                    waterGeo[ w ][ y ] += engine.math.random.number.between( -0.35, 0.35 ) //jitter x
                    waterGeo[ w ][ z ] += engine.math.random.number.between( -0.15, 0.15 ) //jitter y
                }
    
                vertex.position[ 0 ] = waterGeo[ w ][ x ]
                vertex.position[ 1 ] = waterGeo[ w ][ y ]
                vertex.position[ 2 ] = waterGeo[ w ][ z ]
            }
        }
    }

    postMessage( [ 
        waterGeo[ 0 ],
        waterGeo[ 1 ]
    ] )
}