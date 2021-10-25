import * as engine from '../../../../scripts/mystic.module.js'
import * as m3d from '../../../../scripts/m3d/rep.module.js'
import * as animator from '../../../../scripts/libs/gsap/gsap.module.js'

import { Program_Module } from '../module.module.js'

import * as handler_map from './macromap.module.js'

class Settlement {
    constructor ( tile ) {
        this.destruction = 0
        this.food = 1
        this.housing = 1
        this.id = engine.math.random.characters( 21 ).mixed()
        this.population = new Array()
        this.wealth = 0

        this.position = {
            object: new engine.m3d.vec3(),
            world: new engine.m3d.vec3(),

            tiles: {
                overall: new Array(),
                adjancencies: new Array(),
                parent: tile,
            },
        }
    }

    /* done by turn */ 
    calculatePopulation () {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/calculators/settlement/population.worker.js' )

            worker.postMessage( [
                this.population,
                this.food,
                this.housing,
                this.wealth,
                this.destruction
            ] )

            worker.onmessage = e => {
                this.population = e.data[ 0 ]

                resolve()
            }
        } )
    }

    /* live */
    addTiles () {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/calculators/settlement/addtiles.worker.module.js', {
                type: 'module'
            } )

            if ( arguments.length > 0 ) {
                worker.postMessage( [ 
                    arguments,
                    this.position.tiles.overall,
                    this.id
                ] )
            }

            worker.onmessage = e => {
                this.position.tiles.overall = e.data[ 0 ]

                resolve()
            }
        } )
    }

    calculateInitTiles () {
        return new Promise( resolve => {
            const worker = new Worker( './scripts/workers/calculators/settlement/inittiles.worker.module.js', {
                type: 'module'
            } )

            worker.postMessage( [ this.position.tiles.parent ] )

            worker.onmessage = e => {
                this.position.tiles.adjancencies = e.data[ 0 ]

                this.position.object = new engine.m3d.vec3( 
                    e.data[ 1 ], 
                    e.data[ 3 ], 
                    -e.data[ 2 ] 
                )

                this.position.world = new engine.m3d.vec3( 
                    e.data[ 1 ], 
                    e.data[ 2 ], 
                    e.data[ 3 ] 
                )

                this.position.tiles.overall = new Array( ...this.position.tiles.adjancencies )
                this.position.tiles.overall.push( this.position.tiles.parent )

                resolve()
            }
        } )
    }

    raiseInitTiles () {
        return new Promise( resolve => {


            resolve()
        } )
    }

    visit () {
        return new Promise( resolve => {
            program.environments.main.controls.panTo( e.data[ 1 ], e.data[ 2 ] )
        } )
    } 

    /* initialization */
    generate () {
        return new Promise( resolve => {
            this.calculateInitTiles().then( () => {

            } )
        } )
    }
}

class Handler_Settlement extends Program_Module {
    constructor ( category = 'Settlement Handler' ) {
        super( category )
    }
}

const SETTLEMENTREP = new Handler_Settlement()

export { SETTLEMENTREP as rep }