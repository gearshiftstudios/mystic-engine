import * as engine from '../mystic.module.js'

class ComponentParent {
    constructor () {
        this.components = {}
        this.group = new engine.m3d.group()
        this.initialized = false
    }

    initComponents () {
        return new Promise( resolve => {
            for ( const c in this.components ) {
                this.components[ c ].init( this.group )
            }

            resolve()
        } )
    }

    updateComponents () {
        for ( const c in this.components ) {
            this.components[ c ].update()
        }
    }

    init ( object3d ) {
        return new Promise( resolve => {
            this.initComponents().then( () => {
                if ( object3d ) object3d.add( this.group )
    
                this.initialized = true

                resolve()
            } )
        } )
    }
}

export { ComponentParent }