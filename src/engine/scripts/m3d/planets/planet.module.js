import * as engine from '../../mystic.module.js'
import { AsteroidBelt } from './asteroidbelt.module.js'
import { ComponentParent } from '../component.module.js'
import { Water_LowPoly_Shader } from '../water/lowpoly-shader.module.js'
import * as planetNames from './lists/names.module.js'

class Planet extends ComponentParent {
    constructor ( size = 19.8, detail = Math.round( size * 0.8 ) ) {
        super()

        this.params = {
            size: size,
            detail: detail,
        }

        this.geometry = new engine.m3d.geometry.buffer.icosahedron( this.params.size / 2, this.params.detail )
        this.name = planetNames.list[ Math.floor( Math.random() * planetNames.list.length ) ]

        this.material = new engine.m3d.mat.mesh.standard( {
            flatShading: true,
            vertexColors: true,
        } )

        this.mesh = new engine.m3d.mesh.default( this.geometry, this.material )

        this.group.add( this.mesh )
    }

    rename ( name ) {
        if ( name ) this.name = name
    }

    addComponent ( name, ...args ) {
        if ( name ) {
            switch ( name ) {
                case 'asteroid-belt':
                    this.components.asteroidBelt = new AsteroidBelt( ...args )
                    break
                case 'ocean':
                    this.components.ocean = new Water_LowPoly_Shader( ...args )
                    break
            }
        }
    }
}

Planet.prototype.isPlanet = true

export { Planet }