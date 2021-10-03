import { Handler } from '../handler.module.js'
import * as handler_math from './math.module.js'

const MATH = new handler_math.handler()

class Handler_File extends Handler {
	constructor ( category ) {
		super( category )

		this.images = {
			list: new Array(),

			preload: function () {
				for ( let i = 0; i < arguments.length; i++ ){
					this.list[ i ] = new Image()
					this.list[ i ].src = arguments[ i ]
				}
			}
		}

		this.mystic = {
			read: async function ( file ) {
				if ( file ) {
					const response = await fetch( `${ file }.mystic` ),
					data = await response.json()

					return data
				}
			},
			retrieve: async function ( file ) {
				let result = await this.read( file )

				return {
					full: () => { return result },
					sub: property => {
						if ( result[ property ] ) return result[ property ]
					}
				}
			},
		}
	}
}

export { Handler_File as handler }