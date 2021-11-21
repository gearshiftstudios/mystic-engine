import * as engine from '../../mystic.module.js'
import * as fragmentShader from './shaders/lowpoly-shader.fragment.shader.js'
import * as vertexShader from './shaders/lowpoly-shader.vertex.shader.js'

const defaults = {
    amplitude: 0.05,
    color: 0x326e59,
    flatShading: true,
    geometry: 'plane',
    opacity: 0.7,
    size: 10,
    shiny: false,
    wireframe: false,
}

class Water_LowPoly_Shader {
    constructor (
        options = {
            amplitude: defaults.amplitude,
            color: defaults.color,
            flatShading: defaults.flatShading,
            geometry: defaults.geometry,
            opacity: defaults.opacity,
            shiny: defaults.shiny,
            wireframe: defaults.wireframe,
        },

        ...geometryParams
    ) {
        const scope = this

        this.params = {
            options: {
                amplitude: options.amplitude ? options.amplitude : defaults.amplitude,
                color: options.color ? options.color : defaults.color,
                flatShading: options.flatShading ? options.flatShading : defaults.flatShading,
                geometry: options.geometry ? options.geometry : defaults.geometry,
                opacity: options.opacity ? options.opacity : defaults.opacity,
                shiny: options.shiny ? options.shiny : defaults.shiny,
                wireframe: options.wireframe ? options.wireframe : defaults.wireframe,
            }
        }

        this.clock = new engine.m3d.clock()
        this.geometry = new engine.m3d.geometry.buffer[ this.params.options.geometry ]( ...geometryParams ) // new engine.m3d.geometry.buffer.plane( width, height, widthDetail, heightDetail )
        this.initialized = false
        
        this.material = new engine.m3d.mat.mesh[ this.params.options.shiny ? 'phong' : 'standard' ]( {
            color: this.params.options.color,
            flatShading: this.params.options.flatShading,
            opacity: this.params.options.opacity,
            transparent: true,
            wireframe: this.params.options.wireframe,
        } )

        this.material.onBeforeCompile = function ( shader ) {
            shader.uniforms.uTime = { value: 0.0 }
            shader.uniforms.waveAmp = { value: scope.params.options.amplitude }

            shader.fragmentShader = `${ fragmentShader.beforeVoid }\n` + shader.fragmentShader
            shader.vertexShader = `${ vertexShader.beforeVoid }\n` + shader.vertexShader

            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `${ vertexShader.beginVoid }\n`
            )

            shader.vertexShader = shader.vertexShader.replace(
                `#include <fog_vertex>`,
                `${ vertexShader.positionVoid }\n`
            )

            scope.material.userData.shader = shader
        }

        this.mesh = new engine.m3d.mesh.default( this.geometry, this.material )
        this.mesh.rotation.x = engine.m3d.util.math.degToRad( -90 )
        this.mesh.receiveShadow = true
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