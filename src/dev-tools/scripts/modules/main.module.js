import * as engine from '../../../engine/scripts/mystic.module.js'
import * as m3d_gui from '../../../engine/scripts/m3d/gui/dat.gui.module.js'

import * as editor_object from './states/editors/object.module.js'

class Program {
    constructor () {
        this.gui = {
            home: [ 
                new m3d_gui.class( { id: 'm3d-gui.home' } ), 
                {
                    tools: {
                        editors: {
                            building: () => {},
                            object: () => {
                                this.states.editors.object.open()
                            },
                            pawn: () => {},
                        },
                    },
                } 
            ]
        }

        this.states = {
            editors: {
                object: new editor_object.state( 'Object Editor' )
            }
        }

        this.animate = () => {
            this.render()

            requestAnimationFrame( this.animate )
        }
    }

    render () {
        for ( const e in this.states.editors ) {
            this.states.editors[ e ].render()
        }
    }

    resize () {
        for ( const e in this.states.editors ) {
            this.states.editors[ e ].resize()
        }
    }

    async init () {
        engine.core.init()

        window.onresize = () => this.resize()

        document.getElementById( 'm3d-gui.editor-object' ).hide()

        document.body.state( 'editor-object' ).hide()

        const gui_folder$home_tools = this.gui.home[ 0 ].addFolder( 'Tools' )
        gui_folder$home_tools.open()

        const gui_folder$home_tools_editors = gui_folder$home_tools.addFolder( 'Editors' )
        gui_folder$home_tools_editors.add( this.gui.home[ 1 ].tools.editors, 'building' ).name( 'Building Editor' )
        gui_folder$home_tools_editors.add( this.gui.home[ 1 ].tools.editors, 'object' ).name( 'Object Editor' )
        gui_folder$home_tools_editors.add( this.gui.home[ 1 ].tools.editors, 'pawn' ).name( 'Pawn Editor' )
        gui_folder$home_tools_editors.open()

        const gui_folder$home_tools_pb = gui_folder$home_tools.addFolder( 'Pack Builders' )
        gui_folder$home_tools_pb.add( this.gui.home[ 1 ].tools.editors, 'building' ).name( 'Building PB' )
        gui_folder$home_tools_pb.add( this.gui.home[ 1 ].tools.editors, 'object' ).name( 'Object PB' )
        gui_folder$home_tools_pb.add( this.gui.home[ 1 ].tools.editors, 'pawn' ).name( 'Pawn PB' )
        gui_folder$home_tools_pb.open()

        this.animate()
    }
}

window.program = new Program()
window.program.init()