/* import REPs */ 
import * as reps from '../../rep.module.js'

/* import M3D */ 
import * as renderers_css from '../renderers/css.module.js'
import * as controls_main from '../controls/orbit.module.js'

class Environment {
    constructor ( container = document.body, options = {} ) {	
        const defaults = {
            alwaysResize: false,

            camera: {
                far: 1000,
                fov: 75,
                near: 1, 
                type: reps.m3d.camera.depth,
            },
            renderers: {
                webgl: {
                    antialias: true,
                }
            },
        },

        aspect = window.innerWidth / window.innerHeight,
        frustumSize = 1000,

        // camera = new defaults.camera.type(
        //     defaults.camera.fov, 
        //     container.isDOMElement ? container.offsetWidth / container.offsetHeight : document.body.offsetWidth / document.body.offsetHeight, 
        //     defaults.camera.near, 
        //     defaults.camera.far 
        // ) 
        camera = new reps.m3d.camera.flat( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -2000, 2000 )
        
        this.alwaysResize = !options ? defaults.alwaysResize : !options.alwaysResize ? defaults.alwaysResize : typeof options.alwaysResize == 'boolean' ? options.alwaysResize : defaults.alwaysResize
        this.camera = !options ? camera : !options.camera ? camera : options.camera.isCamera ? options.camera : camera
        this.container = container.isDOMElement ? container : document.body
        this.MUID = `environment.${ reps.m3d.util.math.MUID.generate() }`
        this.scene = !options ? new reps.m3d.scene() : !options.scene ? new reps.m3d.scene() : options.scene.isScene ? options.scene : new reps.m3d.scene()

        this.renderers = {
            css: new renderers_css.r2d(),

            webgl: new reps.m3d.renderer.webgl( { 
                // alpha: true,
                antialias: !options ? defaults.renderers.webgl.antialias : !options.rendererAntialias ? defaults.renderers.webgl.antialias : 
                    typeof options.rendererAntialias == 'boolean' ? options.rendererAntialias : defaults.renderers.webgl.antialias,
            } ),
        }

        defaults.controls = new controls_main.map( this.camera, this.renderers.webgl.domElement )

        this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
        this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
        this.renderers.webgl.outputEncoding = reps.m3d.encoding.gamma
        this.renderers.webgl.gammaFactor = 2
        this.renderers.webgl.shadowMap.enabled = true
        this.renderers.webgl.domElement.style.pointerEvents = 'auto'

        this.container.appendChild( this.renderers.webgl.domElement )

        this.controls = !options ? defaults.controls : !options.controls ? defaults.controls  : options.controls.isControls ? options.controls : defaults.controls 
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.035
        this.controls.screenSpacePanning = false
        this.controls.minPolarAngle = 0.77
        this.controls.maxPolarAngle = 0.77
        this.controls.rotateSpeed = 1
        this.controls.zoomSpeed = 3
        this.controls.minDistance = 10
        this.controls.maxDistance = 300
        this.controls.enablePan = true

        this.camera.position.set( 225.38, 281.34, 288.30 ) // perspective - 194.6, 398.8, 310.9
        this.camera.rotation.set( -0.7861, 0.5200, 0.4618 ) // perspective - don't alter
        this.camera.zoom = 1.8506178062217096 // perspective - don't alter
        this.camera.updateMatrixWorld()

		this.controls.target = new reps.m3d.vec3( 1.77, 5, 12.37 ) // perspective - 69.1, 5, 132.9

        this.scene.background = new reps.m3d.color( 0xffffff )

        // M3DREP.create.skybox( `${ EPATH }assets/textures/skybox/space.1.jpeg`, this.renderers.webgl, this.scene )

        // return `Evironment created at ${ HTIME.get().full() }`
    }

    render () {
        if ( this.container.isShowing == true ) {
            this.renderers.webgl.render( this.scene, this.camera )
            this.renderers.css.render( this.scene, this.camera )

            if ( this.controls.enabled ) this.controls.update()
        }
    }

    resize () {
        switch ( this.alwaysResize ) {
            case false:
                if ( this.container.isShowing == true ) {
                    this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
                    this.renderers.css.setSize( this.container.offsetWidth, this.container.offsetHeight )
                }

                break
            case true:
                this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
                this.renderers.css.setSize( this.container.offsetWidth, this.container.offsetHeight )
                break
        }
    }
}

Environment.prototype.isEnvironment = true


   const create = ( ...args ) => {
        const environment = new Environment( ...args )

        return {
            modify: function ( options ) {
                reps.m3d.modify( environment, options )

                return {
                    retrieve: this.retrieve, 
                    store: this.store,
                }
            },
            retrieve: function () {
                return environment
            },
            store: function () { 
                reps.m3d.storage.store( environment ) 

                return {
                    retrieve: this.retrieve, 
                }
            },
        }
    }

export { create, Environment as class }