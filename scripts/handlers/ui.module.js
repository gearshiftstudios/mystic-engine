import * as handler_math from './math.module.js'
import { Handler } from '../handler.module.js'

const MATH = new handler_math.handler()

class Hanlder_Interface extends Handler {
    constructor ( category ) {
        super( category )
        
        this.verify = {
            element: {
                byId: id => {
                    if ( id ) return document.gEBI( id )
                }
            }
        }
        this.create = {
            element: ( type, options ) => {
                if ( type ) {
                    if ( typeof type == 'string' ) {
                        const presets = {
                            id: `element.${ MATH.random.characters().mixed() }`,
                            parentId: null,
                            class: '',
                            style: '',
                            attributes: '',
                            innerHTML: '',
                        }

                        if ( options ) {
                            presets.id = !options.id ? presets.id : ( typeof options.id == 'string' ) ? options.id : presets.id
                            presets.parentId = !options.parentId ? presets.parentId : ( typeof options.parentId != 'string' ) ? presets.parentId : this.verify.element.byId( options.parentId ) ? options.parentId : presets.parentId
                            presets.class = !options.class ? presets.class : ( typeof options.class == 'string' ) ? options.class : presets.class
                            presets.style = !options.style ? presets.style : ( typeof options.style == 'string' ) ? options.style : presets.style
                            presets.attributes = !options.attributes ? presets.attributes : ( typeof options.attributes == 'string' ) ? options.attributes : presets.attributes
                            presets.innerHTML = !options.innerHTML ? presets.innerHTML : ( typeof options.innerHTML == 'string' ) ? options.innerHTML : presets.innerHTML
                        }

                        const result = `<${ type } id='${ presets.id }' ${ ( presets.class.length > 0 ) ? `class='${ presets.class }'`: '' } ${ ( presets.style.length > 0 ) ? `style='${ presets.style }'`: '' } ${ presets.attributes }>${ presets.innerHTML }</${ type }>`

                        if ( presets.parentId != null ) this.element( presets.parentId ).render( result ) // document.getElementById( presets.parentId ).render( result )
                        else document.body.render( result )
                    }
                }
            },
            window: () => {},
        }
    }

    element ( element, type ) {
        if ( element ) {
            if ( typeof element == 'string' ) {
                const _type = !type ? 'id' : type

                if ( typeof _type == 'string' ) {
                    if ( _type == 'id' ||
                    _type == 'cls' ||
                    _type == 'tag' ||
                    _type == 'q' ||
                    _type == 'qAll' ) {
                        const config = {
                            element: ( t ) => {
                                let e

                                switch ( t ) {
                                    case 'id':
                                        e = document.gEBI( element )
                                        break
                                    case 'q':
                                        e = document.qS( element )
                                        break
                                }

                                return {
                                    retrieve: {
                                        self: () => { return e },
                                        id: () => { return e.id },
                                    },

                                    render: content => {
                                        e.render
                                    }
                                }
                            },
                            elements: ( t ) => {}
                        }

                        switch ( _type ) {
                            case 'id':
                                if ( document.gEBI( element ) ) return config.element( 'id' )
                                else this.log.output( `Couldn't find an element with the ID of "${ element }".`, 'Element - Verification' ).error( 1 )
                                break
                            case 'cls':
                                if ( document.gEBCN( element ).length > 0 ) return config.elements( 'cls' )
                                else this.log.output( `Couldn't find any elements with the ClassName of "${ element }".`, 'Element - Verification' ).error( 1 )
                                break
                            case 'tag':
                                if ( document.gEBTN( element ).length > 0 ) return config.elements( 'tag' )
                                else this.log.output( `Couldn't find any elements with the TagName of "${ element }".`, 'Element - Verification' ).error( 1 )
                                break
                            case 'q':
                                if ( document.qS( element ) ) return config.element( 'q' )
                                else this.log.output( `Couldn't find an element with the query of "${ element }".`, 'Element - Verification' ).error( 1 )
                                break
                            case 'qAll':
                                if ( document.qSA( element ).length > 0 ) return config.elements( 'qAll' )
                                else this.log.output( `Couldn't find any elements with the query of "${ element }".`, 'Element - Verification' ).error( 1 )
                                break
                        }
                    } else this.log.output( 'The type of element must be input as one of these 5 types listed below.\n\n"id" - getElementById()\n"cls" - getElementsByClassName()\n"tag"- getElementsByTagName()\n"q" - querySelector()\n"qAll" - querySelectorAll()', 'Element - Identification' ).error( 4 )
                } else this.log.output( 'The type of element must be input as a string.', 'Element - Identification' ).error( 3 )
            } else this.log.output( 'The identification must be input as a string.', 'Element - Identification' ).error( 2 )
        } else this.log.output( 'You must give some sort of identification for the element you are trying to access.', 'Element - Identification' ).error( 1 )
    }
}

export { Hanlder_Interface as handler }