/* import core */ 
import * as core from './core.module.js'

/* import essentials */
import { Log } from './log.module.js'
import { Stats } from './libs/stats.module.js'

/* import REPs */
import { CANVASREP, FILEREP, UIREP, M3DREP, MATHREP, TIMEREP } from './rep.module.js'

/* import M3D */ 
import * as m3d_controls_orbit from './m3d/controls/orbit.module.js'
import * as m3d_environment from './m3d/environments/environment.module.js'
import * as m3d_objects_css from './m3d/objects/css.module.js'
import * as m3d_renderers_css from './m3d/renderers/css.module.js'

/* initialize core */ 
core.init()

/* initialize M3D */ 
m3d_controls_orbit.init()
m3d_environment.init()
m3d_objects_css.init()
m3d_renderers_css.init()

/* createengine class */ 
class Mystic {
    constructor ( options ) {
        this.log = new Log( 'General', false, true )
        this.stats = new Stats()

        // if ( options != void 0 ) {
        //     if ( typeof options == 'object' ) {
        //         this.log = !options.use ? null : typeof options.use == 'object' ? null : 
        //             !options.use.log ? null : options.use.log == true ? new Log( 'General', false, true ) : null
        //         this.stats = !options.use ? null : typeof options.use == 'object' ? null : 
        //             !options.use.stats ? null : options.use.stats == true ? new Stats() : null
        //     }
        // }

        this.handlers = {
            canvas: CANVASREP,
            file: FILEREP,
            ui: UIREP,
            m3d: M3DREP,
            math: MATHREP,
            time: TIMEREP,
        }
    }

    init () {
        // this.handlers.file.mystic.read( `${ EPATH }enginesettings` ).then( data => { 
        //     // App.gEBI( 'state-title' ).render( `
        //     //     <engine-logo-text-lt id='engine-logo.init' datax-desc='${ data.general.name } <datax-ti>v${ data.general.version }</datax-ti>@The engine used to make this game. It was created to organize the <datax-ts>Threejs Library</datax-ts> in the way <datax-ts>Nikolas Karinja</datax-ts> saw fit. It also makes creating and handling elements in your <datax-ts>JavaScript</datax-ts> game easier than before, especially with the <datax-ts>DOM</datax-ts>. To check it out, just <datax-ti>click</datax-ti> on it!'>
        //     //         <name datax-desc-parent='engine-logo.init'>${ data.general.name }</name> 
        //     //         <version datax-desc-parent='engine-logo.init'> v${ data.general.version }</version>
        //     //     </engine-logo-text-lt>
        //     // ` )
        
        //     this.settings = data
        //     this.settings.general.enginePath = EPATH
        // } )

        // this.log.output( `\n\nThank you for using the engine. This engine was a work of love from JavaScript and three.js. Both the language and library are magnificent and to utilize them each properly in my own way, I made an engine that is more organized and responsive. This engine is some of my finest work so far. So enjoy the ease of it.\n\n♡ Nikolas Karinja - The Developer` ).reg()
    }
}

const engine = new Mystic()
engine.init()

export { 
    engine,
    Mystic as class, 
    CANVASREP as canvas, 
    FILEREP as file, 
    UIREP as ui, 
    M3DREP as m3d, 
    MATHREP as math, 
    TIMEREP as time
}