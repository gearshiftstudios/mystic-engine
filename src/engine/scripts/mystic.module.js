import * as core from './core.module.js'

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from './libs/meshbvh.module.js'

import * as handler_audio from './handlers/audio.module.js'
import * as handler_canvas from './handlers/canvas.module.js'
import * as handler_file from './handlers/file.module.js'
import * as handler_ui from './handlers/ui.module.js'
import * as handler_m3d from './handlers/m3d.module.js'
import * as handler_math from './handlers/math.module.js'
import * as handler_time from './handlers/time.module.js'

const AUDIOREP = new handler_audio.handler( 'Audio' ),
CANVASREP = new handler_canvas.handler( 'Canvas' ),
FILEREP = new handler_file.handler( 'File' ),
UIREP = new handler_ui.handler( 'UI' ),
M3DREP = handler_m3d,
MATHREP = new handler_math.handler( 'Math' ),
TIMEREP = new handler_time.handler( 'Time' )

M3DREP.geometry.buffer.default.prototype.computeBoundsTree = computeBoundsTree
M3DREP.geometry.buffer.default.prototype.disposeBoundsTree = disposeBoundsTree
M3DREP.mesh.default.prototype.raycast = acceleratedRaycast

export { 
    AUDIOREP, AUDIOREP as audio,
    CANVASREP, CANVASREP as canvas,
    core,
    FILEREP, FILEREP as file, 
    UIREP, UIREP as ui, 
    M3DREP, M3DREP as m3d, 
    MATHREP, MATHREP as math, 
    TIMEREP, TIMEREP as time
}