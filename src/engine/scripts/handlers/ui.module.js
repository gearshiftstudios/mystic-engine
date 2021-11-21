import { Handler } from '../handler.module.js'
import * as engine from '../mystic.module.js'

const cursors = {
    examples: [
        [ 'arrow.standard.32', 'auto.standard' ],
        {
            path: '../../../assets/cursors/metal/',
            format: 'png',
        }
    ],
}

class Hanlder_UI extends Handler {
    constructor ( category ) {
        super( category )

        const scope = this
        
        this.cursors = {
            list: {},

            class: class {
                constructor ( image, x = 0, y =0 ) {
                    this.image = image
                    this.x = x
                    this.y = y
                }
            },

            load: function ( image, name = '', x = 0, y = 0 ) {
                return new Promise( resolve => {
                    if ( image ) {
                        if ( typeof name == 'string' && name.length > 0 ) {
                            this.list[ name ] = new this.class( image, x, y )

                            resolve()
                        }
                    }
                } )
            },
            multiload: function () {
                return new Promise( resolve => {
                    if ( arguments.length > 0 ) {
                        let path = '',
                            format = ''

                        if ( arguments.length > 1 ) {
                            if ( typeof arguments[ arguments.length - 1 ] == 'object' ) {
                                const options = arguments[ arguments.length - 1 ]

                                if ( options.path ) path = options.path
                                if ( options.format ) format = `.${ options.format }`
                            }
                        }

                        for ( let i = 0; i < arguments.length; i++ ) {
                            if ( 
                                Array.isArray( arguments[ i ] ) && 
                                arguments[ i ].length > 0 
                            ) {
                                this.load(
                                    path + arguments[ i ][ 0 ] + format,
                                    arguments[ i ][ 1 ] ? arguments[ i ][ 1 ] : '',
                                    arguments[ i ][ 2 ] ? arguments[ i ][ 2 ] : 0,
                                    arguments[ i ][ 3 ] ? arguments[ i ][ 3 ] : 0
                                )
                            }
                        }
                    } 

                    resolve()
                } )
            },
            reset: function () {
                if ( Object.keys( this.list ).length > 0 ) {
                    this.set( Object.keys( this.list )[ 0 ] )
                } else document.body.style.cursor = 'auto'
            },
            set: function ( name ) {
                return new Promise( resolve => {
                    if ( name ) {
                        if ( this.list[ name ] ) {
                            const picked = this.list[ name ]
    
                            document.body.style.cursor = `url( ${ picked.image } ) ${ picked.x } ${ picked.y }, auto`
                        }
                    } else {
                        const firstFound = this.list[ Object.keys( this.list )[ 0 ] ]
    
                        document.body.style.cursor = `url( ${ firstFound.image } ) ${ firstFound.x } ${ firstFound.y }, auto`
                    }

                    resolve()
                } )
            }
        }
    }

    append ( element ) {
        return new Promise( resolve => {
            if ( element.isNewElement ) {
                element.parent.appendChild( element )

                resolve( element )
            }
        } )
    }

    createElement ( 
        tag = 'div', 
        parent = document.body, 
        id = `${ tag }.${ engine.math.random.characters().mixed() }`, 
        style = {} 
    ) {
        return new Promise( resolve => {
            const element = document.createElement( tag )
            element.id = id
            element.parent = parent
            element.isNewElement = true

            for ( const s in style ) {
                element.style[ s ] = style[ s ]

                console.log(  )
            }

            resolve( element )
        } )
    }

    createTextbox (
        text = 'Hello World!',
        scrollLeft = false,
        parent = document.body, 
        id = `textbox.${ engine.math.random.characters().mixed() }`,
        style = {}
    ) {
        return new Promise( resolve => {
            this.createElement( 'textbox', parent, id, style ).then( element => {
                element.insert( text )

                element.style.backgroundColor = '#212121'
                element.style.borderRadius = '5px'

                if ( !scrollLeft ) {
                    element.style.overflowX = 'hidden'
                    element.style.overflowY = 'auto'
                } else {
                    element.style.overflowX = 'auto'
                    element.style.overflowY = 'hidden'
                }

                resolve( element )
            } )
        } )
    }

    createTextboxABS (
        text = 'Hello World!',
        orientation = 'lt',
        scrollLeft = false,
        parent = document.body, 
        id = `textbox.${ engine.math.random.characters().mixed() }`,
        style = {}
    ) {
        return new Promise( resolve => {
            this.createTextbox( text, scrollLeft, parent, id, style ).then( element => {
                element.style.position = 'absolute'

                switch ( orientation ) {
                    case 'lb':
                        element.style.left = '0'
                        element.style.bottom = '0'
                        break
                    case 'lt':
                        element.style.left = '0'
                        element.style.top = '0'
                        break
                    case 'rb':
                        element.style.right = '0'
                        element.style.bottom = '0'
                        break
                    case 'rt':
                        element.style.right = '0'
                        element.style.top = '0'
                        break
                }

                resolve( element )
            } )
        } )
    }
}

export { Hanlder_UI as handler, cursors }