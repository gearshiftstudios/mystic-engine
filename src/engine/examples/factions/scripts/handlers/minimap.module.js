import * as engine from '../../../../scripts/rep.module.js'

import { Program_Module } from '../module.module.js'
import * as handler_macromap from './macromap.module.js'

class Handler_Minimap extends Program_Module {
    constructor ( category = 'Minimap Handler' ) {
        super( category )

        const scope = this

        this.initialized = false
        this.camera = new engine.m3d.camera.flat( 0, 0, 0, 0 )
        this.viewport = document.getElementById( 'minimap-view' )

        this.renderers = { 
            webgl: new engine.m3d.renderer.webgl(), 
            css: null 
        }

        this.update = {
            all: function () {
                return new Promise( resolve => {
                    this.render().then( () => {
                        this.projection().then( () => {
                            this.pixels().then( () => {
                                resolve()
                            } )
                        } )
                    } )
                } )
            },
            render: () => {
                return new Promise( resolve => {
                    this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
                    this.renderers.webgl.setSize( this.viewport.offsetWidth, this.viewport.offsetHeight )

                    resolve()
                } )
            },
            pixels: () => {
                return new Promise( resolve => {
                    this.renderers.webgl.render(
                        program.environments.main.scene,
                        this.camera
                    )

                    resolve()
                } )
            },
            projection: () => {
                return new Promise( resolve => {
                    this.camera = new engine.m3d.camera.flat(
                        handler_macromap.group.size.width / -2,
                        handler_macromap.group.size.width / 2,
                        handler_macromap.group.size.height / 2,
                        handler_macromap.group.size.height / -2,
                        -handler_macromap.group.size.width,
                        10
                    )

                    this.camera.lookAt( new engine.m3d.vec3( 0, -1, 0 ) )
                    this.camera.updateProjectionMatrix()

                    resolve()
                } )
            },
        }
    }

    generate () {
        return new Promise( resolve => {
            this.update.all().then( () => {
                program.environments.main.scene.add( this.camera )

                this.renderers.webgl.outputEncoding = engine.m3d.encoding.gamma
                this.renderers.webgl.gammaFactor = 2.2
                this.renderers.webgl.shadowMap.enabled = false
                this.renderers.webgl.domElement.style.pointerEvents = 'auto'

                this.viewport.appendChild( this.renderers.webgl.domElement )

                this.initialized = true

                resolve()
            } )
        } )
    }

    init () {
        return new Promise( resolve => {
            const scope = this

            this.viewport.onclick = function ( e ) {
                const bounds = this.getBoundingClientRect()

                const wx = e.clientX - bounds.left,
                    wy = e.clientY - bounds.top

                const msw = handler_macromap.group.size.width,
                    msh = handler_macromap.group.size.height,
                    intx = msw / bounds.width,
                    inty = msh / bounds.height,
                    bx = -msw / 2,
                    by = -msh / 2

                scope.moveTo(
                    bx + ( wx * intx ),
                    by + ( wy * inty ),
                )
            }

            resolve()
        } )
    }

    moveTo ( x, z ) {
        program.environments.main.controls.panTo( x, z )
    }
}

const MINIMAPREP = new Handler_Minimap()

export { MINIMAPREP as rep }