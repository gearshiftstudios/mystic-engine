import * as engine from '../../mystic.module.js'
import * as gsap from '../../libs/gsap/gsap.module.js'
import { ComponentParent } from '../component.module.js'
import { Planet } from './planet.module.js'
import { Stars } from './stars.module.js'

class Universe extends ComponentParent {
    constructor ( planetSpread = 100 ) {
        super()

        this.transitioning = false
        this.planets = new Array()
        this.planetSpread = planetSpread
    }

    addComponent ( name, ...args ) {
        if ( name ) {
            switch( name ) {
                case 'stars':
                    this.components.stars = new Stars( ...args )
                    break
            }
        }
    }

    initComponents () {
        return new Promise( resolve => {
            for ( const c in this.components ) {
                this.components[ c ].init( this.group )
            }

            this.planets.forEach( p => {
                for ( const c in p.components ) {
                    p.components[ c ].init( p.group )
                }
            } )

            resolve()
        } )
    }

    updateComponents () {
        for ( const c in this.components ) {
            if ( this.components[ c ].update ) this.components[ c ].update()
        }

        this.planets.forEach( p => {
            for ( const c in p.components ) {
                p.components[ c ].update()
            }
        } )
    }

    planetByIndex ( index ) {
        if ( this.planets.length > 0 ) {
            if ( this.planets[ index ] ) return this.planets[ index ]
        } else return
    }
    
    planetByName ( name ) {
        if ( name ) {
            for ( let i = 0; i < this.planets.length; i++ ) {
                if ( this.planets[ i ].name == name ) return this.planets[ i ]
                
                break
            }
        } else {
            return this.planets[ 0 ]
        }
    }

    addPlanet ( ...args ) {
        return new Promise( resolve => {
            this.planets.push( new Planet( ...args ) )

            this.planets[ this.planets.length - 1 ].index = this.planets.length - 1

            if ( this.planets.length - 1 != 0 ) {
                this.planets[ this.planets.length - 1 ].group.position.set(
                    Math.random() * this.planetSpread - ( this.planetSpread / 2 ),
                    Math.random() * this.planetSpread - ( this.planetSpread / 2 ),
                    Math.random() * this.planetSpread - ( this.planetSpread / 2 )
                )
            }

            resolve( this.planets[ this.planets.length - 1 ] )
        } )
    }

    addPlanets ( count = 1, then, size = 19.8 ) {
        return new Promise( resolve => {
            for ( let i = 0; i < count; i++ ) {
                this.addPlanet(
                    ( typeof size != 'string' ) ? size :
                    ( size.split( ',' ).length < 2 ) ? Number( size ) :
                    engine.math.random.number.between(
                        Number( size.split( ',' )[ 0 ] ),
                        Number( size.split( ',' )[ 1 ] )
                    )
                ).then( then )
            }

            resolve()
        } )
    }

    initPlanets () {
        return new Promise( resolve => {
            this.planets.forEach( p => p.init( this.group ) )

            resolve()
        } )
    }

    initPlanetsDOM ( controls, cameraLight ) {
        return new Promise( resolve => {
            const scope = this

            const planetDOM = App.body.qS( '#planets' )
                .qS( 'scrollbox' ).qSA( 'item' )

            if ( planetDOM ) {
                App.body.qS( '#planets' ).qS( 'header' )
                    .qS( 'label' ).insert( this.planets.length )

                for ( let i = 0; i < planetDOM.length; i++ ) {
                    planetDOM[ i ].onclick = function () {
                        if ( !scope.transitioning ) scope.viewPlanet( this.getAttribute( 'index' ), controls, cameraLight )
                    }
                }
            }

            resolve()
        } )
    }

    viewPlanet ( index, controls, cameraLight ) {
        const tl1 = new gsap.TimelineMax()

        if ( controls ) {
            tl1.to( controls.target, 3, {
                x: this.planets[ index ].group.position.x,
                y: this.planets[ index ].group.position.y,
                z: this.planets[ index ].group.position.z,
                ease: gsap.Power3.easeOut
            } )
    
            controls.maxDistance = ( this.planetByIndex( index ).params.size / 2 ) * 3
    
            if ( cameraLight ) cameraLight.target = this.planets[ index ].group
    
            this.transitioning = true
    
            wait.seconds( () => {
                this.transitioning = false
    
                controls.maxDistance = ( ( this.planetByIndex( index ).params.size / 2 ) * 3 ) * 2
            }, 3 )
        }
    }

    init ( object3d ) {
        return new Promise( resolve => {
            this.initComponents().then( () => {
                if ( object3d ) object3d.add( this.group )

                this.planets.forEach( p => p.init( this.group ) )
    
                this.initialized = true

                resolve()
            } )
        } )
    }
}

export { Universe }