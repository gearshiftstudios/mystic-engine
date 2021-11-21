import * as engine from '../../mystic.module.js'

const dummy = new engine.m3d.object3D()

function scale ( num, in_min, in_max, out_min, out_max ) {
    return ( ( num - in_min ) * ( out_max - out_min ) ) / ( in_max - in_min ) + out_min
}

class AsteroidBelt {
    constructor (
        amount = 50, 
        distanceFromCenter = 14, 
        spread = 4, 
        size = 0.25, 
        detail = 0,
        color = 0xffffff
    ) {
        this.params = {
            amount: amount,
            distanceFromCenter: distanceFromCenter,
            spread: spread,
            size: size,
            detail: detail,
        }

        this.geometry = new engine.m3d.geometry.buffer.icosahedron( this.params.size, this.params.detail )
        this.group = new engine.m3d.group()
        this.initialized = false
        this.settings = new Array()

        this.material = new engine.m3d.mat.mesh.lambert( {
            color: color,
            reflectivity: 1,
        } )

        this.mesh = new engine.m3d.mesh.instanced( this.geometry, this.material, this.params.amount )
        this.mesh.castShadow = false

        this.group.add( this.mesh )
    }

    init (
        object3d, 
        rX = engine.math.random.number.between( 0, 360 ), 
        rZ = engine.math.random.number.between( 0, 360 ) ) {
        return new Promise( resolve => {
            if ( object3d ) object3d.add( this.group )

            for ( let i = 0; i < this.mesh.count; i++ ) {
                const cVal = engine.math.random.number.between( 0.5, 1 ),
                    color = new engine.m3d.color( cVal, cVal, cVal )
    
                this.mesh.setColorAt( i, color )
                this.mesh.instanceColor.needsUpdate = true
    
                const angle = scale( i, 0, this.mesh.count - 1, 0, Math.PI * 2 ),
                    radius = engine.math.random.number.between(
                        this.params.distanceFromCenter, 
                        this.params.distanceFromCenter + this.params.spread 
                    )
    
                dummy.position.set(
                    Math.cos( angle ) * radius,
                    engine.math.random.number.between( -1, 1 ),
                    Math.sin( angle ) * radius
                )
    
                dummy.rotation.x = engine.math.random.number.between( 0, Math.PI * 2 )
                dummy.rotation.z = engine.math.random.number.between( 0, Math.PI * 2 )
    
                dummy.updateMatrix()
    
                this.mesh.setMatrixAt( i, dummy.matrix )
                this.mesh.instanceMatrix.needsUpdate = true
    
                this.settings.push( {
                    pX: dummy.position.x,
                    pZ: dummy.position.z,
                    rX: dummy.rotation.x,
                    rZ: dummy.rotation.z,
                    waveOff: Math.random() * 1000,
                    doWave: true,
                } )
            }

            this.group.rotation.x = engine.m3d.util.math.degToRad( rX )
            this.group.rotation.z = engine.m3d.util.math.degToRad( rZ )

            this.initialized = true

            resolve()
        } )
    }

    update () {
        this.group.rotation.y += 0.001

        for ( let i = 0; i < this.mesh.count; i++ ) {
            if ( this.settings[ i ].doWave ) {
                dummy.position.set(
                    this.settings[ i ].pX,
                    Math.sin( this.settings[ i ].waveOff ),
                    this.settings[ i ].pZ
                )

                dummy.rotation.x = this.settings[ i ].rX + 0.001
                dummy.rotation.z = this.settings[ i ].rZ + 0.001

                this.settings[ i ].rX = dummy.rotation.x
                this.settings[ i ].rZ = dummy.rotation.z

                dummy.updateMatrix()

                this.mesh.setMatrixAt( i, dummy.matrix )
                this.mesh.instanceMatrix.needsUpdate = true

                this.settings[ i ].waveOff += 0.01
            }
        }
    }
}

export { AsteroidBelt }