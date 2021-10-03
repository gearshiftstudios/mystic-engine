import { Handler } from '../handler.module.js'

class Hanlder_Math extends Handler {
    constructor ( category ) {
        super( category )

		this.parse = item => { return JSON.parse( item ) }
		this.stringify = item => { return JSON.stringify( item ) }

        this.isWhole = n => {
            const result = (n - Math.floor( n ) ) !== 0

            if ( result ) return false
            else return true
        }

        this.random = {
            number: {
                between: ( min, max, floor ) => {
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
            },
            color: {
                rgb: ( isForThreeD, returnSingleValue, floorValues ) => {
                    const _isForThreeD = !isForThreeD ? false : ( typeof isForThreeD == 'boolean' ) ? isForThreeD : false,
                    _returnSingleValue = !returnSingleValue ? false : ( typeof returnSingleValue == 'boolean' ) ? returnSingleValue : false,
                    _floorValues = !floorValues ? true : ( typeof floorValues == 'boolean' ) ? floorValues : true

                    switch ( _returnSingleValue ) {
                        case false:
                            switch ( _isForThreeD ) {
                                case false:
                                    return [
                                        this.random.number.between( 0, 255, _floorValues ), 
                                        this.random.number.between( 0, 255, _floorValues ), 
                                        this.random.number.between( 0, 255, _floorValues )
                                    ]

                                    break
                            
                                case true:
                                    return [
                                        this.random.number.between( 0, 1 ), 
                                        this.random.number.between( 0, 1 ), 
                                        this.random.number.between( 0, 1 )
                                    ]

                                    break
                            }

                            break
                        case true:
                            switch ( _isForThreeD ) {
                                case false:
                                    return this.random.number.between( 0, 255, _floorValues )
                                    break
                            
                                case true:
                                    return this.random.number.between( 0, 1 )
                                    break
                            }

                            break
                    }
                },
                hex: ( isForThreeD ) => {
                    const _isForThreeD = !isForThreeD ? false : ( typeof isForThreeD == 'boolean' ) ? isForThreeD : false,
                    result = Math.floor( Math.random() * 0xffffff ).toString( 16 ).padStart( 6, '0' )

                    if ( result.length == 6 ) {
                        switch( _isForThreeD ) {
                            case false:
                                return `#${ result }`
                                break
                            case true:
                                return `0x${ result }`
                                break
                        }
                    }
                }
            },

            characters: ( length ) => {
                const _length = !length ? 11 : ( typeof length == 'number' ) ? length : 11,

                config = characters => {
                    const _length = length ? length : 11,
                    chars = characters

                    let result = ''

                    for ( let i = 0; i < _length; i++ ) result += chars.charAt( Math.floor( Math.random() * chars.length ) )

                    return result
                }

                return {
                    letters: {
                        lowercase: () => config( 'abcdefghijklmnopqrstuvwxyz' ),
                        uppercase: () => config( 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' ),
                        mixed: () => config( 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' ),
                    },

                    numbers: () => config( '0123456789' ),
                    mixed: () => config( 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' ),
                }
            },
        }

        this.shorten = ( subtractors, startSubtracted, endSubtracted ) => {
            if ( subtractors ) {
                switch ( subtractors.length ) {
                    case 1:
                        return subtractors[ 0 ].slice( startSubtracted, subtractors[ 0 ].length - endSubtracted )
                        break
                    case 2:
                        return subtractors[ 0 ].slice( startSubtracted, subtractors[ 1 ].length - endSubtracted )
                        break
                }
            }
        }
    }

    init () {}
}

export { Hanlder_Math as handler }