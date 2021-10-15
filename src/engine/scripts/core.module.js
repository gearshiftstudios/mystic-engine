// This file is purely for adding to the core JS prototypes
// to make using them more accessable and memorable for my own
// minimal thinking proccess. I think that things like this 
// would be very useful to the core of JS but it seems they
// are not which really sucks. 
 
export function init () {
    return new Promise( resolve => {
        window.App = document

        /* Change the prototype of document */ 
        document.gEBI = document.getElementById
        document.gEBCN = document.getElementsByClassName 
        document.gEBTN = document.getElementsByTagName
        document.qS = document.querySelector
        document.qSA = document.querySelectorAll

	    App.gEBI = App.getElementById
        App.gEBCN = App.getElementsByClassName 
        App.gEBTN = App.getElementsByTagName
        App.qS = App.querySelector
        App.qSA = App.querySelectorAll

	    /* change the prototype of objects */

        /* Change the prototype of elements */ 
        Element.prototype.isDOMElement = true
        Element.prototype.isShowing = false

        Element.prototype.aEL = Element.prototype.addEventListener
        Element.prototype.rEL = Element.prototype.removeEventListener
	    Element.prototype.gEBI = Element.prototype.getElementById
        Element.prototype.gEBCN = Element.prototype.getElementsByClassName 
        Element.prototype.gEBTN = Element.prototype.getElementsByTagName
        Element.prototype.qS = Element.prototype.querySelector
        Element.prototype.qSA = Element.prototype.querySelectorAll

        Element.prototype.create = function () {
            const _this = this

            return {
                menu: ( id ) => _this.render( `<menu id='${ id ? id : '' }'></menu>` ),
                state: ( id ) => _this.render( `<state id='${ id ? id : '' }'></state>` ),

                dropdown: () => {}
            }
        }

        Element.prototype.hide = function ( onlyChangeValue ) {
            const _onlyChangeValue = !onlyChangeValue ? false : typeof onlyChangeValue == 'boolean' ? onlyChangeValue : false

            switch ( _onlyChangeValue ) {
                case false:
                    this.style.display = 'none'

                    this.isShowing = false
                    break
                case true:
                    this.isShowing = false
                    break
            }
        }

        Element.prototype.isLocked = function () {
            if ( this.hasAttribute( 'locked-f' ) == true || 
            this.hasAttribute( 'locked-nr' ) == true || 
            this.hasAttribute( 'locked-nav' ) == true || 
            this.hasAttribute( 'locked-nap' ) == true ) return true
            else return false
        }

        Element.prototype.show = function ( onlyChangeValue ) {
            const _onlyChangeValue = !onlyChangeValue ? false : typeof onlyChangeValue == 'boolean' ? onlyChangeValue : false

            switch ( _onlyChangeValue ) {
                case false:
                    this.style.display = 'inline-block'

                    this.isShowing = true
                    break
                case true:
                    this.isShowing = true
                    break
            }
        }

        Element.prototype.state = function ( id ) {
            if ( id ) {
                const states = this.gEBTN( 'STATE' )

                let found = null

                for ( let i = 0; i < states.length; i++ ) {
                    if ( states[ i ].id == id ) found = states[ i ]
                }

                if ( found != null ) return found
            }
        }

        Element.prototype.menu = function ( id, orientation ) {
            if ( id ) {
                const menus = this.qSA( `menu${ !orientation ? '' : typeof orientation == 'string' ? `-${ orientation }` : '' }` )

                let found = null

                for ( let i = 0; i < menus.length; i++ ) {
                    if ( menus[ i ].id == id ) found = menus[ i ]
                }

                if ( found != null ) return found
            }
        }

	    /* HTML */ 
        Element.prototype.clear = function () {
            this.innerHTML = ''
        }
	    Element.prototype.insert = function ( content ) {
            if ( content ) this.innerHTML = content
        }
        Element.prototype.render = function ( content ) {
            if ( content ) this.innerHTML += content
        }

	    /* getters */
	    Element.prototype.getContent = function () {
            return this.innerHTML
	    }
	    Element.prototype.getText = function () {
            return this.innerText
	    }

        resolve()
    } )
}