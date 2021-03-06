/* Import engine-side scripts */ 
import * as engine from '../../../scripts/mystic.module.js'
import { EProg } from '../../../scripts/eprog.module.js'
import * as stats from '../../../scripts/libs/stats.module.js'

/* Import the specific script's dependencies */ 
import * as cursors from './interface/cursors.module.js'
import * as listeners from './interface/listeners.module.js'

import * as handler_buildings from './handlers/buildings.module.js'
import * as handler_nations from './handlers/nations.module.js'
import * as handler_macromap from './handlers/macromap.module.js'
import * as handler_maincamera from './handlers/maincamera.module.js'
import * as handler_minimap from './handlers/minimap.module.js'
import * as handler_pawn from './handlers/pawn.module.js'
import * as handler_settlement from './handlers/settlement.module.js'

import { Ammo } from '../../../scripts/libs/ammo.module.js'

/* Create program class */ 
class Program extends EProg {
    constructor ( name, mainEnvContainer ) {
        super( name, mainEnvContainer )

        /* Create Macro Map group */ 
        this.macromap = handler_macromap.group
        this.onlineMatch = false

        this.temp = {
            mixer: null,
            clock: new engine.m3d.clock()
        }

        /* Add all handlers */ 
        this.addHandler( 'buildings', handler_buildings.rep )
        this.addHandler( 'nations', handler_nations.rep )
        this.addHandler( 'macromap', handler_macromap.rep )
        this.addHandler( 'maincamera', handler_maincamera.rep )
        this.addHandler( 'minimap', handler_minimap.rep )
        this.addHandler( 'pawn', handler_pawn.rep )
        this.addHandler( 'settlements', handler_settlement.rep )

        this.addMode( 'macrobuild' ).addSubset(
            [ 'single', false ],
            [ 'fort', false ],
            [ 'settlement', false ]
        )

        this.addMode( 'microbuild' ).addSubset(
            [ '1x1', false ],
            [ '3x3', false ],
            [ '5x5', false ],
            [ '7x7', false ],
            [ '9x9', false ],
            [ '11x11', false ]
        )

        this.addLoader( 'pre', document.getElementById( 'loader-pre' ) ).then( loader => {
            loader.add( 'Managing Cursors' )
                .add( 'Initializing Hardware Monitor' )
                .add( 'Creating Listeners' )
                .add( 'Handling Game Camera' )

            loader.element.hide()
        } )

        this.addLoader( 'macromap', document.getElementById( 'loader-macromap' ) ).then( loader => {
            loader.add( 'Discovering New Land' )
                .add( 'Provoking Explorers' )
                .add( 'Viewing Shorelines' )
                .add( 'Moving Mountains' )
                .add( 'Surveying Land' )
                .add( 'Coloring Terrain' )
                .add( 'Analyzing Foliage' )
                .add( 'Plotting Land' )
                .add( 'Cartographing Geography' )
                .add( 'Marking Flaura' )
                .add( 'Charting Borders' )
                .add( 'Analyzing Weather' )
                .add( 'Publishing Cartography' )
                .add( 'Printing Findings' )
                .add( 'Reviewing with Crew' )

            loader.onStart( () => {
                document.body.state( 'macromap-generation' ).hide()
                document.body.state( 'minimap-ui' ).hide()
                document.body.state( 'loading' ).show()
            } )

            loader.onComplete( () => {
                document.body.state( 'loading' ).hide()
                document.body.state( 'macromap-generation' ).show()
                document.body.state( 'minimap-ui' ).show()

                this.handlers.minimap.update.render().then( () => {
                    this.handlers.minimap.update.pixels()
                } )
            } )

            loader.element.hide()
        } )

        /* Define animation loop */ 
        this.animate = () => {
            stats.element.begin()

            var delta = this.temp.clock.getDelta()

            this.environments.main.render()

            /* Check if map has been fully generated */
            if ( 
                this.macromap && 
                this.macromap.initialized 
            ) {
                if ( Object.keys( this.handlers.pawn.list ).length > 0 ) {
                    for ( const p in this.handlers.pawn.list ) {
                        this.handlers.pawn.list[ p ].animations.mixer.update( delta )
                    }
                }

                /* Animate water if it exists & is turned on */
                if ( 
                    this.macromap.water && 
                    this.macromap.animateWater 
                ) this.macromap.water.update()
                
                this.handlers.maincamera.updateCameraElev()
                
                /* Only allow Side-of-Screen map movement if window isn't 
                   resizing & mouse is inside the window */
                if ( listeners.initialized ) listeners.recursive()
            }

            stats.element.end()

            requestAnimationFrame( this.animate )
        }
    }

    init () {
        Ammo().then( ( data ) => {
            this.environments.main.initPhysics( data )

            /* initialize core element prototypes */
            engine.core.init().then( () => {
                this.loader( 'pre' ).start()

                engine.ui.cursors.multiload( ...cursors.list ).then( () => {
                    engine.ui.cursors.set( 'pointer.standard' ).then( () => {
                        this.loader( 'pre' ).finishTask()

                        stats.init().then( () => {
                            this.loader( 'pre' ).finishTask()

                            listeners.init().then( () => {
                                this.loader( 'pre' ).finishTask()

                                this.handlers.maincamera.init().then( () => {
                                    this.loader( 'pre' ).finishTask()

                                    /* Add initial Macro Map to main environment scene */ 
                                    this.environments.main.scene.add( this.macromap )
        
                                    /* Initialize handlers */ 
                                    this.handlers.macromap.init().then( () => {
                                        this.handlers.buildings.init().then( () => {
                                            this.handlers.nations.init().then( () => {
                                                this.animate()
                                            } )
                                        } )
                                    } )
                                } )
                            } )
                        } )
                    } )
                } )
            } )
        } )
    }
}

/* Create program */ 
window.program = new Program(
    'Factions Example',
    document.body
)

/* Initialize and run the program */ 
window.program.init()