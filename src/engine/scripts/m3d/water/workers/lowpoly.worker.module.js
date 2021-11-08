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
        randomNumber: ( min, max, floor ) => {
            const _floor = !floor ? false : ( typeof floor == 'boolean' ) ? floor : false

            switch ( _floor ) {
                case true:
                    return Math.floor( Math.random() * ( max - min ) + min )
                    break
                case false:
                    return Math.random() * ( max - min ) + min
                    break
            }
        }
    }

    const waterGeo = {
        0: e.data[ 0 ],
        1: e.data[ 1 ]
    }

    const variation = {
        horizontal: 0.15,
        vertical: 0.05
    }

    const widthSegments = e.data[ 2 ],
        heightSegments = e.data[ 3 ]
        

    const waterVertices = {
        indexed: new Array(),
        nonIndexed: new Array(),
        positionSortedNI: new Array(),
        simplifiedNI: new Array(),
    }

    for ( const w in waterGeo ) {
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
                    waterGeo[ w ][ x ] += methods.randomNumber( -variation.horizontal, variation.horizontal ) //jitter x
                    waterGeo[ w ][ y ] += methods.randomNumber( -variation.horizontal, variation.horizontal ) //jitter y

                    if ( w == 0 ) waterGeo[ w ][ z ] = 0.05 + methods.randomNumber( -variation.vertical, variation.vertical ) //jitter z
                    else waterGeo[ w ][ z ] = 0.15 + methods.randomNumber( -variation.vertical, variation.vertical ) //jitter z
                } else {
                    waterGeo[ w ][ z ] = 0.1
                }
            }
        }
    }

    postMessage( [ 
        waterGeo[ 0 ],
        waterGeo[ 1 ]
    ] )
}