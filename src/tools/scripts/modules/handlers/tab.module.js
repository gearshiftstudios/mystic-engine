class UI_Tab {
    constructor ( id, width, height, neighbors = {} ) {
        this.element = document.getElementById( id )
        this.neighbors = { b: null, l: null, r: null, t: null }
        this.parentGroup = document.getElementById( this.element.getAttribute( 'group' ) )

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

    resize ( updatePositions ) {
        return new Promise( resolve => {
            const wFraction = this.parameters.width.split( '/' )
            const hFraction = this.parameters.height.split( '/' )

            if ( wFraction.length > 1 ) this.size.width = `${ ( this.parentGroup.offsetWidth / Number( wFraction[ 1 ] ) ) * Number( wFraction[ 0 ] ) }px`
            else {
                if ( wFraction[ 0 ] == 'full' ) this.size.width = `${ this.parentGroup.offsetWidth }px`
                else this.size.width = `${ wFraction[ 0 ] }px`
            }

            if ( hFraction.length > 1 ) this.size.height = `${ ( this.parentGroup.offsetHeight / Number( hFraction[ 1 ] ) ) * Number( hFraction[ 0 ] ) }px`
            else {
                if ( hFraction[ 0 ] == 'full' ) this.size.height = `${ this.parentGroup.offsetHeight }px`
                else this.size.height = `${ hFraction[ 0 ] }px`
            }

            this.element.style.width = this.size.width
            this.element.style.height = this.size.height

            if ( updatePositions ) {
                const __env = App.body.qS( 'environment' )

                for ( const n in this.neighbors ) {
                    if ( this.neighbors[ n ] != null ) {
                        const tabDOM = __env.tab( this.neighbors[ n ] ),
                            tabBounds = __env.tab( this.neighbors[ n ] ).getBoundingClientRect()

                        switch ( n ) {
                            case 'l':
                                this.element.style.marginLeft = `${ tabBounds.left + tabDOM.offsetWidth + 5 }px` 

                                break
                            case 't':
                                this.element.style.marginTop = `${ ( tabBounds.top - 30 ) + tabDOM.offsetHeight + 5 }px`    

                                break
                        }
                    }
                }

                if ( this.element.hasAttribute( 'subw' ) ) this.element.style.width = `${ this.element.offsetWidth - 5 }px`
                if ( this.element.hasAttribute( 'subh' ) ) this.element.style.height = `${ this.element.offsetHeight - 5 }px`
            }

            resolve()
        } )
    }
}

class Handler_Tab {
    constructor () {
        this.list = {}
    }

    init () {
        return new Promise( resolve => {
            const tabs = App.body.qSA( 'tab' )

            for ( let i = 0; i < tabs.length; i++ ) {
                this.list[ tabs[ i ].id ] = new UI_Tab( 
                    tabs[ i ].id,
                    tabs[ i ].hasAttribute( 'width' ) ? tabs[ i ].getAttribute( 'width' ) : '0',
                    tabs[ i ].hasAttribute( 'height' ) ? tabs[ i ].getAttribute( 'height' ) : '0',

                    {
                        b: tabs[ i ].hasAttribute( 'nb' ) ? tabs[ i ].getAttribute( 'nb' ) : null,
                        l: tabs[ i ].hasAttribute( 'nl' ) ? tabs[ i ].getAttribute( 'nl' ) : null,
                        r: tabs[ i ].hasAttribute( 'nr' ) ? tabs[ i ].getAttribute( 'nr' ) : null,
                        t: tabs[ i ].hasAttribute( 'nt' ) ? tabs[ i ].getAttribute( 'nt' ) : null,
                    }
                )
            }

            for ( const t in this.list ) {
                const __this = this.list[ t ],
                    __env = App.body.qS( 'environment' )

                for ( const n in __this.neighbors ) {
                    if ( __this.neighbors[ n ] != null ) {
                        const tabDOM = __env.tab( __this.neighbors[ n ] ),
                            tabBounds = __env.tab( __this.neighbors[ n ] ).getBoundingClientRect()

                        switch ( n ) {
                            case 'l':
                                __this.element.style.marginLeft = `${ tabBounds.left + tabDOM.offsetWidth }px` 

                                break
                            case 't':
                                __this.element.style.marginTop = `${ ( tabBounds.top - 30 ) + tabDOM.offsetHeight + 5 }px`    

                                break
                        }
                    }
                }
            }

            for ( const t in this.list ) {
                const __this = this.list[ t ]

                if ( __this.element.hasAttribute( 'subw' ) ) __this.element.style.width = `${ __this.element.offsetWidth - 5 }px`
                if ( __this.element.hasAttribute( 'subh' ) ) __this.element.style.height = `${ __this.element.offsetHeight - 5 }px`
            }

            resolve()
        } )
    }
}

const TABREP = new Handler_Tab()

export { TABREP as rep, Handler_Tab, UI_Tab }