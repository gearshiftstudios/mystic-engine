import * as engine from '../../mystic.module.js'

const defaults = {
    amount: 900,
}

class Stars {
    constructor ( amount = defaults.amount ) {
        this.params = {
            amount: amount,
        }

        this.geometry = new engine.m3d.geometry.buffer.default()
        this.initialized = false

        this.geometry.setAttribute( 'position', new engine.m3d.attribute.buffer( 
            new Float32Array( this.params.amount * 3 ), 3 
        ) )

        this.material = new engine.m3d.mat.points( {
            size: 1.0,
        } )
    }

    init ( object3d ) {
        return new Promise( resolve => {
            for ( let i = 0; i < this.geometry.attributes.position.array.length; i++ ) {
                this.geometry.attributes.position.array[ i ] = Math.random() * 2000 - 1000
            }
    
            this.mesh = new engine.m3d.points( this.geometry, this.material )
            
            if ( object3d ) object3d.add( this.mesh )

            this.initialized = true

            resolve()
        } )
    }
}

export { Stars }