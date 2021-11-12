import * as engine from '../../mystic.module.js'
import * as fragmentShader from './shaders/lowpoly-shader.fragment.shader.js'
import * as vertexShader from './shaders/lowpoly-shader.vertex.shader.js'

class Water_LowPoly_Shader {
    constructor ( width = 20, height = 20, widthDetail = width * 2, heightDetail = height * 2 ) {
        const scope = this

        this.clock = new engine.m3d.clock()
        this.geometry = new engine.m3d.geometry.buffer.plane( width, height, widthDetail, heightDetail )
        this.initialized = false
        
        this.material = new engine.m3d.mat.mesh.phong( {
            color: 0x326e59,
            flatShading: true,
            wireframe: false,
        } )

        this.material.onBeforeCompile = function ( shader ) {
            shader.uniforms.uTime = { value: 0.0 }

            shader.fragmentShader = fragmentShader.glsl
            shader.vertexShader = vertexShader.glsl

            scope.material.userData.shader = shader
        }

        setTimeout( () => console.log( this.material.userData.shader ), 2000 )

        this.mesh = new engine.m3d.mesh.default( this.geometry, this.material )
        this.mesh.rotation.x = engine.m3d.util.math.degToRad( -90 )
    }

    init ( object3d ) {
        return new Promise( resolve => {
            if ( object3d ) object3d.add( this.mesh )

            this.initialized = true

            resolve()
        } )
    }

    update () {
        const shader = this.material.userData.shader

        if ( shader && shader.uniforms.uTime ) {
            shader.uniforms.uTime.value = this.clock.getElapsedTime()

            this.geometry.attributes.position.needsUpdate = true
        }
    }
}

export { Water_LowPoly_Shader }