import { Program_Module } from '../module.module.js'
import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d_renderer_css from '../../../../scripts/m3d/renderers/css2d.module.js'
import * as handler_player from './player.module.js'

class Pawn {
    constructor ( model, type = 'fleet', owner = null, name = null, addToMacromap = true ) {
        this.group = model.scene
        this.id = engine.math.random.characters( 21 ).mixed()
        this.label = null
        this.name = name ? name : engine.math.string.capitalize( type ).first() 
        this.owner = owner
        this.type = type

        this.animations = {
            current: new Array(),
            list: {},
            mixer: new engine.m3d.animation.mixer( this.group ),

            play: ( timesRepeated = 'infinite', fadeInTime = 0.5 ) => {
                return {
                    section: ( name ) => {
                        if ( this.animations.list[ name ] ) {
                            this.animations.mixer.stopAllAction()

                            for ( const a in this.animations.list[ name ] ) {
                                const animation = this.animations.mixer.clipAction( this.animations.list[ name ][ a ] )

                                switch ( timesRepeated ) {
                                    case 'inifinite':
                                        animation.setLoop( engine.m3d.loopRepeat, Infinity )
                                        break
                                    case 'once':
                                        animation.setLoop( engine.m3d.loopOnce )
                                        animation.clampWhenFinished = true
                                        break
                                }

                                if ( typeof timesRepeated == 'number' && timesRepeated > 0 ) {
                                    if ( timesRepeated == 1 ) {
                                        animation.setLoop( engine.m3d.loopOnce )
                                        animation.clampWhenFinished = true
                                    } else animation.setLoop( engine.m3d.loopRepeat, timesRepeated )
                                }
                                
                                animation.reset()
                                animation.fadeIn( fadeInTime )
                                animation.play()
                            }
                        }
                    },
                }
            }
        }

        this.units = {
            list: {},
        }
        
        model.animations.forEach( a => {
            if ( a.name.length > 0 && a.name != 'AnimationClip' ) {
                const name = a.name.split( '-' )

                if ( name.length > 1 ) {
                    if ( !this.animations.list[ name[ 0 ] ] ) this.animations.list[ name[ 0 ] ] = {}

                    this.animations.list[ name[ 0 ] ][ name[ 1 ] ] = a.clone()

                    // const sub = name.split( '#' )

                    // if ( sub.length > 1 ) {
                    //     if ( !this.animations[ name[ 0 ] ][ sub[ 0 ] ] ) this.animations[ name[ 0 ] ][ sub[ 0 ] ] = {}

                    //     this.animations[ name[ 0 ] ][ sub[ 0 ] ][ sub[ 1 ] ] = a.clone()
                    // } else this.animations[ name[ 0 ] ][ sub[ 0 ] ] = a.clone()
                } else this.animations.list[ name[ 0 ] ] = a.clone()
            }
        } )

        this.group.traverse( ( child ) => {
            if ( child.isMesh ) {
                child.castShadow = true
                // child.receiveShadow = true
                // child.geometry.computeVertexNormals()
            }
        } )

        this.label = document.createElement( 'pawn-label' )
		this.label.setAttribute( 'simple', '' )
        this.label.style.marginTop = '-1em'

		this.updateLabel()

		const label = new m3d_renderer_css.object( this.label )
		
        switch ( this.type ) {
            case 'fleet':
                label.position.set( 0, this.group.position.y + 2, 0 )
                break
        }

		this.group.add( label )

        if ( addToMacromap ) program.macromap.add( this.group )

        PAWNREP.addPawn( this )
    }

    changeOwner ( playerId = null ) {
        return new Promise( resolve => {
            if ( playerId != null ) {
                if ( handler_player.rep.list[ playerId ] ) {
                    this.owner = playerId
                } else {
                    PAWNREP.log.output( `No player with the passed ID was found. Setting owner of this pawn (${ this.id }) to Gaia`, 'Change Owner' ).warn()
    
                    this.owner = null
                }
            } else {
                PAWNREP.log.output( `No Player ID passed. Setting owner of this pawn (${ this.id }) to Gaia`, 'Change Owner' ).warn()
    
                this.owner = null
            }

            resolve()
        } )
    }

    rename ( name = this.name.toString() ) {
        this.name = name

        this.updateLabel()
    }

    PROMISE_getHealth () {
        return new Promise( resolve => {
            if ( Object.keys( this.units.list ).length > 0 ) {
                const full = Object.keys( this.units.list ).length * 100

                let overall = 0

                for ( const u in this.units.list ) {
                    overall += this.units.list[ u ].getHealth() // percentage (0 - 100)
                }

                resolve( Math.round( ( overall / Object.keys( this.units.list ).length ) ) )
            } else {
                resolve( 100 )
            }
        } )
    }

    getHealth () {
        if ( Object.keys( this.units.list ).length > 0 ) {
            const full = Object.keys( this.units.list ).length * 100

            let overall = 0

            for ( const u in this.units.list ) {
                overall += this.units.list[ u ].getHealth() // percentage (0 - 100)
            }

            return Math.round( ( overall / Object.keys( this.units.list ).length ) )
        } else {
            return 100
        }
    }

    updateLabel () {
        if ( this.label.hasAttribute( 'simple' ) ) {
            this.label.insert( `${ 
                this.name
            } - <owner>${ 
                ( this.owner == null ) ? 'Gaia' : 
                    ( program.onlineMatch ) ? handler_player.rep.list[ this.owner ].username :
                    handler_player.rep.list[ this.owner ].nation.name
            }</owner> (<count>${
                Object.keys( this.units.list ).length
            }</count>) <health>${
                this.getHealth()
            }%</count>` )
        }
    }
}

class Handler_Pawn extends Program_Module {
    constructor( category = 'Pawn Handler' ) {
        super( category )

        this.list = {}
    }

    addPawn ( pawn ) {
        if ( !this.list[ pawn.id ] ) this.list[ pawn.id ] = pawn
    }

    retrievePawn ( id = Object.keys( this.list )[ 0 ] ) {
        if ( this.list[ id ] ) return this.list[ id ]
    }

    retrieveIDs () {
        return new Promise( resolve => {
            const ids = new Array()

            for ( const p in this.list ) {
                ids.push( p )
            }

            resolve( ids )
        } )
    }
}

const PAWNREP = new Handler_Pawn()

export { PAWNREP as rep, Handler_Pawn, Pawn }