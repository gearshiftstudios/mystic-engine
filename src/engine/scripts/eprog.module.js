import { Log } from './log.module.js'
import * as reps from './rep.module.js'
import * as m3d_enviroment from './m3d/environments/environment.module.js'

import { Loader } from './loader.module.js'

class EProg {
    constructor ( name = 'Program', mainEnvContainer = document.body ) {
        this.domevents = new reps.core.events()
        this.handlers = {}
        this.loaders = {}
        this.log = new Log( 'Main', false, false )
        this.name = name

        this.mouse = {
            x: 0,
            y: 0,
        }

        this.environments = {
            main: m3d_enviroment.create( mainEnvContainer )
                .modify( {
                    alwaysResize: true,
                    name: 'main',
                    subClass: 'main',
                } ).store().retrieve(),
            subs: {}
        } 
    }

    addHandler ( name = Object.keys( this.handlers ).length + 1, handler ) {
        this.handlers[ name ] = handler
    }

    addLoader ( 
        name = Object.keys( this.loaders ).length + 1, 
        element, 
        showWhenStarted = true, 
        hideWhenFinished = true 
    ) {
        return new Promise( resolve => {
            this.loaders[ name ] = new Loader( element, showWhenStarted, hideWhenFinished )

            resolve( this.loaders[ name ] )
        } )
    }

    handler ( name ) {
        if ( this.handlers[ name ] ) return this.handlers[ name ]
    }

    loader ( name ) {
        if ( this.loaders[ name ] ) return this.loaders[ name ]
    }

    initEnvironments () {
        return new Promise( resolve => {
            resolve()
        } )
    }
}

export { EProg, EProg as class }