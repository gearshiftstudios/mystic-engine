import { MovementControls } from './movement.module.js'

class PlanetaryControls extends MovementControls {
    constructor( object, domElement, orientRing ) {
        super( object, domElement, orientRing )

        this.screenSpacePanning = true
    }
}

export { PlanetaryControls }