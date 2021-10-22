import * as environments_offscreen from './scene.module.js';

self.onmessage = function ( message ) {
	var data = message.data

	environments_offscreen.init( 
        data.drawingSurface, 
        data.width, 
        data.height, 
        data.pixelRatio 
    ).then( () => {
        postMessage( true )
    } )

}