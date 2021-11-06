import { Program_Module } from '../module.module.js'
import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d_loader_gltf from '../../../../scripts/m3d/loaders/gltfe.module.js'

class Player {
    constructor ( isHuman = false ) {
        this.isHuman = isHuman
        
        this.id = engine.math.random.characters( 17 ).mixed()

        this.laws = {
            economic: {},
            religious: {},
        }

        this.nation = {
            id: null,
        }

        this.resources = {
            ducats: 0,
            food: 0,

            population: {
                count: 0,
                happy: 0,
                manpower: 0,
                unhappy: 0,
            },
        }
    }
}

class Handler_Player extends Program_Module {
    constructor ( category = 'Player Handler' ) {
        super( category )

        this.list = {}
    }
}

const PLAYERREP = new Handler_Player()

export { PLAYERREP as rep, Handler_Player, Player }