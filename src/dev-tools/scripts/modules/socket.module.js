import { Log } from '../../../engine/scripts/log.module.js'

const log = new Log( 'socket.io', false, true )

socket.on( '[client] test', () => {
    log.output( 'Recieved [server] message. Socket.io [client] is working properly.' ).reg()

    socket.emit( '[server] test' )
} )

socket.on( '[client] close editor', ( editor ) => {
    if ( program.states.editors[ editor ] ) program.states.editors[ editor ].close()
} )

socket.on( '[client] save object', () => {
    if ( program.states.editors.object.lod.test.mode != null ) alert( `Can't save a file while a test is running.` )
    else program.states.editors.object.save()
} )

socket.on( '[client] load mystic file', ( type ) => {
    if ( program.states.editors.object.lod.test.mode != null ) alert( `Can't open another file while a test is running.` )
    else socket.emit( '[server] load mystic file', type )
} )

socket.on( '[client] receive mystic file data', ( data ) => {
    program.states.editors.object.openFile( data )
} )

socket.on( '[client] read gltf (embedded)', () => {
    socket.emit( '[server] read gltf (embedded)' )
} )

socket.on( '[client] receive gltf (embedded) data', ( data ) => {
    program.states.editors.object.gltf.addScene( data )
} ) 

socket.on( '[client] begin object LOD test', ( mode ) => {
    program.states.editors.object.lod.test.begin( mode )
} ) 