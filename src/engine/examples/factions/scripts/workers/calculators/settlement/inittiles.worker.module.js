import { group } from '../../../handlers/macromap.module.js'

onmessage = e => {
    const parent = e.data[ 0 ], // 0
        adjacencies = new Array()

    /* the adjacency lay out
    
       2 3 4
       1 0 5
       8 7 6 */

    adjacencies.push( parent - 1 ) // 1
    adjacencies.push( parent + 1 ) // 5
    adjacencies.push( parent + group.size.width ) // 7
    adjacencies.push( parent + ( group.size.width - 1 ) ) // 8
    adjacencies.push( parent + ( group.size.width + 1 ) ) // 6
    adjacencies.push( parent - group.size.width ) // 3
    adjacencies.push( parent - ( group.size.width - 1 ) ) // 4 
    adjacencies.push( parent - ( group.size.width + 1 ) ) // 2

    const x = group.tiles[ parent ].center[ 0 ]
    const y = group.tiles[ parent ].center[ 1 ]
    const z = group.tiles[ parent ].center[ 2 ]

    postMessage( [ adjacencies, x, y, z ] )
}