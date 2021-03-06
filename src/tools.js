const { app, BrowserWindow, dialog, globalShortcut, Menu } = require( 'electron' )

const npm = {
	express: require( 'express' )(),
	fs: require( 'fs' ),
	path: require( 'path' ),
},

	server = require( 'http' ).createServer( npm.express ),
	io = require( 'socket.io' )( server )
	
server.listen( 1516 )

const actions = {
	devTools: {
		open: false,
	},
}

if ( require( 'electron-squirrel-startup' ) ) app.quit()

let mainWindow

app.on( 'ready', () => {
	mainWindow = new BrowserWindow( {
		width: 800,
		height: 600,
		resizable: false,
		icon: npm.path.join( __dirname, '/assets/logos/tools.icon.128.png' ),

		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
		}
	} )

	mainWindow.loadFile( npm.path.join( __dirname, 'tools.html' ) )
	mainWindow.removeMenu()
	mainWindow.maximize()

	globalShortcut.register( 'Control+Shift+I', () => {
		switch ( actions.devTools.open ) {
			case false:
				mainWindow.webContents.openDevTools()

				actions.devTools.open = true
				break
			case true:
				mainWindow.webContents.closeDevTools()

				actions.devTools.open = false
				break
		}
	} )

	globalShortcut.register( 'F5', () => {
		mainWindow.reload()
	} )
} )

app.on( 'window-all-closed', () => {
	if ( process.platform !== 'darwin' ) app.quit()
} )

app.on( 'activate', () => {
	if ( BrowserWindow.getAllWindows().length === 0 ) createWindow()
} )

io.on( 'connection', socket => {
	console.clear()

	socket.on( '[server] test', () => {
		console.log( 'Recieved [client] message. Socket.io [server] is working properly.' )
	} )

	socket.on( '[server] exit to desktop', () => {
		app.quit()
	} )

	socket.on( '[server] save mystic file', ( content, type ) => {
		content = JSON.stringify( content )

		switch ( type ) {
			case 'building':
				dialog.showSaveDialog( {
					// defaultPath: npm.path.join( __dirname, '/../saves/buildings' ),

					filters: [
						{
							name: 'Mystic Building (*.mbldgx)',
							extensions: [ 'mbldgx' ]
						}
					]
				} ).then( result => {
					npm.fs.writeFile( result.filePath, content, err => {
						if ( err ) throw err
		
						console.log( 'Building File (mbldgx) created successfully!' )
					} )
				} ).catch( err => {
					if ( err ) throw err
				} )

				break
			case 'object':
				dialog.showSaveDialog( {
					// defaultPath: npm.path.join( __dirname, '/../saves/objects' ),

					'filters': [
						{
							name: 'Mystic Object (*.mobjx)',
							extensions: [ 'mobjx' ]
						}
					]
				} ).then( result => {
					npm.fs.writeFile( result.filePath, content, err => {
						if ( err ) throw err
		
						console.log( 'Object File (mobjx) created successfully!' )
					} )
				} ).catch( err => {
					if ( err ) throw err
				} )
				
				break
			case 'pawn':
				dialog.showSaveDialog( {
					// defaultPath: npm.path.join( __dirname, '/../saves/pawns' ),

					'filters': [
						{
							name: 'Mystic Pawn (*.mpawnx)',
							extensions: [ 'mpawnx' ]
						}
					]
				} ).then( result => {
					npm.fs.writeFile( result.filePath, content, err => {
						if ( err ) throw err
		
						console.log( 'Pawn File (mpawnx) created successfully!' )
					} )
				} ).catch( err => {
					if ( err ) throw err
				} )
				
				break
		}
	} )

	socket.on( '[server] load mystic file', ( type ) => {
		switch ( type ) {
			case 'object':
				dialog.showOpenDialog( {
					// defaultPath: npm.path.join( __dirname, '/../saves/objects' ),

					'filters': [
						{
							name: 'Mystic Object (*.mobjx)',
							extensions: [ 'mobjx' ]
						}
					]
				} ).then( result => {
					npm.fs.readFile( result.filePaths[ 0 ], 'utf-8', ( err, data ) => {
						if ( err ) throw err
		
						console.log( 'Object File (mobjx) opened successfully!' )

						socket.emit( '[client] receive mystic file data', data )
					} )
				} ).catch( err => {
					if ( err ) throw err
				} )
				
				break
		}
	} )

	socket.on( '[server] read gltf (embedded)', () => {
		dialog.showOpenDialog( {
			// defaultPath: npm.path.join( __dirname, '/../models/gltf.embedded' ),

			'filters': [
				{
					name: 'GL Transmission Format (*.gltf)',
					extensions: [ 'gltf' ]
				}
			]
		} ).then( result => {
			npm.fs.readFile( result.filePaths[ 0 ], 'utf-8', ( err, data ) => {
				if ( err ) throw err

				console.log( 'gltf (embedded) opened successfully!' )

				socket.emit( '[client] receive gltf (embedded) data', data )
			} )
		} ).catch( err => {
			if ( err ) throw err
		} )
	} )
} )
