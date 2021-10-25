import { Editor } from '../editor.module.js'
import * as engine from '../../../../../engine/scripts/mystic.module.js'
import * as m3d_gui from '../../../../../engine/scripts/m3d/gui/dat.gui.module.js'
import * as m3e_loader_gltf from '../../../../../engine/scripts/m3d/loaders/gltfe.module.js'

const temp = {
    grid: {
        rotation: {
            x: 0,
            y: 0,
            z: 0,
        },
    },
    lod: {
        object: {
            distance: 0,
            selected: null,
        }
    }
}

const controls = {
    editor: {
        recenter: null,

        grid: {
            position: { x: null, y: null, z: null },
            rotation: { x: null, y: null, z: null },
            scale: { x: null, y: null, z: null },
        }
    },
    lod: {
        distance: null,
        objects: null,
        uniScale: null,
    },
    test: {
        autoRotate: null,
        end: null,
    },
}

class Editor_Object extends Editor {
    constructor ( 
        category = 'Object Editor', 
        domElement = document.body.querySelector( '#editor-object' ), 
        envName ='object' 
    ) {
        super( category, domElement, envName )

        const scope = this

        this.gui = {
            editor: [ 
                new m3d_gui.class( { id: 'm3d-gui.editor-object' } ) ,
                {}
            ],
            lodPicker: [ 
                new m3d_gui.class( { id: 'm3d-gui.editor-object-lodPicker' } ) ,
                {}
            ],
            test: [ 
                new m3d_gui.class( { id: 'm3d-gui.editor-object-test' } ) ,
                {}
            ]
        }

        this.lod = {
            distance: 0,
            idList: [],
            levels: [],
            object: new engine.m3d.lod(),
            objectSelected: null,
            uniScale: 1,

            test: {
                mode: null,

                begin: function ( mode = 'interactive' ) {
                    scope.environment.scene.gltfModels.children.forEach( c => c.visible = false )
                    
                    scope.environment.scene.add( scope.lod.object )

                    document.getElementById( 'm3d-gui.editor-object-lodPicker' ).hide()
                    document.getElementById( 'm3d-gui.editor-object-test' ).show()

                    switch ( mode ) {
                        case 'auto':
                            this.mode = 'auto'

                            break
                        case 'interactive':
                            this.mode = 'interactive'

                            break
                    }
                },
                end: function () {
                    scope.environment.scene.remove( scope.lod.object )

                    scope.environment.scene.gltfModels.children.forEach( c => c.visible = false )

                    scope.environment.controls.autoRotate = false

                    scope.gltf.viewLODObject( scope.lod.objectSelected, null )

                    document.getElementById( 'm3d-gui.editor-object-test' ).hide()
                    document.getElementById( 'm3d-gui.editor-object-lodPicker' ).show()

                    switch ( this.mode ) {
                        case 'auto':
                            break
                        case 'interacitve':
                            break
                    }

                    this.mode = null
                },

                recenterControls: function () {
                    scope.environment.controls.target = new engine.m3d.vec3( 0, 0, 0 )
                },
            },

            addLevel: function ( 
                sceneId, 
                distance = 0
            ) {
                if ( sceneId && scope.gltf.scenes[ sceneId ] ) {
                    this.levels.push( [ sceneId, distance ] )

                    this.idList.push( sceneId )
                }
            },
        }

        this.gltf = {
            loader: {
                e: new m3e_loader_gltf.eLoader(),
            },
            scenes: {}, // [ name, data ]

            addScene: function (
                data,
                name = engine.math.random.characters().mixed()
            ) {
                if ( data ) {
                    this.scenes[ name ] = data

                    this.loader.e.parse( data, '', ( gltf ) => {
                        gltf.scene.name = name
                        gltf.scene.visible = false

                        gltf.scene.scale.set( 
                            scope.lod.uniScale, 
                            scope.lod.uniScale, 
                            scope.lod.uniScale 
                        )

                        this.isLOD( name, gltf )
                    } )
                }
            },

            isLOD: function ( name, model ) {
                if ( scope.lod.object.levels.length == 0 ) {
                    alert( 'This will be the first LOD Object' )

                    scope.lod.addLevel( name, 0 )

                    scope.lod.object.addLevel( model.scene, 0 )

                    scope.environment.scene.gltfModels.add( model.scene )

                    temp.lod.object.selected = name

                    document.getElementById( 'm3d-gui.editor-object-lodPicker' ).show()
                } else {
                    scope.lod.distance += 20

                    scope.lod.addLevel( name, scope.lod.distance )

                    scope.lod.object.addLevel( model.scene, scope.lod.distance * scope.lod.uniScale )

                    scope.environment.scene.gltfModels.add( model.scene )

                    temp.lod.object.selected = name
                }

                this.viewLODObject( name, scope.lod.objectSelected )

                scope.resetObjects()
            },

            viewLODObject: function ( val, prev ) {
                scope.environment.scene.gltfModels.children.forEach( c => {
                    if ( prev != null ) {
                        if ( c.name == prev ) c.visible = false
                        else if ( c.name == val ) {
                            c.visible = true

                            scope.lod.objectSelected = val
                        }
                    } else {
                        if ( c.name == val ) {
                            c.visible = true

                            scope.lod.objectSelected = val
                        }
                    }
                } )
            },
        }
    }

    close () {
        document.getElementById( 'm3d-gui.editor-object' ).hide()
        document.getElementById( 'm3d-gui.editor-object-lodPicker' ).hide()
        document.getElementById( 'm3d-gui.editor-object-test' ).hide()

        document.body.state( 'editor-object' ).hide()
        document.body.state( 'home' ).show()

        socket.emit( '[server] change app menu', 'home' )

        document.getElementById( 'm3d-gui.home' ).show()
    }

    open () {
        document.getElementById( 'm3d-gui.home' ).hide()

        document.body.state( 'home' ).hide()
        document.body.state( 'editor-object' ).show()

        socket.emit( '[server] change app menu', 'editors.object' )

        if ( !this.firstOpened ) document.getElementById( 'm3d-gui.editor-object' ).show()

        this.init()
    }

    recenter () {
        this.environment.controls.target = new engine.m3d.vec3( 0, 0, 0 )
    }

    render () {
        this.environment.render()
    }

    resetObjects () {
        this.gui.lodPicker[ 0 ].remove( controls.lod.objects )

        controls.lod.objects = this.gui.lodPicker[ 0 ].add( temp.lod.object, 'selected', this.lod.idList )
            .name( 'LOD Object' ).onChange( ( value ) => {
                let index = null

                this.lod.object.levels.forEach( ( l, ix ) => {
                    if ( this.lod.levels[ ix ][ 0 ] == value ) {
                        index = ix

                        temp.lod.object.distance = this.lod.levels[ ix ][ 1 ]

                        console.log( this.lod.levels[ ix ][ 1 ] )
                    }
                } )

                if ( index != null ) {
                    if ( controls.lod.distance != null ) this.gui.lodPicker[ 0 ].remove( controls.lod.distance )

                    if ( this.lod.object.levels.length > 1 ) {
                        if ( index == 0 ) {
                            controls.lod.distance = this.gui.lodPicker[ 0 ].add( this.lod.levels[ index ], 1, 0, 0 )
                                .name( '* Distance' ).onChange( () => {
                                    this.lod.object.levels.forEach( l => {
                                        if ( l.object.name == this.lod.levels[ index ][ 0 ] ) {
                                            l.distance = temp.lod.object.distance * this.lod.uniScale
                                        }
                                    } )
                                } )
                        }

                        if ( index > 0 && index < this.lod.object.levels.length - 1 ) {
                            controls.lod.distance = this.gui.lodPicker[ 0 ].add(
                                this.lod.levels[ index ], 
                                1, 
                                this.lod.levels[ index - 1 ][ 1 ] + 1,
                                this.lod.levels[ index + 1 ][ 1 ] - 1
                            ).name( '* Distance' ).onChange( () => {
                                this.lod.object.levels.forEach( l => {
                                    if ( l.object.name == this.lod.levels[ index ][ 0 ] ) {
                                        l.distance = temp.lod.object.distance * this.lod.uniScale
                                    }
                                } )
                            } )
                        }

                        if ( index == this.lod.object.levels.length - 1 ) {
                            controls.lod.distance = this.gui.lodPicker[ 0 ].add( this.lod.levels[ index ], 1 )
                                .min( this.lod.levels[ index - 1 ][ 1 ] + 1 ).name( '* Distance' ).onChange( () => {
                                this.lod.object.levels.forEach( l => {
                                    if ( l.object.name == this.lod.levels[ index ][ 0 ] ) {
                                        l.distance = temp.lod.object.distance * this.lod.uniScale
                                    }
                                } )
                            } )
                        }
                    } else {
                        controls.lod.distance = this.gui.lodPicker[ 0 ].add( this.lod.levels[ index ], 1, 0, 0 )
                            .name( '* Distance' ).onChange( () => {
                                this.lod.object.levels.forEach( l => {
                                    if ( l.object.name == this.lod.levels[ index ][ 0 ] ) {
                                        l.distance = temp.lod.object.distance * this.lod.uniScale
                                    }
                                } )
                            } )
                    }
                }

                this.gltf.viewLODObject( value, this.lod.objectSelected )
            } )
    }

    resize () {
        this.environment.resize()
    }

    openFile ( fileData ) {
        document.getElementById( 'm3d-gui.editor-object-lodPicker' ).hide()

        this.lod.objectSelected = null

        this.lod.object = new engine.m3d.lod()
        this.lod.idList = []
        this.lod.levels = []

        this.environment.scene.remove( this.environment.scene.gltfModels )

        this.environment.scene.gltfModels = new engine.m3d.group()

        this.gltf.scenes = {}

        fileData = JSON.parse( fileData )

        for ( const g in fileData.grid ) {
            for ( const _g in fileData.grid[ g ] ) {
                if ( g == 'rotation' ) {
                    temp.grid.rotation[ _g ] = engine.m3d.util.math.radToDeg( fileData.grid[ g ][ _g ] )

                    controls.editor.grid[ g ][ _g ].setValue( temp.grid.rotation[ _g ] )
                } else {
                    this.grid.lod[ g ][ _g ] = fileData.grid[ g ][ _g ]

                    controls.editor.grid[ g ][ _g ].setValue( fileData.grid[ g ][ _g ] )
                }
            }
        }

        for ( const g in fileData.camera ) {
            for ( const _g in fileData.camera[ g ] ) this.environment.camera[ g ][ _g ] = fileData.camera[ g ][ _g ]
        }

        for ( const g in fileData.controls ) {
            switch ( g ) {
                case 'target':
                    this.environment.controls.target = new engine.m3d.vec3(
                        fileData.controls.target[ 0 ],
                        fileData.controls.target[ 1 ],
                        fileData.controls.target[ 2 ],
                    )
                
                    break
            }
        }

        this.lod.uniScale = fileData.lod.uniScale

        controls.lod.uniScale.setValue( fileData.lod.uniScale )

        this.environment.scene.add( this.environment.scene.gltfModels )

        for ( const s in fileData.gltf.scenes ) {
            this.gltf.scenes[ s ] = fileData.gltf.scenes[ s ]

            this.gltf.loader.e.parse( fileData.gltf.scenes[ s ], '', ( gltf ) => {
                gltf.scene.name = s
                gltf.scene.visible = false

                gltf.scene.scale.set( 
                    fileData.lod.uniScale, 
                    fileData.lod.uniScale, 
                    fileData.lod.uniScale 
                )

                fileData.lod.levels.forEach( l => {
                    if ( l[ 0 ] == s ) {
                        this.lod.addLevel( s, l[ 1 ] )
        
                        this.lod.object.addLevel( gltf.scene, l[ 1 ] * fileData.lod.uniScale )

                        this.lod.distance = l[ 1 ] * fileData.lod.uniScale
        
                        this.environment.scene.gltfModels.add( gltf.scene )
                    }
                } )

                temp.lod.object.selected = s

                this.gltf.viewLODObject( s, this.lod.objectSelected )

                this.resetObjects()
            } )
        }

        document.getElementById( 'm3d-gui.editor-object-lodPicker' ).show()
    }

    save () {
        const tempObject = {
            camera: {
                position: {
                    x: this.environment.camera.position.x,
                    y: this.environment.camera.position.y,
                    z: this.environment.camera.position.z,
                },
                rotation: {
                    x: this.environment.camera.rotation.x,
                    y: this.environment.camera.rotation.y,
                    z: this.environment.camera.rotation.z,
                },
                scale: {
                    x: this.environment.camera.scale.x,
                    y: this.environment.camera.scale.y,
                    z: this.environment.camera.scale.z,
                },
            },
            controls: {
                target: [ 
                    this.environment.controls.target.x,
                    this.environment.controls.target.y,
                    this.environment.controls.target.z
                ],
            },
            gltf: {
                scenes: this.gltf.scenes,
            },
            grid: {
                position: {
                    x: this.grid.lod.position.x,
                    y: this.grid.lod.position.y,
                    z: this.grid.lod.position.z,
                },
                rotation: {
                    x: this.grid.lod.rotation.x,
                    y: this.grid.lod.rotation.y,
                    z: this.grid.lod.rotation.z,
                },
                scale: {
                    x: this.grid.lod.scale.x,
                    y: this.grid.lod.scale.y,
                    z: this.grid.lod.scale.z,
                },
            },
            lod: {
                levels: this.lod.levels,
                uniScale: this.lod.uniScale,
            },
        }

        socket.emit( '[server] save mystic file', tempObject, 'object' )
    }

    init () {
        if ( this.firstOpened ) {
            this.editorInit()

            document.getElementById( 'm3d-gui.editor-object-lodPicker' ).hide()
            document.getElementById( 'm3d-gui.editor-object-test' ).hide()

            controls.test.autoRotate = this.gui.test[ 0 ].add( this.environment.controls, 'autoRotate' ).name( 'Auto-Spin Scene' ).listen()
            controls.test.end = this.gui.test[ 0 ].add( this.lod.test, 'end' ).name( 'End Test' )

            controls.lod.objects = this.gui.lodPicker[ 0 ].add( this.lod, 'objectSelected', this.lod.idList )
            controls.lod.uniScale = this.gui.lodPicker[ 0 ].add( this.lod, 'uniScale' )
                .name( 'Uni-Scale' ).onChange( () => {
                    this.environment.scene.gltfModels.children.forEach( c => c.scale.set(
                        this.lod.uniScale,
                        this.lod.uniScale,
                        this.lod.uniScale
                    ) )

                    this.lod.object.levels.forEach( ( l, ix ) => {
                        if ( this.lod.levels[ ix ][ 0 ] == l.object.name ) l.distance = this.lod.levels[ ix ][ 1 ] * this.lod.uniScale
                    } )
                } )

            // controls.lod.distance = this.gui.lodPicker[ 0 ].add( temp.lod.object, 'distance' )
            //     .name( '* Distance' ).onChange( () => {
            //         this.lod.object.levels.forEach( ( l, ix ) => {
            //             if ( this.lod.levels[ ix ][ 0 ] == this.lod.objectSelected ) {
            //                 this.lod.levels[ ix ][ 1 ] = temp.lod.object.distance

            //                 l.distance = temp.lod.object.distance * this.lod.uniScale
            //             }
            //         } )
            //     } )

            controls.editor.recenter = this.gui.editor[ 0 ].add( this, 'recenter' ).name( 'Recenter' )

            const gui_folder$editor_grid = this.gui.editor[ 0 ].addFolder( 'Editor Grid' )

            const gui_folder$editor_grid_position = gui_folder$editor_grid.addFolder( 'Position' )

            controls.editor.grid.position.x = gui_folder$editor_grid_position.add( this.grid.lod.position, 'x' ).name( 'X' )
            controls.editor.grid.position.x.relVal = 'cegpx'

            controls.editor.grid.position.y = gui_folder$editor_grid_position.add( this.grid.lod.position, 'y' ).name( 'Y' )
            controls.editor.grid.position.y.relVal = 'cegpy'

            controls.editor.grid.position.z = gui_folder$editor_grid_position.add( this.grid.lod.position, 'z' ).name( 'Z' )
            controls.editor.grid.position.z.relVal = 'cegpz'

            const gui_folder$editor_grid_rotation = gui_folder$editor_grid.addFolder( 'Rotation' )

            controls.editor.grid.rotation.x = gui_folder$editor_grid_rotation.add( temp.grid.rotation, 'x', -360, 360 ).name( 'X (deg)' ).onChange( () => {
                this.grid.lod.rotation.x = engine.m3d.util.math.degToRad( temp.grid.rotation.x )
            } )

            controls.editor.grid.rotation.x.relVal = 'cegrx'

            controls.editor.grid.rotation.y = gui_folder$editor_grid_rotation.add( temp.grid.rotation, 'y', -360, 360 ).name( 'Y (deg)' ).onChange( () => {
                this.grid.lod.rotation.y = engine.m3d.util.math.degToRad( temp.grid.rotation.y )
            } )

            controls.editor.grid.rotation.y.relVal = 'cegry'

            controls.editor.grid.rotation.z = gui_folder$editor_grid_rotation.add( temp.grid.rotation, 'z', -360, 360 ).name( 'Z (deg)' ).onChange( () => {
                this.grid.lod.rotation.z = engine.m3d.util.math.degToRad( temp.grid.rotation.z )
            } )
            
            controls.editor.grid.rotation.z.relVal = 'cegrz'

            const gui_folder$editor_grid_scale = gui_folder$editor_grid.addFolder( 'Scale' )

            controls.editor.grid.scale.x = gui_folder$editor_grid_scale.add( this.grid.lod.scale, 'x' ).name( 'X' )
            controls.editor.grid.scale.x.relVal = 'cegsx'

            controls.editor.grid.scale.y = gui_folder$editor_grid_scale.add( this.grid.lod.scale, 'y' ).name( 'Y' )
            controls.editor.grid.scale.y.relVal = 'cegsy'

            controls.editor.grid.scale.z = gui_folder$editor_grid_scale.add( this.grid.lod.scale, 'z' ).name( 'Z' )
            controls.editor.grid.scale.z.relVal = 'cegsz'

            document.getElementById( 'm3d-gui.editor-object' ).show()

            this.firstOpened = false
        } 

        this.environment.renderers.webgl.setSize( this.domElement.offsetWidth, this.domElement.offsetHeight )

        this.environment.camera.position.set( 10, 10, 10 )
        this.environment.camera.updateMatrixWorld()

        this.environment.controls.target = new engine.m3d.vec3( 0, 0, 0 )
        this.environment.controls.minDistance = 0
    }
}

export { Editor_Object as state }