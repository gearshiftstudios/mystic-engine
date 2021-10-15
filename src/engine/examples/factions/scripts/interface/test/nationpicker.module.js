import * as m3d_gui from '../../../../../scripts/m3d/gui/dat.gui.module.js'

import { Program_Module } from '../../module.module.js'

import { NATIONSREP } from '../../handlers/nations.module.js'

class GUI_NationPicker extends Program_Module {
    constructor ( category = 'GUI - Nation Picker' ) {
        super( category )

        this.self = new m3d_gui.class( { id: 'm3d-gui.nationpicker', width: 260 } )

        this.elements = { 
            folder: {}, 
            buttons: {},
        }

        this.actions = {
            play: () => {
                App.gEBI( 'm3d-gui.nationpicker' ).hide()
                App.gEBI( 'm3d-gui.macromap' ).hide()
            },
        }
    }

    init () {
        return new Promise( resolve => {
            this.elements.buttons.list = this.self.add( NATIONSREP.selected, 'name', NATIONSREP.list.names )
                .onChange( value => {
                    NATIONSREP.selected.actual = NATIONSREP.findNationByName( value )
                } ).name( 'Selected' ).setValue( NATIONSREP.selected.name )

            this.elements.buttons.list.selectPlot = this.self.add( this.actions, 'play' ).name( 'Start Game' )

            App.gEBI( 'm3d-gui.nationpicker' ).hide()

            resolve()
        } )
    }
}

export { GUI_NationPicker, GUI_NationPicker as class }