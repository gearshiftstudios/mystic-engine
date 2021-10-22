import { Handler } from '../handler.module.js'

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

                        console.log( this.list )
                    } 

                    resolve()
                } )
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
}

export { Hanlder_UI as handler }