import { Handler } from '../handler.module.js'

class Hanlder_Canvas extends Handler {
    constructor ( category ) {
        super( category )

        
    }

    create ( parentElement, attributes ) {
        const _parentElement = !parentElement ? document.body : 
            parentElement.isDOMElement ? parentElement : document.body,

        canvas = document.createElement( 'canvas' )

        if ( attributes != void 0 ) {
            if ( typeof attributes == 'object' )
                for ( const a in attributes ) canvas.setAttribute( a, attributes[ a ] )
        } else {
            if ( arguments.length > 0 ) {
                if ( !arguments[ 0 ].isDOMElement && typeof arguments[ 0 ] == 'object' ) 
                    for ( const a in arguments[ 0 ] ) canvas.setAttribute( a, arguments[ 0 ][ a ] )
            }
        }

        /* fix shorten attribute anomoly */
        if ( canvas.hasAttribute( 'shorten' ) ) canvas.removeAttribute( 'shorten' )

        _parentElement.appendChild( canvas )

        return {
            ready: callback => {
                const content = canvas.getContext( '2d' )

                if ( callback && typeof callback == 'function' ) callback( canvas, content )
            },
            retrieve: () => {
                return canvas 
            },
        }
    }
}

export { Hanlder_Canvas as handler }