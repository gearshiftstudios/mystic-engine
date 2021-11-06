import { EProg } from '../../../engine/scripts/eprog.module.js'
import * as engine from '../../../engine/scripts/mystic.module.js'

import * as handler_group from './handlers/group.module.js'
import * as handler_scenes from './handlers/scenes.module.js'
import * as handler_tab from './handlers/tab.module.js'

class Program extends EProg {
    constructor ( name, mainEnvContainer ) {
        super( name, mainEnvContainer )

        this.addHandler( 'group', handler_group.rep )
        this.addHandler( 'scenes', handler_scenes.rep )
        this.addHandler( 'tab', handler_tab.rep )

        this.render = () => {
            handler_scenes.rep.render()
    
            requestAnimationFrame( this.render )
        }
    }

    init () {
        engine.core.init().then( () => {
            handler_group.rep.init().then( () => {
                handler_tab.rep.init().then( () => {
                    handler_scenes.rep.init().then( () => {
                        window.onresize = () => {
                            handler_group.rep.resize()
                            handler_scenes.rep.resize()
                        }

                        const quickbar = {
                            buttons: App.body.qS( 'quickbar' ).qS( 'buttons' ).qSA( 'button' ),
                            menuOpen: null,
                        }

                        for ( let i = 0; i < quickbar.buttons.length; i++ ) {
                            quickbar.buttons[ i ].onclick = function () {
                                const bounds = this.getBoundingClientRect()

                                if ( this.hasAttribute( 'menu' ) ) {
                                    const menu = App.body.qS( 'quickbar' ).qS( `#${ this.getAttribute( 'menu' ) }` )
                                    menu.style.marginLeft = `${ bounds.left }px`
                                    menu.show()

                                    if ( quickbar.menuOpen != null ) App.body.qS( 'quickbar' ).qS( `#${ quickbar.menuOpen }` ).hide()

                                    quickbar.menuOpen = this.getAttribute( 'menu' )
                                }
                            }
                        }

                        App.body.qS( 'environment' ).onclick = e => {
                            App.body.qS( 'quickbar' ).qS( `#${ quickbar.menuOpen }` ).hide()
                        }

                        this.render()

                        this.log.output( 'Initialized and ready for use!' )
                    } )
                } )
            } )
        } )
    }
}

window.program = new Program( 'Engine Tools', null )
program.init()