import { Log } from '../../../scripts/log.module.js'

class Program_Module {
    constructor ( category ) {
        this.log = new Log( category, false, 'Factions Example' )
    } 
}

export { Program_Module, Program_Module as class }