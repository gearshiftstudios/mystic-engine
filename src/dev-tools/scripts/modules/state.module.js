import { Log } from '../../../engine/scripts/log.module.js'

class State {
    constructor ( category ) {
        this.log = new Log( category, false, true )
        this.firstOpened = true
    }
}

export { State }