import * as m3d_gui from '../../../../../scripts/m3d/gui/dat.gui.module.js'

import { Program_Module } from '../../module.module.js'

// import * as handler_macromap from '../../handlers/macromap.module.js'

class GUI_MacroMap extends Program_Module {
    constructor ( category = 'GUI - Macro Map' ) {
        super( category )

        this.self = new m3d_gui.class( { id: 'm3d-gui.macromap' } )

        this.elements = { 
            folder: {
                static: null,
                live: null,
            }, 
            buttons: {
                static: {
                    elevation: {},
                },
                live: {
                    fog: {},
                    water: {},
                },
            } 
        }

        this.actions = {}
    }

    init () {
        return new Promise( resolve => {
            this.elements.folder.static = this.self.addFolder( 'Static' )

            this.elements.folder.static.add( program.macromap.size, 'width', {
                'Tiny': 250,
                'Small': 500,
                'Normal': 750,
                'Large': 1000
            } ).name( 'Size' )

            this.elements.buttons.static.regenerate = this.elements.folder.static.add( program.handlers.macromap, 'generateMacro' ).name( 'Regenerate' )

            this.elements.folder.static.elevation = this.elements.folder.static.addFolder( 'Elevation' )
            this.elements.buttons.static.elevation.max = this.elements.folder.static.elevation.add( program.macromap.elev, 'max', 0, 35 ).name( 'Max' )
            this.elements.folder.static.elevation.open()

            this.elements.folder.static.open()

            this.elements.folder.live = this.self.addFolder( 'Live' )

            this.elements.folder.live.water = this.elements.folder.live.addFolder( 'Water' )
            this.elements.buttons.live.water.animate = this.elements.folder.live.water.add( program.macromap, 'animateWater' ).name( 'Animate' ).listen()
            this.elements.folder.live.water.open()

            this.elements.folder.live.fog = this.elements.folder.live.addFolder( 'Fog of War' )
            this.elements.buttons.live.fog.toggle = this.elements.folder.live.fog.add( program.handlers.macromap, 'toggleFog' ).name( 'Toggle' ).listen()
            this.elements.folder.live.fog.open()

            this.elements.folder.live.open()

            App.gEBI( 'm3d-gui.macromap' ).hide()

            resolve()
        } )
    }
}

export { GUI_MacroMap, GUI_MacroMap as class }