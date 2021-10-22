import * as engine from '../../../../../scripts/rep.module.js'
import * as m3d_controls from '../../../../../scripts/m3d/controls/orbit.module.js'
import * as m3d_renderers_css from '../../../../../scripts/m3d/renderers/css.module.js'

import { group } from '../../handlers/macromap.module.js'

var camera, controls, scene

const lights = {},
    loaders = {}

const renderer = [ {
    webgl: null,
    css: null,
}, 0, 0 ]

function init( canvas, width, height, pixelRatio ) {
    return new Promise( resolve => {
        loaders.texture = new engine.m3d.loader.texture()

	    camera = new engine.m3d.camera.depth( 75, width / height, 0.1, 1000 )
        camera.position.set( 0, 32, 0 )
        camera.updateMatrixWorld()

	    scene = new engine.m3d.scene()
	    scene.background = new engine.m3d.color( 0x0000ff )

        // const cube = engine.m3d.mesh.default( 
        //     new engine.m3d.geometry.buffer.icosahedron( 5, 8 ),
        //     new engine.m3d.material.mesh.basic( { color: 0xff0000 } )
        // )

	    renderer[ 0 ].webgl = new engine.m3d.renderer.webgl( { antialias: true, canvas: canvas } )
	    renderer[ 0 ].webgl.setPixelRatio( pixelRatio )
	    renderer[ 0 ].webgl.setSize( width, height, false )

        /* add hemisphere light */ 
        lights.hemisphere = new engine.m3d.light.hemisphere( 0xffffff, 0xffffff, 0.6 ) // create the hemisphere light
        lights.hemisphere.color.setHSL( 0.6, 0.75, 0.5 ) // set color of hemisphere light
        lights.hemisphere.groundColor.setHSL( 0.095, 0.5, 0.5 ) // set ground color of hemisphere light
        lights.hemisphere.position.set( 0, 500, 0 ) // change position of hemisphere light

        this.scene.add( lights.hemisphere ) // add hemisphere light to the scene

        /* add sun light */ 
        lights.sun = new engine.m3d.light.directional( 0xffffff, 1 ) // create the sun light
        lights.sun.position.set( -250, 250, 250 ) // change position of sun light

        /* modify the sun light's shadow properties */ 
        lights.sun.castShadow = true // allow sun light to cast a shadow

        lights.sun.shadow.camera.near = 0.000001 
        lights.sun.shadow.camera.far = 2000
        lights.sun.shadow.camera.right = 500
        lights.sun.shadow.camera.left = -500
        lights.sun.shadow.camera.top = 500
        lights.sun.shadow.camera.bottom = -500
    
        lights.sun.shadow.mapSize.width = 50000
        lights.sun.shadow.mapSize.height = 50000

        scene.add( lights.sun ) // add sun light to the scene

        renderer[ 1 ] = width
        renderer[ 2 ] = height
        
        scene.add( group )

        // enableSkybox()
	    animate()

        resolve()
    } )
}

function animate() {
	renderer[ 0 ].webgl.render( scene, camera )

    if ( controls && controls.enabled ) controls.update()

	if ( self.requestAnimationFrame ) self.requestAnimationFrame( animate )
}

// function enableSkybox () {
//     const skybox = loaders.texture.load( '../../assets/textures/skybox/sky.9.jpeg', () => {
//         const rt = new engine.m3d.webgl.renderTarget.cube( skybox.image.height )
//         rt.fromEquirectangularTexture( renderer[ 0 ].webgl, skybox )

//         scene.background = rt.texture
//     } )
// }

function initControls () {
    return new Promise( resolve => {
        controls = new m3d_controls.orbit( camera, renderer[ 0 ].webgl.domElement )
        controls.enableDamping = true
        controls.dampingFactor = 0.035
        controls.screenSpacePanning = false
        controls.rotateSpeed = 1
        controls.zoomSpeed = 0.3
        controls.minDistance = 10
        controls.maxDistance = 300
        controls.enablePan = true
        controls.target = new engine.m3d.vec3( 0, 0, 0 )

        resolve()
    } )
}

function resize () {
    if ( renderer[ 0 ].webgl && renderer[ 0 ].css ) {
        renderer[ 0 ].webgl.setSize( renderer[ 1 ], renderer[ 2 ] )
    }
}

export { 
    camera, 
    controls, 
    lights, 
    renderer, 
    scene, 
    init, 
    initControls,
    resize 
}