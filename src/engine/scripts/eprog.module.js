import { Log } from './log.module.js'
import * as reps from './mystic.module.js'
import * as m3d_enviroment from './m3d/environments/environment.module.js'

import { Loader } from './loader.module.js'

class EProg {
    constructor ( name = 'Program', mainEnvContainer = document.body ) {
        this.domevents = new reps.core.events()
        this.handlers = {}
        this.loaders = {}
        this.log = new Log( 'Main', false, false )
        this.name = name
        this.modes = {}

        this.mouse = {
            screen: new reps.m3d.vec2(),
            world: new reps.m3d.vec2(),

            angle: {
                toCenter: 0,
            },

            distance: {
                fromCenter: 0,
            },
        }

        this.environments = {
            main: mainEnvContainer ? new m3d_enviroment.class( mainEnvContainer ) : null,
            subs: {}
        } 

        this.mode = class {
            constructor ( active ) {
                this.active = active
            }

            isActive () {
                return this.active
            }
        }


        window.onresize = () => {
            this.environments.main.resize()
        }
    }

    addHandler ( name = Object.keys( this.handlers ).length + 1, handler ) {
        return new Promise( resolve => {
            this.handlers[ name ] = handler

            resolve()
        } )
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

    addMode ( name = Object.keys( this.modes ).length + 1, boolean ) {
        this.modes[ name ] = new this.mode( !boolean ? false : typeof boolean == 'boolean' ? boolean : false )

        return {
            addSubset: ( ...args ) => {
                return new Promise( resolve => {
                    this.modes[ name ] = {}

                    args.forEach( m => {
                        if ( Array.isArray( m ) ) {
                            if ( m[ 0 ] ) this.modes[ name ][ m[ 0 ] ] = new this.mode( m[ 1 ] ? m[ 1 ] : false )
                        }
                    } )

                    resolve()
                } )
            }
        }
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