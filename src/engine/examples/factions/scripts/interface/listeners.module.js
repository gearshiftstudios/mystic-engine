import * as engine from '../../../../scripts/mystic.module.js'
import { Settings } from '../settings.module.js'

const S = Settings,

    $Sa = 0, // active index
    $Se = 1, // enabled index

    SS = Settings.scene,
    SSM = Settings.scene.movement

let initialized = false

function recursive () {
    SSM.panning[ $Sa ].mouseRightDrag.isActive( 'switch' )
        .then( s => {
            if (
                !program.domevents.window.resizing.isOn() && 
                program.domevents.window.mouse.inside.isOn()
            ) {
                const speed = SSM.panning[ $Sa ].speed 
                    * program.mouse.distance.fromCenter 
                    * ( program.environments.main.camera.position.distanceTo(
                        program.environments.main.controls.target ) / 2 
                    )

                if ( s ) {
                    program.environments.main.controls.panLeft(
                        speed * Math.cos( program.mouse.angle.toCenter )
                    )

                    program.environments.main.controls.panUp(
                        speed * Math.sin( program.mouse.angle.toCenter )
                    )
                } else {
                    SSM.panning[ $Sa ].screenEdges.isEnabled( true )
                        .then( _s => {
                            if (
                                program.mouse.screen.x >= window.innerWidth - 15 ||
                                program.mouse.screen.x <= 15 ||
                                program.mouse.screen.y >= window.innerHeight - 15 ||
                                program.mouse.screen.y <= 15
                            ) {
                                program.environments.main.controls.panLeft(
                                    speed * Math.cos( program.mouse.angle.toCenter )
                                )
            
                                program.environments.main.controls.panUp(
                                    speed * Math.sin( program.mouse.angle.toCenter )
                                )
                            }
                        } )
                }               
            }
        } )
}

function init () {
    return new Promise( resolve => {
        const colors = {
            hover: {
                bad: 0xff0000,
                good: 0x00ff00,
            },
        }

        function click_buildModeTiles ( mode = 'settlement' ) {
            program.handlers.macromap.tiles.point.selected = new Array(
                ...program.handlers.macromap.tiles.point.hovered
            )

            program.handlers.macromap.tiles.selected = new Array(
                ...program.handlers.macromap.tiles.hovered
            )

            const point = program.handlers.macromap.tiles.point.selected[ 0 ].split( '.' )
            
            const maxHeight = program.handlers.macromap.getTileHeightMax(
                Number( point[ 0 ] ),
                program.macromap.allTiles[ Number( point[ 1 ] ) ].chunkTileIndex
            )
            program.macromap.allTiles[ Number( point[ 1 ] ) ].center[ 0 ] += 0.25
            program.macromap.allTiles[ Number( point[ 1 ] ) ].center[ 2 ] = maxHeight

            switch ( mode ) {
                case 'settlement':
                    program.handlers.macromap.updateSelectedTiles( maxHeight, 'settlement' )

                    program.handlers.settlements.generateTest(
                        program.macromap.allTiles[ Number( point[ 1 ] ) ].center[ 0 ],
                        program.macromap.allTiles[ Number( point[ 1 ] ) ].center[ 2 ],
                        program.macromap.allTiles[ Number( point[ 1 ] ) ].center[ 1 ]
                    )

                    break
            }
        }

        function mousemove_buildModeTiles () {
            if ( program.handlers.macromap.tiles.hovered.length > 0 ) {
                program.handlers.macromap.tiles.hovered.forEach( t => {
                    t = t.split( '.' )

                    program.handlers.macromap.colorTile(
                        Number( t[ 0 ] ), 
                        program.macromap.allTiles[ Number( t[ 1 ] ) ].chunkTileIndex
                    )

                    const tile = program.macromap.chunks[ Number( t[ 0 ] ) ]
                        .tiles[ program.macromap.allTiles[ Number( t[ 1 ] ) ].chunkTileIndex ]

                    if ( tile.treeInfo ) {
                        dummy.castShadow = true
                        dummy.receiveShadow = true

                        dummy.position.set( 
                            tile.treeInfo[ 3 ],
                            tile.treeInfo[ 4 ],
                            tile.treeInfo[ 5 ]
                        )

                        dummy.rotation.set( 
                            tile.treeInfo[ 6 ],
                            tile.treeInfo[ 7 ],
                            tile.treeInfo[ 8 ]
                        )

                        dummy.scale.set( 
                            tile.treeInfo[ 9 ],
                            tile.treeInfo[ 10 ],
                            tile.treeInfo[ 11 ]
                        )

                        dummy.updateMatrix()

                        program.macromap.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .setMatrixAt( tile.treeInfo[ 2 ], dummy.matrix )

                        program.macromap.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .instanceMatrix.needsUpdate = true
                    }
                } )
            }

            program.handlers.macromap.tiles.point.hovered = new Array()
            program.handlers.macromap.tiles.point.hovered.push( 
                `${ arguments[ 0 ][ 0 ] }.${ arguments[ 0 ][ 1 ] }`
            )
            
            program.handlers.macromap.tiles.hovered = new Array()
            
            for ( let i = 0; i < arguments.length; i++ ) {
                const tile = program.macromap.chunks[ arguments[ i ][ 0 ] ]
                    .tiles[ program.macromap.allTiles[ arguments[ i ][ 1 ] ].chunkTileIndex ]

                program.handlers.macromap.tiles.hovered.push( 
                    `${ arguments[ i ][ 0 ] }.${ arguments[ i ][ 1 ] }`
                )
    
                program.handlers.macromap.colorTile(
                    arguments[ i ][ 0 ], 
                    program.macromap.allTiles[ arguments[ i ][ 1 ] ].chunkTileIndex,
                    colors.hover.good
                )
    
                if ( tile.treeInfo ) {
                    dummy.castShadow = false
                    dummy.receiveShadow = false
                    dummy.position.y = -20
                    dummy.updateMatrix()
    
                    program.macromap.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                        .setMatrixAt( tile.treeInfo[ 2 ], dummy.matrix )
    
                    program.macromap.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                        .instanceMatrix.needsUpdate = true
                }
            }
        }

        engine.audio.store( './sounds/interface/button.mp3', 'button-click' )
        engine.audio.store( './sounds/interface/checkbox.mp3', 'checkbox-oninput' )
        engine.audio.store( './sounds/interface/slider.mp3', 'slider-oninput' )

        /* Create necessary window events */ 
        window.onresize = () => {
            program.domevents.window.resizing.toggle.wait.seconds( 1 )

            program.handlers.minimap.update.render().then( () => {
                program.handlers.minimap.update.pixels().then( () => {
                    program.environments.main.resize()
                } )
            } )
        }

        window.onclick = e => {
            if ( program.macromap.initialized ) {
                if (
                    program.modes.macrobuild[ 'single' ].isActive() ||
                    program.modes.macrobuild[ 'fort' ].isActive() ||
                    program.modes.macrobuild[ 'settlement' ].isActive()
                ) {
                    click_buildModeTiles ()
                }
            }
        }

        window.onmousemove = e => {
            const raycaster = new engine.m3d.ray.caster()
            raycaster.firstHitOnly = true

            if ( program.macromap.initialized ) {
                raycaster.setFromCamera( program.mouse.world, program.environments.main.camera )

                let intersections = raycaster.intersectObject( program.macromap.chunkMeshes, true )

                // if ( intersections.length > 0 ) {
                //     const intersectedChunk = {
                //         self: program.macromap.chunks[ intersections[ 0 ].object.chunkIndex ],
                //         index: intersections[ 0 ].object.chunkIndex,
                //         face: intersections[ 0 ].faceIndex,
                //     }

                //     const faces = intersectedChunk.self.faces

                //     if ( !faces[ intersectedChunk.face ].isCrust ) {
                //         if ( !program.handlers.macromap.chunks.point.hovered.includes( 
                //             intersectedChunk.index
                //         ) ) {
                //             program.handlers.macromap.chunks.point.hovered = new Array()
                //             program.handlers.macromap.chunks.point.hovered.push( intersectedChunk.index )
                //         }
                    
                //         if ( !program.handlers.macromap.tiles.point.hovered.includes( 
                //             `${ intersectedChunk.index }.${ faces[ intersectedChunk.face ].univTile }` 
                //         ) ) {
                //             if ( program.modes.macrobuild[ 'single' ].isActive() ) {
                //                 mousemove_buildModeTiles( [ intersectedChunk.index, faces[ intersectedChunk.face ].univTile ] )
                //             }

                //             if ( program.modes.macrobuild[ 'fort' ].isActive() ) {
                //                 const tiles = new Array()
                //                 tiles.push( [ intersectedChunk.index, faces[ intersectedChunk.face ].univTile ] )

                //                 program.macromap.allTiles[ faces[ intersectedChunk.face ].univTile ]
                //                     .adjacencies.forEach( a => {
                //                         tiles.push( [ program.macromap.allTiles[ a ].chunkIndex, a ] )
                //                     } )

                //                 mousemove_buildModeTiles( ...tiles )
                //             }

                //             if ( program.modes.macrobuild[ 'settlement' ].isActive() ) {
                //                 const tiles = new Array()
                //                 tiles.push( [ intersectedChunk.index, faces[ intersectedChunk.face ].univTile ] )

                //                 program.macromap.allTiles[ faces[ intersectedChunk.face ].univTile ]
                //                     .adjacencies.forEach( a => {
                //                         tiles.push( [ program.macromap.allTiles[ a ].chunkIndex, a ] )

                //                         program.macromap.allTiles[ a ].adjacencies.forEach( aa => {
                //                             tiles.push( [ program.macromap.allTiles[ aa ].chunkIndex, aa ] )
                //                         } )
                //                     } )

                //                 mousemove_buildModeTiles( ...tiles )
                //             }
                //         }
                //     }
                // }
            }
        }

        App.body.onpointermove = e => {
            program.mouse.screen.x = e.clientX
            program.mouse.screen.y = e.clientY
            program.mouse.world.x = ( e.clientX / window.innerWidth ) * 2 - 1
	        program.mouse.world.y = - ( e.clientY / window.innerHeight ) * 2 + 1
            
            program.mouse.angle.toCenter = Math.atan2(
                e.clientY - window.innerHeight / 2,
                e.clientX - window.innerWidth / 2
            )

            const distanceX = e.clientX - ( window.innerWidth / 2 ),
                distanceY = e.clientY - ( window.innerHeight / 2 )

            program.mouse.distance.fromCenter = Math.sqrt( ( distanceX * distanceX ) + ( distanceY * distanceY ) )

            App.body.qS( 'cursor-pan' ).style.left = `${ e.clientX }px`
            App.body.qS( 'cursor-pan' ).style.top = `${ e.clientY }px`

            App.body.qS( 'cursor-pan' ).style.transform = `translate( -32px, -16px ) rotateX( -${ program.environments.main.controls.getPolarAngle() }rad ) rotateZ( ${ program.mouse.angle.toCenter }rad )`
            App.body.qS( 'cursor-pan-center' ).style.transform = `translate( -16px, -16px ) rotateX( ${ program.environments.main.controls.getPolarAngle() }rad )`

            if ( SSM.panning[ $Se ] ) {
                if (
                    ( program.mouse.screen.x >= window.innerWidth - 15 ||
                    program.mouse.screen.x <= 15 ||
                    program.mouse.screen.y >= window.innerHeight - 15 ||
                    program.mouse.screen.y <= 15 ) &&
                    SSM.panning[ $Sa ].screenEdges.isEnabled()
                ) {
                    App.body.style.cursor = 'none'
                    App.body.qS( 'cursor-pan' ).show()
                } else {
                    if ( SSM.panning[ $Sa ].mouseRightDrag.isActive() ) {
                        App.body.style.cursor = 'none'
                        App.body.qS( 'cursor-pan' ).show()
                    } else {
                        engine.ui.cursors.set( 'pointer.standard' )

                        App.body.qS( 'cursor-pan' ).hide()
                    }
                }
            }
        }

        App.body.onpointerdown = e => {
            switch ( e.button ) {
                case 2: 
                    if ( SSM.panning[ $Se ] ) {
                        SSM.panning[ $Sa ].mouseRightDrag.isEnabled( true )
                            .then( s => {
                                s.activate()

                                App.body.style.cursor = 'none'
                                App.body.qS( 'cursor-pan' ).show()
                                App.body.qS( 'cursor-pan-center' ).show()
                            } )
                    }
            }
        }

        App.body.onpointerup = e => {
            switch ( e.button ) {
                case 2: 
                    if ( SSM.panning[ $Se ] ) {
                        SSM.panning[ $Sa ].mouseRightDrag.isEnabled( true )
                            .then( s => {
                                s.deactivate()

                                engine.ui.cursors.set( 'pointer.standard' )

                                App.body.qS( 'cursor-pan' ).hide()
                                App.body.qS( 'cursor-pan-center' ).hide()
                            } )
                    }
            }
        }

        /* Create necessary document events */ 
        App.onmouseenter = () => program.domevents.window.mouse.inside.on()
        App.onmouseleave = () => program.domevents.window.mouse.inside.off()

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#size' ).qS( 'input' ).oninput = function () {
                engine.audio.play( 'slider-oninput' )

                program.macromap.size.width = Number( this.value ) 
                program.macromap.size.height = Number( this.value )    
            }

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#elevation' ).qS( 'input' ).oninput = function () {
                engine.audio.play( 'slider-oninput' )

                program.macromap.elev.max = Number( this.value )   
            }
        
        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#fractal' ).qS( 'input' ).oninput = function () {
                engine.audio.play( 'slider-oninput' )

                program.macromap.mult = Number( this.value )   
            }
        
        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#regenerate' ).onclick = () => {
                engine.audio.play( 'button-click' )

                program.handlers.macromap.generateMacro( program.macromap.mult )
            }

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#reset' ).onclick = () => {
                engine.audio.play( 'button-click' )

                program.handlers.macromap.resetGenerationPanel()
            }

        const leaflets = App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qSA( 'leaflet' )
        
        for ( let i = 0; i < leaflets.length; i++ ) {
            if ( leaflets[ i ].hasAttribute( 'biome' ) ) {
                leaflets[ i ].qS( 'input' ).oninput = function () {
                    if ( !leaflets[ i ].isLocked() ) {
                        engine.audio.play( 'slider-oninput' )

                        const biomeData = program.handlers.macromap.biomes[ Number( leaflets[ i ].getAttribute( 'biome' ) ) ]

                        switch ( Number( this.value ) ) {
                            case 0:
                                biomeData[ 1 ] = 1
                                break
                            case 1:
                                biomeData[ 1 ] = 0.99
                                break
                            case 2:
                                biomeData[ 1 ] = 0.95
                                break
                            case 3:
                                biomeData[ 1 ] = 0.75
                                break
                            case 4:
                                biomeData[ 1 ] = 0.5
                                break
                        }
                    }
                }
            }

            if ( leaflets[ i ].hasAttribute( 'preset' ) ) {
                leaflets[ i ].onclick = () => {
                    if ( !leaflets[ i ].isLocked() ) {
                        engine.audio.play( 'checkbox-oninput' )

                        program.macromap.biomePreset = Number( leaflets[ i ].getAttribute( 'preset' ) )

                        leaflets[ i ].qS( 'input' ).checked = true

                        for ( let j = 0; j < leaflets.length; j++ ) {
                            if ( leaflets[ j ].hasAttribute( 'preset' ) ) {
                                const number = Number( leaflets[ j ].getAttribute( 'preset' ) )
            
                                if ( number == program.macromap.biomePreset ) leaflets[ j ].qS( 'input' ).checked = true
                                else leaflets[ j ].qS( 'input' ).checked = false
                            }
                        }
                    }
                }
            }
        }

        program.domevents.window.mouse.inside.on()

        initialized = true

        resolve()
    } )
}

export { init, initialized, recursive }