import { M3DREP } from '../../rep.module.js'

class CSS2DObject extends M3DREP.object3D {
    constructor ( element ) {
        super()

        this.element = element || document.createElement( 'div' )
        this.element.style.position = 'absolute'
        this.element.style.userSelect = 'none'
        this.element.setAttribute( 'draggable', false )

        this.addEventListener( 'removed', function () {
            this.traverse( function ( object ) {
                if ( object.element instanceof Element && object.element.parentNode !== null ) object.element.parentNode.removeChild( object.element )
            } )
        } )
    }

    copy ( source, recursive ) {
        super.copy( source, recursive )

        this.element = source.element.cloneNode( true )

        return this
    }
}

CSS2DObject.prototype.isCSS2DObject = true

const CSS3DObject = function ( element ) {
	M3DREP.object3D.call( this )

	this.element = element || document.createElement( 'div' )
	this.element.style.position = 'absolute'
	this.element.style.pointerEvents = 'auto'

	this.addEventListener( 'removed', function () {
		this.traverse( function ( object ) {
			if ( object.element instanceof Element && object.element.parentNode !== null ) object.element.parentNode.removeChild( object.element )
		} )
	} )
}

CSS3DObject.prototype = Object.assign( Object.create( M3DREP.object3D.prototype ), {
    isCSS3DObject: true,
	constructor: CSS3DObject,

	copy: function ( source, recursive ) {
		M3DREP.object3D.prototype.copy.call( this, source, recursive )

		this.element = source.element.cloneNode( true )

		return this
	}
} )

const CSS3DSprite = function ( element ) {
	CSS3DObject.call( this, element )
}

CSS3DSprite.prototype = Object.create( CSS3DObject.prototype )
CSS3DSprite.prototype.constructor = CSS3DSprite
CSS3DSprite.prototype.isCSS3DSprite = true

function init () {
    M3DREP.objects.css2d = CSS2DObject

    M3DREP.objects.css3d = {
        default: CSS3DObject,

        sprite: CSS3DSprite,
    }
}

export { CSS2DObject as o2d, CSS3DObject as o3d, CSS3DSprite as s3d, init }