import { Log } from '../log.module.js'
import * as engine from '../rep.module.js'
import * as m3e_loader_gltf from './loaders/gltfe.module.js'

class Parser {
    constructor ( category ) {
        this.log = new Log( `${ category } Parser`, false, true )
        this.manager = new engine.m3d.manager.loading()

        this.loader = {
            gltf: new m3e_loader_gltf.eLoader(), 
        }
    }
}

export { Parser }