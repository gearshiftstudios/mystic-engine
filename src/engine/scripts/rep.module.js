import * as core from './core.module.js'

import * as handler_canvas from './handlers/canvas.module.js'
import * as handler_file from './handlers/file.module.js'
import * as handler_ui from './handlers/ui.module.js'
import * as handler_m3d from './handlers/m3d.module.js'
import * as handler_math from './handlers/math.module.js'
import * as handler_time from './handlers/time.module.js'

const CANVASREP = new handler_canvas.handler( 'Canvas' ),
FILEREP = new handler_file.handler( 'File' ),
UIREP = new handler_ui.handler( 'UI' ),
M3DREP = new handler_m3d.handler(),
MATHREP = new handler_math.handler( 'Math' ),
TIMEREP = new handler_time.handler( 'Time' )

export { 
    CANVASREP, CANVASREP as canvas,
    core,
    FILEREP, FILEREP as file, 
    UIREP, UIREP as ui, 
    M3DREP, M3DREP as m3d, 
    MATHREP, MATHREP as math, 
    TIMEREP, TIMEREP as time
}