import { Settings } from './settings.module.js'

const S = Settings,

    $Sa = 0, // active index
    $Se = 1, // enabled index

    SS = Settings.scene,
    SSM = Settings.scene.movement

const defaultCursor = `url( '../../assets/cursors/metal/arrow.standard.32.png' ), auto`

let initialized = false

function recursive () {
    SSM.panning[ $Sa ].mouseRightDrag.isActive( 'switch' )
        .then( s => {
            if (
                !program.domevents.window.resizing.isOn() && 
                program.domevents.window.mouse.inside.isOn()
            ) {
                const speed = SSM.panning[ $Sa ].speed * program.mouse.distance.fromCenter

                if ( s ) {
                    program.environments.main.controls.panLeft(
                        speed * Math.cos( program.mouse.angle.toCenter )
                    )

                    program.environments.main.controls.panUp(
                        speed * Math.sin( program.mouse.angle.toCenter )
                    )
                } else {
                    SSM.panning[ $Sa ].screenEdges.isEnabled( true )
                        .then( _s => {
                            if (
                                program.mouse.screen.x >= window.innerWidth - 15 ||
                                program.mouse.screen.x <= 15 ||
                                program.mouse.screen.y >= window.innerHeight - 15 ||
                                program.mouse.screen.y <= 15
                            ) {
                                program.environments.main.controls.panLeft(
                                    speed * Math.cos( program.mouse.angle.toCenter )
                                )
            
                                program.environments.main.controls.panUp(
                                    speed * Math.sin( program.mouse.angle.toCenter )
                                )
                            }
                        } )
                }               
            }
        } )
}

function init () {
    return new Promise( resolve => {
        App.body.onpointerenter = () => program.domevents.window.mouse.inside.on()
        App.body.onpointerleave = () => program.domevents.window.mouse.inside.off()

        App.body.onpointermove = e => {
            program.mouse.screen.x = e.clientX
            program.mouse.screen.y = e.clientY
            
            program.mouse.angle.toCenter = Math.atan2(
                e.clientY - window.innerHeight / 2,
                e.clientX - window.innerWidth / 2
            )

            const distanceX = e.clientX - ( window.innerWidth / 2 ),
                distanceY = e.clientY - ( window.innerHeight / 2 )

            program.mouse.distance.fromCenter = Math.sqrt( ( distanceX * distanceX ) + ( distanceY * distanceY ) )

            App.body.qS( 'cursor-pan' ).style.left = `${ e.clientX }px`
            App.body.qS( 'cursor-pan' ).style.top = `${ e.clientY }px`

            App.body.qS( 'cursor-pan' ).style.transform = `translate( -32px, -16px ) rotateX( -${ program.environments.main.controls.getPolarAngle() }rad ) rotateZ( ${ program.mouse.angle.toCenter }rad )`
            App.body.qS( 'cursor-pan-center' ).style.transform = `translate( -16px, -16px ) rotateX( ${ program.environments.main.controls.getPolarAngle() }rad )`

            if ( SSM.panning[ $Se ] ) {
                if (
                    ( program.mouse.screen.x >= window.innerWidth - 15 ||
                    program.mouse.screen.x <= 15 ||
                    program.mouse.screen.y >= window.innerHeight - 15 ||
                    program.mouse.screen.y <= 15 ) &&
                    SSM.panning[ $Sa ].screenEdges.isEnabled()
                ) {
                    App.body.style.cursor = 'none'
                    App.body.qS( 'cursor-pan' ).show()
                } else {
                    if ( SSM.panning[ $Sa ].mouseRightDrag.isActive() ) {
                        App.body.style.cursor = 'none'
                        App.body.qS( 'cursor-pan' ).show()
                    } else {
                        App.body.style.cursor = defaultCursor
                        App.body.qS( 'cursor-pan' ).hide()
                    }
                }
            }
        }

        App.body.onpointerdown = e => {
            switch ( e.button ) {
                case 2: 
                    if ( SSM.panning[ $Se ] ) {
                        SSM.panning[ $Sa ].mouseRightDrag.isEnabled( true )
                            .then( s => {
                                s.activate()

                                App.body.style.cursor = 'none'
                                App.body.qS( 'cursor-pan' ).show()
                                App.body.qS( 'cursor-pan-center' ).show()
                            } )
                    }
            }
        }

        App.body.onpointerup = e => {
            switch ( e.button ) {
                case 2: 
                    if ( SSM.panning[ $Se ] ) {
                        SSM.panning[ $Sa ].mouseRightDrag.isEnabled( true )
                            .then( s => {
                                s.deactivate()

                                App.body.style.cursor = defaultCursor

                                App.body.qS( 'cursor-pan' ).hide()
                                App.body.qS( 'cursor-pan-center' ).hide()
                            } )
                    }
            }
        }

        initialized = true

        resolve()
    } )
}

export { init, initialized, recursive }