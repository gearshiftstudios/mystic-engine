/* Import engine-side scripts */ 
import * as engine from '../../../scripts/mystic.module.js'
import { EProg } from '../../../scripts/eprog.module.js'
import * as stats from '../../../scripts/libs/stats.module.js'

import { Ammo } from '../../../scripts/libs/ammo.module.js'
import { Minimap } from '../../../scripts/m3d/minimap/planets.module.js'
import { Universe } from '../../../scripts/m3d/planets/universe.module.js'
import * as m3d_loader_gltf from '../../../scripts/m3d/loaders/gltfe.module.js'
import * as gsap from '../../../scripts/libs/gsap/gsap.module.js'

/* Create program class */ 
class Program extends EProg {
    constructor ( name, mainEnvContainer, options ) {
        super( name, mainEnvContainer, options )

        this.gsap = gsap

        this.loaders = {
            gltf: new m3d_loader_gltf.eLoader()
        }

        this.universe = new Universe( 500 )
        this.universe.addComponent( 'stars' )

        this.universe.addPlanets( 20, planet => {
            const planetColor = engine.math.random.color.hex(),
                asteroidColor = engine.math.random.color.hex()

            planet.addComponent(
                'asteroid-belt',
                engine.math.random.number.between( 40, 70 ),
                ( planet.params.size / 2 ) + 4,
                4,
                engine.math.random.number.between( 0.5, 0.75 ),
                0,
                asteroidColor
            )

            planet.addComponent( 'ocean', {
                color: planetColor,
                amplitude: 0.1,
                geometry: 'icosahedron',
                shiny: false,
            }, ( planet.params.size / 2 ) + 0.2, planet.params.detail )

            document.body.querySelector( '#planets' )
                .querySelector( 'scrollbox' ).innerHTML += `
                    <item id='${ planet.name }' index='${ planet.index }'>
                        <icon planet></icon>
                        <span>${ planet.name }</span>
                        <square style='background-color: ${ planetColor };'></square>
                        <square style='background-color: ${ asteroidColor };'></square>
                    </item>
                `
        }, '18,30' )

        this.minimap = new Minimap(
            document.querySelector( '#planets-map' ).querySelector( 'minimap' ),
            this.universe.planets,
            this.universe.planetSpread,
            this.universe.planetSpread,
            this.universe.planetSpread,
            25
        )

        this.temp = {
            mixer: null,
            clock: new engine.m3d.clock()
        }

        /* Define animation loop */ 
        this.animate = () => {
            stats.element.begin()

            var delta = this.temp.clock.getDelta()

            if ( this.universe.initialized ) this.universe.updateComponents()

            if ( this.minimap.initialized ) this.minimap.updateVectors(
                this.environments.main.camera,
                this.minimap.viewPlane
            )

            this.environments.main.render()

            stats.element.end()

            requestAnimationFrame( this.animate )
        }
    }

    init () {
        Ammo().then( ( data ) => {
            this.environments.main.initPhysics( data )

            /* initialize core element prototypes */
            engine.core.init().then( () => {
                engine.ui.cursors.multiload( ...engine.cursors.examples ).then( () => {
                    engine.ui.cursors.set( 'auto.standard' ).then( () => {
                        // stats.init().then( () => {
                            this.universe.init( this.environments.main.scene ).then( () => {
                                this.universe.initPlanetsDOM( this.environments.main.controls, this.environments.main.lights.sun ).then( () => {
                                    this.minimap.init( this.environments.main.scene ).then( () => {
                                        this.modifyControls().then( () => {
                                            this.playMusic().then( () => {
                                                this.addDOM().then( () => {
                                                    requestAnimationFrame( this.animate )
                                                } )
                                            } )
                                        } )
                                    } )
                                } )
                            } )
                        // } )
                    } )
                } )
            } )
        } )
    }

    addDOM () {
        return new Promise( resolve => {
            engine.ui.createTextboxABS( 
                `This example shows off some uses of the <txt-i>Mystic Engine</txt-i>. Obviously it includes some of the <txt-i>Universe</txt-i> and <txt-i>Planetary components</txt-i> such as <txt-s>Stars</txt-s> and <txt-s>Asteroid Belts</txt-s>. For the planet surfaces, it uses the <txt-s>WebGL Low-Poly Water Shader</txt-s> component. They are randomly colored as well. Added is the <txt-i>Bokeh Effect</txt-i> that can be toggled in the default <txt-i>Enviroment's</txt-i> options. You can clearly see the effects of the post-proccessing when looking at the planets off in the distance and asteroids that are really close to the camera. There are <txt-n>20</txt-n> planets to view. You can view a planet individually by selecting one on the list on the top-right of the screen. This will smoothly bring you to orbit of the planet. Using the <txt-s>Planetary Minimap</txt-s> component, you can also see the positions of the planet within the universe's boundaries on the bottom-right.`,
                'lt', 
                false, 
                document.body, 
                'description', 

                {
                    fontFamily: 'Montserrat',
                    fontSize: '14px',
                    height: '250px',
                    lineHeight: '20px',
                    margin: '10px',
                    padding: '10px 15px 10px 15px',
                    width: '375px',
                }
            ).then( element => {
                engine.ui.append( element ).then( () => {
                    resolve()
                } )
            } )
        } )
    }

    modifyControls () {
        return new Promise ( resolve => {
            const tl = new gsap.TimelineMax()

            this.environments.main.camera.position.set( 40, 0, 40 )
            this.environments.main.controls.minDistance = ( ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3 ) * 2
            this.environments.main.controls.maxDistance = ( ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3 ) * 2

            tl.to( this.environments.main.controls, 3, {
                minDistance: ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3,
                    maxDistance: ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3,
                    ease: gsap.Elastic.easeOut.config( 1, 0.3 )
            } )

            wait.seconds( () => {
                this.environments.main.controls.minDistance = ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3
                this.environments.main.controls.maxDistance = ( ( this.universe.planetByIndex( 0 ).params.size / 2 ) * 3 ) * 2
            }, 4 )

            resolve()
        } ) 
    }

    playMusic () {
        return new Promise( resolve => {
            const listener = new engine.m3d.audio.listener()
            this.environments.main.camera.add( listener )

            this.music = new engine.m3d.audio.positional( listener )

            /* load a sound and set it as the PositionalAudio object's buffer */
            const audioLoader = new engine.m3d.loader.audio()
            audioLoader.load( './sounds/music/spatialsolitude.loop.mp3', buffer => {
                this.music.setBuffer( buffer )
                this.music.setRefDistance( this.universe.planetSpread )
                this.music.loop = true
                this.music.autoplay = true
            } )

            this.universe.group.add( this.music )

            document.body.onpointerdown = () => {
                if ( program.music ) program.music.play()
            }

            resolve()
        } )
    }
}

/* Create program */ 
window.program = new Program(
    'Sail Example',
    document.body,
    {
        attachLightToCamera: true,
        planetary: true,
    }
)

/* Initialize and run the program */ 
window.program.init()