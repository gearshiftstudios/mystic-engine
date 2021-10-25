import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d from '../../../../scripts/m3d/rep.module.js'

import { Program_Module } from '../module.module.js'

class Handler_Nations extends Program_Module {
    constructor ( category = 'Nations Handler' ) {
        super( category )

        const scope = this

        this.data = {}

        this.selected = {
            actual: null,
            name: null,
        }

        this.list = {
            dropdown: {},
            general: new Array(),
            names: new Array(),
        }
    }

    findNationByName ( name ) {
        let result

        for ( const n in this.data ) {
            if ( this.data[ n ].data.name == name ) {
                result = n

                break
            }
        }

        return result
    }

    generateNations () {
        return new Promise( resolve => {
            this.parseNationsFile().then( () => {
                resolve()
            } )
        } ) 
    }

    parseNationsFile () {
        return new Promise( resolve => {
            engine.file.mystic.retrieve( './nations/list.mnatpk' ).then( data => {
                m3d.parser.mnatpk.parse( data ).then( nations => {
                    for ( const n in nations ) {
                        this.list.general.push( n )
                        this.list.names.push( nations[ n ].data.name )

                        this.list.dropdown[ nations[ n ].data.name ] = n
                    }

                    this.data = nations
                    this.selected.name = this.data[ Object.keys( this.data )[ 0 ] ].data.name
                    this.selected.actual = Object.keys( this.data )[ 0 ]

                    resolve()
                } )
            } )
        } )
    }

    init () {
        return new Promise( resolve => {
            this.generateNations().then( () => {
                this.log.output( 'Nations Handler has been initialized' ).reg()

                resolve()
            } )
        } )
    }
}

const NATIONSREP = new Handler_Nations()

export { NATIONSREP, NATIONSREP as rep }