import { group } from '../../../handlers/macromap.module.js'

onmessage = e => {
    const tiles = e.data[ 0 ],
        overall = e.data[ 1 ],
        sId = e.data[ 2 ]

    for ( let i = 0; i < tiles.length; i++ ) {
        if ( group.tiles[ tiles[ i ] ] ) {
            const tile = group.tiles[ tiles[ i ] ]

            tile.settlementId = sId

            overall.push( tiles[ i ] )
        }
    }

    postMessage( [ overall ] )
}