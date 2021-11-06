/* import REPs */ 
import * as reps from '../../mystic.module.js'

/* import M3D */ 
import * as m3d_renderer_css from '../renderers/css2d.module.js'
import * as m3d_controls from '../controls/orbit.module.js'

class Environment {
    constructor ( container = document.body, options = {} ) {
        this.loader = {
            texture: new reps.m3d.loader.texture()
        }

        const defaults = {
            alwaysResize: false,

            camera: {
                far: 2000,
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

        camera = new defaults.camera.type(
            defaults.camera.fov, 
            container.isDOMElement ? container.offsetWidth / container.offsetHeight : document.body.offsetWidth / document.body.offsetHeight, 
            defaults.camera.near, 
            defaults.camera.far 
        ) 

        // camera = new reps.m3d.camera.flat( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -2000, 2000 )
        
        this.alwaysResize = !options ? defaults.alwaysResize : !options.alwaysResize ? defaults.alwaysResize : typeof options.alwaysResize == 'boolean' ? options.alwaysResize : defaults.alwaysResize
        this.camera = !options ? camera : !options.camera ? camera : options.camera.isCamera ? options.camera : camera
        this.container = container ? container : document.body
        this.lights = {}
        this.MUID = `environment.${ reps.m3d.MUID.generate() }`
        this.scene = !options ? new reps.m3d.scene() : !options.scene ? new reps.m3d.scene() : options.scene.isScene ? options.scene : new reps.m3d.scene()

        this.renderers = {
            css2d: new m3d_renderer_css.renderer(),
            webgl: new reps.m3d.renderer.webgl( { 
                // alpha: true,
                antialias: true
            } ),
        }

        defaults.controls = new m3d_controls.orbit( this.camera, this.renderers.webgl.domElement )

        this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
        this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
        this.renderers.webgl.outputEncoding = reps.m3d.encoding.gamma
        this.renderers.webgl.gammaFactor = 2.2
        this.renderers.webgl.shadowMap.enabled = true
        this.renderers.webgl.shadowMap.type = reps.m3d.shadow.map.pcfSoft
        this.renderers.webgl.domElement.style.pointerEvents = 'auto'

        this.container.appendChild( this.renderers.webgl.domElement )

        this.renderers.css2d.setSize( this.container.offsetWidth, this.container.offsetHeight )
		this.renderers.css2d.domElement.style.position = 'absolute'
		this.renderers.css2d.domElement.style.top = '0px'
        this.renderers.css2d.domElement.style.pointerEvents = 'none'

        this.container.appendChild( this.renderers.css2d.domElement )

        this.controls = !options ? defaults.controls : !options.controls ? defaults.controls  : options.controls.isControls ? options.controls : defaults.controls 
        this.controls.shouldUpdate = true
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.035
        this.controls.screenSpacePanning = false
        this.controls.rotateSpeed = 1
        this.controls.zoomSpeed = 0.3
        this.controls.minDistance = 10
        this.controls.maxDistance = 300
        this.controls.enablePan = true

        this.camera.position.set( 21, 32, -21 ) // ortho - 225.38, 281.34, 288.30
        // this.camera.rotation.set( -0.7861, 0.5200, 0.4618 ) // perspective - don't alter
        // this.camera.zoom = 1.8506178062217096 // perspective - don't alter
        this.camera.updateMatrixWorld()

		this.controls.target = new reps.m3d.vec3( 0, 0, 0 ) // perspective - 69.1, 5, 132.9

        this.scene.background = new reps.m3d.color( 0x000000 )

        /* add hemisphere light */ 
        this.lights.hemisphere = new reps.m3d.light.hemisphere( 0xffffff, 0xffffff, 0.6 ) // create the hemisphere light
        this.lights.hemisphere.color.setHSL( 0.6, 0.75, 0.5 ) // set color of hemisphere light
        this.lights.hemisphere.groundColor.setHSL( 0.095, 0.5, 0.5 ) // set ground color of hemisphere light
        this.lights.hemisphere.position.set( 0, 500, 0 ) // change position of hemisphere light

        this.scene.add( this.lights.hemisphere ) // add hemisphere light to the scene

        /* add sun light */ 
        this.lights.sun = new reps.m3d.light.directional( 0xffffff, 1 ) // create the sun light
        this.lights.sun.position.set( 250, 250, -250 ) // change position of sun light

        /* modify the sun light's shadow properties */ 
        this.lights.sun.castShadow = true // allow sun light to cast a shadow

        this.lights.sun.shadow.camera.near = 0.000001 
        this.lights.sun.shadow.camera.far = 2000
        this.lights.sun.shadow.camera.right = 500
        this.lights.sun.shadow.camera.left = -500
        this.lights.sun.shadow.camera.top = 500
        this.lights.sun.shadow.camera.bottom = -500
        
        this.lights.sun.shadow.mapSize.width = 100000
        this.lights.sun.shadow.mapSize.height = 100000
        this.lights.sun.shadowBias = 0.1

        this.scene.add( this.lights.sun ) // add sun light to the scene

        this.enableSkybox()
    }

    enableSkybox () {
        const skybox = this.loader.texture.load( '../../assets/textures/skybox/sky.9.jpeg', () => {
			const rt = new reps.m3d.webgl.renderTarget.cube( skybox.image.height )
			rt.fromEquirectangularTexture( this.renderers.webgl, skybox )

			this.scene.background = rt.texture
		} )
    }

    render () {
        if ( this.container.isShowing == true ) {
            this.renderers.css2d.render( this.scene, this.camera )
            this.renderers.webgl.render( this.scene, this.camera )

            if ( this.controls.shouldUpdate ) this.controls.update()
        }
    }

    resize () {
        return new Promise( resolve => {
            this.renderers.css2d.setPixelRatio( window.devicePixelRatio )
            this.renderers.webgl.setPixelRatio( window.devicePixelRatio )

            switch ( this.alwaysResize ) {
                case false:
                    if ( this.container.isShowing == true ) {
                        this.renderers.css2d.setSize( this.container.offsetWidth, this.container.offsetHeight )
                        this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
                    }
    
                    break
                case true:
                    this.renderers.css2d.setSize( this.container.offsetWidth, this.container.offsetHeight )
                    this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
                    break
            }

            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
            this.camera.updateProjectionMatrix()

            resolve()
        } )
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