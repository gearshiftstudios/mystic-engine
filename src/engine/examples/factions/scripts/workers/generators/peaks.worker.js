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
    
    const methods = {
        scaleOut: ( val, smin, smax, emin, emax ) => {
            const tx = ( val - smin ) / ( smax - smin )
    
            return ( emax - emin ) * tx + emin
        }
    }

    const bufferVertices = e.data[ 0 ],
        heightMapData = e.data[ 1 ],
        heightMapWidth = e.data[ 2 ],
        heightMapHeight = e.data[ 3 ],
        elevMin = e.data[ 4 ],
        elevMax = e.data[ 5 ],

        mapVertices = {
            indexed: new Array(),
            nonIndexed: new Array(),
            positionSortedNI: new Array(),
            simplifiedNI: new Array(),
        }

    let vertex = new classes.vertex(),
        count = 0

    bufferVertices.forEach( ( v ,ix ) => {
        vertex.indexes.push( ix )
        vertex.position.push( v )

        count++

        if ( count == 3 ) {
           mapVertices.indexed.push( vertex )

            count = 0
                    
            vertex = new classes.vertex()
        }
    } )

    for ( let hpx = 0; hpx < heightMapHeight; hpx++ ) {
        for ( let wpx = 0; wpx < heightMapWidth; wpx++ ) {
            const n = ( hpx * ( heightMapHeight ) + wpx ),
            col = heightMapData[ n * 4 ], // the red channel

            vertex = mapVertices.indexed[ n ],
            x = vertex.indexes[ 0 ],
            y = vertex.indexes[ 1 ],
            z = vertex.indexes[ 2 ]

            vertex.surface = true

            bufferVertices[ z ] = methods.scaleOut( col, 0, 255, elevMin, elevMax )

            if (
                hpx == 0 ||
                hpx == heightMapHeight - 1 ||
                wpx == 0 ||
                wpx == heightMapWidth - 1
            ) vertex.surface = false

            if ( bufferVertices[ z ] > elevMin ) {
                if ( bufferVertices[ z ] >= elevMin + 7.5 ) {
                    bufferVertices[ z ] += methods.scaleOut( Math.random(), 0, 1, 1.3, 1.7 )
                }

                if ( hpx != 0 &&
                    hpx != heightMapHeight - 1 &&
                    wpx != 0 &&
                    wpx != heightMapWidth - 1 &&
                    hpx != 1 &&
                    hpx != heightMapHeight - 2 &&
                    wpx != 1 &&
                    wpx != heightMapWidth - 2     
                ) {
                    bufferVertices[ x ] += methods.scaleOut( Math.random(), 0, 1, -0.25, 0.25 ) //jitter x
                    bufferVertices[ y ] += methods.scaleOut( Math.random(), 0, 1, -0.25, 0.25 ) //jitter y
                }
            } else {
                if (
                    hpx == 2 ||
                    hpx == heightMapHeight - 3 ||
                    wpx == 2 ||
                    wpx == heightMapWidth - 3
                ) bufferVertices[ z ] = elevMin - 0.15

                if (
                    hpx == 1 ||
                    hpx == heightMapHeight - 2 ||
                    wpx == 1 ||
                    wpx == heightMapWidth - 2
                ) bufferVertices[ z ] = elevMin + 0.15
            }

            vertex.position[ 0 ] = bufferVertices[ x ]
            vertex.position[ 1 ] = bufferVertices[ y ]
            vertex.position[ 2 ] = bufferVertices[ z ]
        }
    }

    postMessage( [ 
        bufferVertices,
        JSON.stringify( mapVertices )
    ] )
}