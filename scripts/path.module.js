// function getEnginePath ( isUnchanged ) {
// 	let path = document.getElementById( 'engine-scripts-main' ).getAttribute( 'src' )
// 	path = path.slice( 0, path.length - 38 )

// 	if ( path.slice( 0, path.length - ( path.length - 6 ) ) != '../../' ) {
// 		if ( path.slice( 0, path.length - ( path.length - 3 ) ) != '../' ) {
// 			if ( path.slice( 0, path.length - ( path.length - 2 ) ) != './' ) path = `./${ path }${ ( isUnchanged && isUnchanged == true ) ? 'mystic-engine/': '' }`
// 		}
// 	}

// 	if ( document.getElementById( 'engine-scripts-main' ).hasAttribute( 'engine-path' ) ) path = document.getElementById( 'engine-scripts-main' ).getAttribute( 'engine-path' )

// 	return path
// }

// const EPATH = getEnginePath()

// export { EPATH }