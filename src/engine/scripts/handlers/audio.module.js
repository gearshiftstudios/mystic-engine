import { Handler } from '../handler.module.js'

class Handler_Audio extends Handler {
	constructor ( category ) {
		super( category )

        this.stored = {}
    }

    play ( name, options ) {
        if ( this.stored[ name ] ) {
            const audio = new Audio( this.stored[ name ][ 0 ] )

            audio.play()
        }
    }

    store ( url, name, options ) {
        if ( url && name ) {
            this.stored[ name ] = new Array( url, {} )
        }
    }
}

export { Handler_Audio as handler }