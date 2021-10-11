import { Log } from './log.module.js'

export class Handler {
    constructor ( category ) {
        this.log = new Log( `${ category } Handler`, false, true )
    }
}