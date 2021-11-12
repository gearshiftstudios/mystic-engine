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
        randomNumber: ( min, max ) => {
            return Math.random() * ( max - min ) + min
        }
    }

    const waterGeo = e.data[ 0 ],
        zGeo = new Array()

    const variation = {
        horizontal: 0.15,
        vertical: 0.05
    }

    const widthSegments = e.data[ 1 ],
        heightSegments = e.data[ 2 ]

    const waterVertices = {
        indexed: new Array(),
        nonIndexed: new Array(),
        positionSortedNI: new Array(),
        simplifiedNI: new Array(),
    }

    let vertex = new classes.vertex(),
        vCount = 0

    waterGeo.forEach( ( v ,ix ) => {
        vertex.indexes.push( ix )
        vertex.position.push( v )

        vCount++

        if ( vCount == 3 ) {
            waterVertices.indexed.push( vertex )

            vCount = 0
                    
            vertex = new classes.vertex()
        }
    } )

    for ( let hpx = 0; hpx <= heightSegments; hpx++ ) {
        for ( let wpx = 0; wpx <= heightSegments; wpx++ ) {
            const n = ( hpx * ( heightSegments + 1 ) + wpx ),
    
            vertex = waterVertices.indexed[ n ],
            x = vertex.indexes[ 0 ],
            y = vertex.indexes[ 1 ],
            z = vertex.indexes[ 2 ]
    
            if ( hpx != 0 &&
            hpx != heightSegments &&
            wpx != 0 &&
            wpx != widthSegments ) {
                waterGeo[ x ] += methods.randomNumber( -variation.horizontal, variation.horizontal ) //jitter x
                waterGeo[ y ] += methods.randomNumber( -variation.horizontal, variation.horizontal ) //jitter y
                waterGeo[ z ] = 0.1 + methods.randomNumber( -variation.vertical, variation.vertical ) //jitter z

                zGeo.push( waterGeo[ x ] )
                zGeo.push( waterGeo[ y ] )
                zGeo.push( waterGeo[ z ] )
            } else {
                waterGeo[ z ] = 0.1

                zGeo.push( null )
                zGeo.push( null )
                zGeo.push( null )
            }
        }
    }

    console.log( waterGeo.length )
    console.log( zGeo.length )

    postMessage( [ zGeo ] )
}