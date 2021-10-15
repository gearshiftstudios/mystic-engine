import { Parser } from '../parser.module.js'
import * as engine from '../../rep.module.js'

class Nation {
    constructor ( data ) {
        this.data = data
    }
}

class Parser_MNATPK extends Parser {
    constructor ( category = 'MNATPK' ) {
        super( category )
    }

    parse ( fileData ) {
        return new Promise( resolve => {
            const parsedNations = {}

            for ( const n in fileData.nations ) {
                parsedNations[ n ] = new Nation(
                    fileData.nations[ n ].data
                )
            }

            resolve( parsedNations )
        } )
    }
}

export { Parser_MNATPK, Parser_MNATPK as parser }