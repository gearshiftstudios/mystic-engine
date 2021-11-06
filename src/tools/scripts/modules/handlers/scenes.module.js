import * as engine from '../../../../engine/scripts/mystic.module.js'
import * as m3d_controls_orbit from '../../../../engine/scripts/m3d/controls/orbit.module.js'
import * as m3d_controls_transform from '../../../../engine/scripts/m3d/controls/transform.module.js'
import * as m3d_loader_gltfe from '../../../../engine/scripts/m3d/loaders/gltfe.module.js'
import * as lib_stats from '../../../../engine/scripts/libs/stats.module.js'

class UI_Scene {
    constructor ( container, isChildView = false ) {
        this.container = container.querySelector( 'renderer' )
        this.webglMemoryOutput = container.querySelector( 'renderer-memory' )
        this.webglDataOutput = container.querySelector( 'renderer-data' )
        this.fpsOutput = container.querySelector( 'renderer-fps' )
        this.lights = {}
        this.stats = new lib_stats.class( this.fpsOutput )

        this.helper = {
            grid: new engine.m3d.helper.grid( 1000, 1000, 0x00ff00, 0x424242 ),
        }

        this.loader = {
            gltf: new m3d_loader_gltfe.eLoader(),
            texture: new engine.m3d.loader.texture(),
        }

        // aspect = window.innerWidth / window.innerHeight,
        // frustumSize = 1000,
        // camera = new engine.m3d.camera.flat( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -2000, 2000 )

        this.camera = new engine.m3d.camera.depth( 60, this.container.offsetWidth / this.container.offsetHeight, 0.1, 2000 )
        this.controls = {}
        this.MUID = `environment.${ engine.m3d.MUID.generate() }`
        this.scene = new engine.m3d.scene()

        this.renderers = {
            webgl: new engine.m3d.renderer.webgl( { alpha: true, antialias: true } ),
        }

        this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
        this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )
        this.renderers.webgl.outputEncoding = engine.m3d.encoding.gamma
        this.renderers.webgl.gammaFactor = 2.2
        this.renderers.webgl.shadowMap.enabled = true
        this.renderers.webgl.shadowMap.type = engine.m3d.shadow.map.pcfSoft
        this.renderers.webgl.domElement.style.pointerEvents = 'auto'

        this.container.appendChild( this.renderers.webgl.domElement )

        this.controls.orbit = new m3d_controls_orbit.orbit( this.camera, this.renderers.webgl.domElement )
        this.controls.orbit.shouldUpdate = true
        this.controls.orbit.screenSpacePanning = false
        this.controls.orbit.rotateSpeed = 1
        this.controls.orbit.zoomSpeed = 1
        this.controls.orbit.maxDistance = 300
        this.controls.orbit.enablePan = true

        this.camera.position.set( 15, 15, 15 )
        this.camera.updateMatrixWorld()

		this.controls.orbit.target = new engine.m3d.vec3( 0, 0, 0 ) // perspective - 69.1, 5, 132.9

        this.controls.transform = new m3d_controls_transform.controls( this.camera, this.renderers.webgl.domElement )
        this.controls.transform.setTranslationSnap( 0.1 )
		this.controls.transform.setRotationSnap( engine.m3d.util.math.degToRad( 15 ) )
		this.controls.transform.setScaleSnap( 0.25 )
		this.controls.transform.addEventListener( 'dragging-changed', e => {
		    this.controls.orbit.enabled = ! e.value
		} )

        this.scene.add( this.controls.transform )

        /* add hemisphere light */ 
        this.lights.hemisphere = new engine.m3d.light.hemisphere( 0xffffff, 0xffffff, 0.6 ) // create the hemisphere light
        this.lights.hemisphere.color.setHSL( 0.6, 0.75, 0.5 ) // set color of hemisphere light
        this.lights.hemisphere.groundColor.setHSL( 0.095, 0.5, 0.5 ) // set ground color of hemisphere light
        this.lights.hemisphere.position.set( 0, 500, 0 ) // change position of hemisphere light

        this.scene.add( this.lights.hemisphere ) // add hemisphere light to the scene

        /* add sun light */ 
        this.lights.sun = new engine.m3d.light.directional( 0xffffff, 1 ) // create the sun light
        this.lights.sun.position.set( -250, 250, 250 ) // change position of sun light

        /* modify the sun light's shadow properties */ 
        this.lights.sun.castShadow = true // allow sun light to cast a shadow

        this.lights.sun.shadow.camera.near = 0.000001 
        this.lights.sun.shadow.camera.far = 2000
        this.lights.sun.shadow.camera.right = 500
        this.lights.sun.shadow.camera.left = -500
        this.lights.sun.shadow.camera.top = 500
        this.lights.sun.shadow.camera.bottom = -500
        
        this.lights.sun.shadow.mapSize.width = 50000
        this.lights.sun.shadow.mapSize.height = 50000

        this.scene.add( this.lights.sun ) // add sun light to the scene

        this.scene.add( this.helper.grid )

        if ( isChildView ) {
            this.selected = null
            this.dom = {}
            this.inView = new engine.m3d.group()

            this.scene.add( this.inView )

            this.camera.position.set( 1.5, 1.5, 1.5 )
        } else {
            this.children = {}
            this.imports = new engine.m3d.group()

            this.camera.position.set( 6, 6, 6 )
        }
    }

    enableSkybox () {
        const skybox = this.loader.texture.load( './assets/textures/skybox/sky.9.jpeg', () => {
			const rt = new engine.m3d.webgl.renderTarget.cube( skybox.image.height )
			rt.fromEquirectangularTexture( this.renderers.webgl, skybox )

			this.scene.background = rt.texture
		} )
    }

    render () {
        this.stats.begin()

        this.renderers.webgl.render( this.scene, this.camera )

        if ( this.controls.orbit.shouldUpdate ) this.controls.orbit.update()

        this.webglMemoryOutput.insert( `
            Geometries: ${ this.renderers.webgl.info.memory.geometries }<br>
            Textures: ${ this.renderers.webgl.info.memory.textures }<br>
        ` )

        this.webglDataOutput.insert( `
            Render Calls: ${ this.renderers.webgl.info.render.calls }<br>
            Triangles: ${ this.renderers.webgl.info.render.triangles }<br>
            Points: ${ this.renderers.webgl.info.render.points }<br>
            Lines: ${ this.renderers.webgl.info.render.lines }<br>
        ` )

        this.stats.end()
    }

    resize () {
        return new Promise( resolve => {
            this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
            this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )

            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
            this.camera.updateProjectionMatrix()

            resolve()
        } )
    }
}

UI_Scene.prototype.isUISCene = true

class Handler_Scenes {
    constructor () {
        const scope = this

        this.child = new UI_Scene( document.getElementById( 'scene-view' ).querySelector( '#child-view' ), true )
        this.main = new UI_Scene( document.getElementById( 'scene-view' ).querySelector( '#main-view' ), false )

        this.main.scene.add( this.main.imports )

        this.update = {
            children: {
                list: {
                    dom: () => {
                        return new Promise( resolve => {
                            if ( !this.child.dom.list ) this.child.dom.list = App.body.group( 'scene-tools' ).tab( 'children' ).qS( 'scrollbox' )

                            this.child.dom.list.clear()
                
                            this.main.imports.children.forEach( c => {
                                this.child.dom.list.render( `
                                    <item id='${ c.name }'>
                                        <icon object></icon>
                                        <span>${ c.name }</span>
                                    </item>
                                ` )
                            } )
                
                            resolve()
                        } )
                    },
                    listeners: () => {
                        return new Promise( resolve => {
                            const children = this.child.dom.list.qSA( 'item' )

                            for ( let i = 0; i < children.length; i++ ) {
                                children[ i ].onclick = function () {
                                    const content = this.qS( 'span' ).getContent()

                                    scope.view.child( content )
                                }

                                children[ i ].onmouseenter = function () {
                                    this.style.backgroundColor = 'turquoise'
                                }

                                children[ i ].onmouseleave = function () {
                                    const content = this.qS( 'span' ).getContent()

                                    if ( content != scope.child.selected.name ) this.style.backgroundColor = 'transparent'
                                    else this.style.backgroundColor = 'rgb( 35, 123, 114 )'
                                }
                            }

                            resolve()
                        } )
                    },
                }
            }
        }

        this.view = {
            child: ( name ) => {
                const children = this.child.dom.list.qSA( 'item' ),

                    geometry = engine.m3d.storage.geometry[ name ],
                    material = engine.m3d.storage.materials[ name ],
                    meshdata = engine.m3d.storage.meshdata[ name ]

                for ( let i = 0; i < children.length; i++ ) children[ i ].style.backgroundColor = 'transparent'

                this.child.dom.list.querySelector( `#${ name }` ).style.backgroundColor = 'rgb( 35, 123, 114 )'

                this.main.controls.transform.attach( this.main.children[ name ] )

                if ( this.child.selected != null ) {
                    this.child.inView.remove( this.child.selected )

                    this.child.selected = null
                }

                this.child.selected = new engine.m3d.mesh.default( geometry, material )
                this.child.selected.name = name
                this.child.selected.rotation.set( meshdata.rotation.x, meshdata.rotation.y, meshdata.rotation.z )
                this.child.selected.scale.set( meshdata.scale.x, meshdata.scale.y, meshdata.scale.z )

                this.child.inView.add( this.child.selected )
            },
        }
    }

    render () {
        this.main.render()
        this.child.render()
    }

    resize () {
        this.main.resize()
        this.child.resize()
    }

    init () {
        return new Promise( resolve => {
            this.main.resize().then( () => {
                this.child.resize().then( () => {
                    this.main.loader.gltf.load( './engine/examples/factions/models/buildings/walls/palisade.gltf', model => {
                        if ( !engine.m3d.storage.geometry ) engine.m3d.storage.geometry = {}
                        if ( !engine.m3d.storage.materials ) engine.m3d.storage.materials = {}
                        if ( !engine.m3d.storage.meshdata ) engine.m3d.storage.meshdata = {}

                        model.scene.children.forEach( c => {
                            engine.m3d.storage.geometry[ c.name ] = c.geometry
                            engine.m3d.storage.materials[ c.name ] = c.material

                            engine.m3d.storage.meshdata[ c.name ] = {
                                position: c.position,
                                rotation: c.rotation,
                                scale: c.scale,
                            }
                        } )

                        for ( let i = 0; i < model.scene.children.length; i++ ) {
                            const meshdata = engine.m3d.storage.meshdata[ model.scene.children[ i ].name ]

                            this.main.children[ model.scene.children[ i ].name ] = new engine.m3d.mesh.default(
                                engine.m3d.storage.geometry[ model.scene.children[ i ].name ],
                                engine.m3d.storage.materials[ model.scene.children[ i ].name ]
                            )

                            this.main.children[ model.scene.children[ i ].name ].name = model.scene.children[ i ].name
                            this.main.children[ model.scene.children[ i ].name ].position.set( meshdata.position.x, meshdata.position.y, meshdata.position.z )
                            this.main.children[ model.scene.children[ i ].name ].rotation.set( meshdata.rotation.x, meshdata.rotation.y, meshdata.rotation.z )
                            this.main.children[ model.scene.children[ i ].name ].scale.set( meshdata.scale.x, meshdata.scale.y, meshdata.scale.z )

                            this.main.imports.add( this.main.children[ model.scene.children[ i ].name ] )
                        }

                        this.update.children.list.dom().then( () => {
                            this.update.children.list.listeners().then( () => {
                                this.main.controls.transform.attach( this.main.children[ Object.keys( this.main.children )[ 0 ] ] )
                                this.view.child( Object.keys( this.main.children )[ 0 ] )
                                
                                resolve()
                            } )
                        } )
                    } )
                } )
            } )
        } )
    }
}

const SCENESREP = new Handler_Scenes()

export { SCENESREP as rep, Handler_Scenes, UI_Scene }