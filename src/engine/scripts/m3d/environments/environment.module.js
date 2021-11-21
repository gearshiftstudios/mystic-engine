/* import REPs */ 
import * as reps from '../../mystic.module.js'

/* import M3D */ 
import * as m3d_renderer_css from '../renderers/css2d.module.js'
import { MovementControls } from '../controls/movement.module.js'
import { PlanetaryControls } from '../controls/planetary.module.js'
import * as m3d_effect_outline from '../effects/outline.module.js'
import * as m3d_bokeh_post1_shader from '../bokeh/post1.module.js'
import * as m3d_bokeh_post2_shader from '../bokeh/post2.module.js'

const defaults = {
    alwaysResize: true,
    attachLightToCamera: false,
    bokeh: true,
    cameraFar: 2000,
    cameraFOV: 75,
    cameraNear: 0.1,
    cameraType: 'depth',
    planetary: false,
}

class Environment {
    constructor (
        container = document.body,

        options = {
            alwaysResize: defaults.alwaysResize,
            attachLightToCamera: defaults.attachLightToCamera,
            bokeh: defaults.bokeh,
            cameraFar: defaults.cameraFar,
            cameraFOV: defaults.cameraFOV,
            cameraNear: defaults.cameraNear,
            cameraType: defaults.cameraType,
            planetary: defaults.planetary,
        }
    ) {
        this.params = {
            options: {
                alwaysResize: options.alwaysResize ? options.alwaysResize : defaults.alwaysResize,
                attachLightToCamera: options.attachLightToCamera ? options.attachLightToCamera : defaults.attachLightToCamera,
                bokeh: options.bokeh ? options.bokeh : defaults.bokeh,
                cameraFar: options.cameraFar ? options.cameraFar : defaults.cameraFar,
                cameraFOV: options.cameraFOV ? options.cameraFOV : defaults.cameraFOV,
                cameraNear: options.cameraNear ? options.cameraNear : defaults.cameraNear,
                cameraType: options.cameraType ? options.cameraType : defaults.cameraType,
                planetary: options.planetary ? options.planetary : defaults.planetary,
            }
        }

        this.loader = {
            texture: new reps.m3d.loader.texture()
        }

        const aspect = window.innerWidth / window.innerHeight,
            frustumSize = 1000

        // camera = new reps.m3d.camera.flat( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -2000, 2000 )
        
        this.alwaysResize = !options ? defaults.alwaysResize : !options.alwaysResize ? defaults.alwaysResize : typeof options.alwaysResize == 'boolean' ? options.alwaysResize : defaults.alwaysResize
        this.container = container ? container : document.body
        this.lights = {}
        this.MUID = `environment.${ reps.m3d.MUID.generate() }`
        this.scene = !options ? new reps.m3d.scene() : !options.scene ? new reps.m3d.scene() : options.scene.isScene ? options.scene : new reps.m3d.scene()

        this.bokeh = {
            camera: new Array(),
            material: new Array(),
            plane: new Array(),
            quad: new Array(),
            scene: new Array(),
            target: new Array(),
        }

        this.camera = new reps.m3d.camera[ this.params.options.cameraType ](
            this.params.options.cameraFOV, 
            container.isDOMElement ? container.offsetWidth / container.offsetHeight : document.body.offsetWidth / document.body.offsetHeight, 
            this.params.options.cameraNear, 
            this.params.options.cameraFar
        )

        this.scene.add( this.camera )

        this.renderers = {
            css2d: new m3d_renderer_css.renderer(),
            webgl: new reps.m3d.renderer.webgl( { 
                // alpha: true,
                antialias: true
            } ),
        }

        this.outlineEffect = new m3d_effect_outline.effect( this.renderers.webgl, {
            defaultThickness: 0.007,
            color: new reps.m3d.color( 0x000000 ),
            defaultAlpha: 0.8,
            defaultKeepAlive: true
        } )

        this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
        this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
        // this.renderers.webgl.outputEncoding = reps.m3d.encoding.srgb
        // this.renderers.webgl.gammaFactor = 2.2
        this.renderers.webgl.shadowMap.enabled = true
        this.renderers.webgl.shadowMap.type = reps.m3d.shadow.map.pcfSoft
        this.renderers.webgl.domElement.style.pointerEvents = 'auto'

        this.container.appendChild( this.renderers.webgl.domElement )

        this.renderers.css2d.setSize( this.container.offsetWidth, this.container.offsetHeight )
		this.renderers.css2d.domElement.style.position = 'absolute'
		this.renderers.css2d.domElement.style.top = '0px'
        this.renderers.css2d.domElement.style.pointerEvents = 'none'

        this.container.appendChild( this.renderers.css2d.domElement )

        /* bokeh stuff */ 

        // Create a multi render target with Float buffers
		this.bokeh.target[ 0 ] = new reps.m3d.webgl.renderTarget.default( 
            this.container.offsetWidth * this.renderers.webgl.getPixelRatio(), 
            this.container.offsetHeight * this.renderers.webgl.getPixelRatio()
        )
        
		this.bokeh.target[ 0 ].texture.format = reps.m3d.RGBFormat
		this.bokeh.target[ 0 ].texture.minFilter = reps.m3d.nearestFilter
		this.bokeh.target[ 0 ].texture.magFilter = reps.m3d.nearestFilter
		this.bokeh.target[ 0 ].texture.generateMipmaps = false
		this.bokeh.target[ 0 ].stencilBuffer = false
		this.bokeh.target[ 0 ].depthBuffer = true
		this.bokeh.target[ 0 ].depthTexture = new reps.m3d.texture.depth()
		this.bokeh.target[ 0 ].depthTexture.type = reps.m3d.UnsignedShortType

		this.bokeh.target[ 1 ] = new reps.m3d.webgl.renderTarget.default( 
            this.container.offsetWidth * this.renderers.webgl.getPixelRatio(), 
            this.container.offsetHeight * this.renderers.webgl.getPixelRatio()
        )

		this.bokeh.target[ 1 ].texture.format = reps.m3d.rgba.format
		this.bokeh.target[ 1 ].texture.minFilter = reps.m3d.nearestFilter
		this.bokeh.target[ 1 ].texture.magFilter = reps.m3d.nearestFilter
		this.bokeh.target[ 1 ].texture.generateMipmaps = false
		this.bokeh.target[ 1 ].stencilBuffer = false
		this.bokeh.target[ 1 ].depthBuffer = false

        // Setup post processing stage
		this.bokeh.camera[ 0 ] = new reps.m3d.camera.flat( - 1, 1, 1, - 1, 0, 1 )

		this.bokeh.material[ 0 ] = new reps.m3d.mat.shader( {
			vertexShader: m3d_bokeh_post1_shader.vertex,
			fragmentShader: m3d_bokeh_post1_shader.fragment,

			uniforms: {
				cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far },
                focalDepth: { value: 20 }, // 5
                farStart: { value: 100 }, // 7
                farRange: { value: 150 }, // 3
                nearStart: { value: 0 }, // 0.5
                nearRange: { value: 0 }, // 0.7
				tColor: { value: this.bokeh.target[ 0 ].texture },
                tDepth: { value: this.bokeh.target[ 0 ].depthTexture },
                textureWidth: { value: this.container.offsetWidth },
                textureHeight: { value: this.container.offsetHeight }
			}
		} )

		this.bokeh.plane[ 0 ] = new reps.m3d.geometry.buffer.plane( 2, 2 )
		this.bokeh.quad[ 0 ] = new reps.m3d.mesh.default( this.bokeh.plane[ 0 ], this.bokeh.material[ 0 ] )
		this.bokeh.scene[ 0 ] = new reps.m3d.scene()
        this.bokeh.scene[ 0 ].add( this.bokeh.quad[ 0 ] )

        this.bokeh.camera[ 1 ] = new reps.m3d.camera.flat( - 1, 1, 1, - 1, 0, 1 );

		this.bokeh.material[ 1 ] = new reps.m3d.mat.shader( {
			vertexShader: m3d_bokeh_post2_shader.vertex,
			fragmentShader: m3d_bokeh_post2_shader.fragment,

			uniforms: {
				tColor: { value: this.bokeh.target[ 1 ].texture },
				textureWidth: { value: this.container.offsetWidth },
                textureHeight: { value: this.container.offsetHeight },
			}
		} );

		this.bokeh.plane[ 1 ] = new reps.m3d.geometry.buffer.plane( 2, 2 )
		this.bokeh.quad[ 1 ] = new reps.m3d.mesh.default( this.bokeh.plane[ 1 ], this.bokeh.material[ 1 ] )
		this.bokeh.scene[ 1 ] = new reps.m3d.scene()
        this.bokeh.scene[ 1 ].add( this.bokeh.quad[ 1 ] )

        /* controls */ 
        this.controls = this.params.options.planetary == true ? new PlanetaryControls( this.camera, this.renderers.webgl.domElement, false ) :
            new MovementControls( this.camera, this.renderers.webgl.domElement, false )

        this.controls.shouldUpdate = true
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.035
        this.controls.rotateSpeed = 1
        this.controls.zoomSpeed = 0.3
        this.controls.minDistance = 2
        this.controls.maxDistance = 10
        this.controls.enablePan = true

        this.camera.position.set( -30, 32, 30 ) // ortho - 225.38, 281.34, 288.30
        // this.camera.rotation.set( -0.7861, 0.5200, 0.4618 ) // perspective - don't alter
        // this.camera.zoom = 1.8506178062217096 // perspective - don't alter
        this.camera.updateMatrixWorld()

		this.controls.target = new reps.m3d.vec3( 0, 0, 0 ) // perspective - 69.1, 5, 132.9

        this.scene.background = new reps.m3d.color( 0x000000 )

        /* add hemisphere light */ 
        this.lights.hemisphere = new reps.m3d.light.hemisphere( 0xffffff, 0xffffff, 0.6 ) // create the hemisphere light
        this.lights.hemisphere.color.setHSL( 0.6, 0.75, 0.5 ) // set color of hemisphere light
        this.lights.hemisphere.groundColor.setHSL( 0.095, 0.5, 0.5 ) // set ground color of hemisphere light

        this[ this.params.options.attachLightToCamera ? 'camera' : 'scene' ].add( this.lights.hemisphere ) // add hemisphere light to the scene

        if ( !this.params.options.attachLightToCamera ) this.lights.hemisphere.position.set( 0, 500, 0 ) // change position of hemisphere light

        /* add sun light */ 
        this.lights.sun = new reps.m3d.light.directional( 0xffffff, 1 ) // create the sun light

        /* modify the sun light's shadow properties */ 
        this.lights.sun.castShadow = true // allow sun light to cast a shadow

        this.lights.sun.shadow.camera.near = 0.000001 
        this.lights.sun.shadow.camera.far = 2000
        this.lights.sun.shadow.camera.right = 500
        this.lights.sun.shadow.camera.left = -500
        this.lights.sun.shadow.camera.top = 500
        this.lights.sun.shadow.camera.bottom = -500
        
        this.lights.sun.shadow.mapSize.width = 10000000
        this.lights.sun.shadow.mapSize.height = 10000000
        this.lights.sun.shadow.bias = 0.4

        this[ this.params.options.attachLightToCamera ? 'camera' : 'scene' ].add( this.lights.sun ) // add sun light to the scene

        if ( !this.params.options.attachLightToCamera ) this.lights.sun.position.set( 0, 250, -250 ) // change position of sun light

        this.scene.add( this.lights.sun.target )
    }

    enableSkybox ( image = '../../assets/textures/skybox/sky.9.jpeg' ) {
        return new Promise( resolve => {
            const skybox = this.loader.texture.load( image, () => {
                const rt = new reps.m3d.webgl.renderTarget.cube( skybox.image.height )
                rt.fromEquirectangularTexture( this.renderers.webgl, skybox )
    
                this.scene.background = rt.texture
            } )

            resolve()
        } )
    }

    render () {
        if ( this.container.isShowing == true ) {
            if ( this.params.options.bokeh ) {
                this.renderers.webgl.setRenderTarget( this.bokeh.target[ 0 ] )
				this.renderers.webgl.render( this.scene, this.camera )

				// render post FX
				this.renderers.webgl.setRenderTarget( this.bokeh.target[ 1 ] )
				this.renderers.webgl.render( this.bokeh.scene[ 0 ], this.bokeh.camera[ 0 ] )

				this.renderers.webgl.setRenderTarget( null )
				this.renderers.webgl.render( this.bokeh.scene[ 1 ], this.bokeh.camera[ 0 ] )
            } else {
                this.renderers.webgl.render( this.scene, this.camera )
            }

            this.renderers.css2d.render( this.scene, this.camera )

            // this.outlineEffect.render( this.scene, this.camera )

            if ( this.controls.shouldUpdate ) this.controls.update()
        }
    }

    resize () {
        return new Promise( resolve => {
            this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
            this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
            
            if ( this.params.options.bokeh ) {
                this.bokeh.target[ 0 ].setSize(
                    this.container.offsetWidth * this.renderers.webgl.getPixelRatio(), 
                    this.container.offsetHeight * this.renderers.webgl.getPixelRatio()
                )

                this.bokeh.target[ 1 ].setSize(
                    this.container.offsetWidth * this.renderers.webgl.getPixelRatio(), 
                    this.container.offsetHeight * this.renderers.webgl.getPixelRatio()
                )
            }

            this.renderers.css2d.setSize( this.container.offsetWidth, this.container.offsetHeight )

            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
            this.camera.updateProjectionMatrix()

            resolve()
        } )
    }

    initPhysics ( lib ) {
        this.physics = lib

        
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