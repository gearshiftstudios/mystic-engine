import * as handler_tab from './tab.module.js'

class UI_Group {
    constructor ( id, width, height, neighbors = {} ) {
        this.element = document.getElementById( id )
        this.neighbors = { b: null, l: null, r: null, t: null }
        
        this.parameters = {
            id: id,
            width: width,
            height: height,
            neighbors: neighbors,
        }

        this.size = {
            width: 0,
            height: 0,
        }

        for ( const n in neighbors ) this.neighbors[ n ] = neighbors[ n ]

        this.resize( false )
    }

    resize ( resizeTabs = false ) {
        return new Promise( resolve => {
            const wFraction = this.parameters.width.split( '/' )
            const hFraction = this.parameters.height.split( '/' )

            if ( wFraction.length > 1 ) this.size.width = `${ ( window.innerWidth / Number( wFraction[ 1 ] ) ) * Number( wFraction[ 0 ] ) }px`
            else {
                if ( wFraction[ 0 ] == 'full' ) this.size.width = `${ window.innerWidth }px`
                else this.size.width = `${ wFraction[ 0 ] }px`
            }

            if ( hFraction.length > 1 ) this.size.height = `${ ( window.innerHeight / Number( hFraction[ 1 ] ) ) * Number( hFraction[ 0 ] ) }px`
            else {
                if ( hFraction[ 0 ] == 'full' ) this.size.height = `${ window.innerHeight }px`
                else this.size.height = `${ hFraction[ 0 ] }px`
            }

            this.element.style.width = this.size.width
            this.element.style.height = this.size.height

            if ( resizeTabs ) {
                const tabs = this.element.qSA( 'tab' ),
                    __env = App.body.qS( 'environment' )

                for ( const n in this.neighbors ) {
                    if ( this.neighbors[ n ] != null ) {

                        const groupDOM = __env.group( this.neighbors[ n ] ),
                            groupBounds = __env.group( this.neighbors[ n ] ).getBoundingClientRect()

                        switch ( n ) {
                            case 'l':
                                this.element.style.marginLeft = `${ groupBounds.left + groupDOM.offsetWidth }px`    

                                break
                            case 't':
                                this.element.style.marginTop = `${ ( groupBounds.top - 30 ) + groupDOM.offsetHeight }px`    

                                break
                        }
                    }
                }

                for ( let i = 0; i < tabs.length; i++ ) {
                    if ( handler_tab.rep.list[ tabs[ i ].id ] ) handler_tab.rep.list[ tabs[ i ].id ].resize( true )
                }
            }

            resolve()
        } )
    }
}

class Handler_Group {
    constructor () {
        this.list = {}
    }

    resize () {
        const groups = App.body.qSA( 'group' )

        for ( let i = 0; i < groups.length; i++ ) {
            this.list[ groups[ i ].id ].resize( true )
        }
    }

    init () {
        return new Promise( resolve => {
            const groups = App.body.qSA( 'group' )

            for ( let i = 0; i < groups.length; i++ ) {
                this.list[ groups[ i ].id ] = new UI_Group( 
                    groups[ i ].id,
                    groups[ i ].hasAttribute( 'width' ) ? groups[ i ].getAttribute( 'width' ) : '0',
                    groups[ i ].hasAttribute( 'height' ) ? groups[ i ].getAttribute( 'height' ) : '0',

                    {
                        b: groups[ i ].hasAttribute( 'nb' ) ? groups[ i ].getAttribute( 'nb' ) : null,
                        l: groups[ i ].hasAttribute( 'nl' ) ? groups[ i ].getAttribute( 'nl' ) : null,
                        r: groups[ i ].hasAttribute( 'nr' ) ? groups[ i ].getAttribute( 'nr' ) : null,
                        t: groups[ i ].hasAttribute( 'nt' ) ? groups[ i ].getAttribute( 'nt' ) : null,
                    }
                )
            }

            for ( const g in this.list ) {
                const __this = this.list[ g ],
                    __env = App.body.qS( 'environment' )

                for ( const n in __this.neighbors ) {
                    if ( __this.neighbors[ n ] != null ) {

                        const groupDOM = __env.group( __this.neighbors[ n ] ),
                            groupBounds = __env.group( __this.neighbors[ n ] ).getBoundingClientRect()

                        switch ( n ) {
                            case 'l':
                                __this.element.style.marginLeft = `${ groupBounds.left + groupDOM.offsetWidth }px`    

                                break
                            case 't':
                                __this.element.style.marginTop = `${ ( groupBounds.top - 30 ) + groupDOM.offsetHeight }px`    

                                break
                        }
                    }
                }
            }

            resolve()
        } )
    }
}

const GROUPREP = new Handler_Group()

export { GROUPREP as rep, Handler_Group, UI_Group }