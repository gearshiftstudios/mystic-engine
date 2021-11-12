class Setting {
    constructor ( active = false, enabled = true ) {
        this.active = active
        this.enabled = enabled
    }

    activate () {
        this.active = true
    }

    deactivate () {
        this.active = false
    }

    disable () {
        this.enabled = false
    }

    enable () {
        this.enabled = true
    }

    isActive ( boolean )  {
        if ( !boolean ) return this.active
        else {
            switch ( boolean ) {
                case true:
                    if ( this.active == true ) return new Promise( resolve => resolve( this ) )

                    break
                case false:
                    if ( this.active == false ) return new Promise( resolve => resolve( this ) )

                    break
                case 'switch':
                    return new Promise( resolve => resolve( this.active ) )
                    break
            }
        }
    }

    isEnabled ( boolean ) {
        if ( !boolean ) return this.enabled
        else {
            switch ( boolean ) {
                case true:
                    if ( this.enabled == true ) return new Promise( resolve => resolve( this ) )

                    break
                case false:
                    if ( this.enabled == false ) return new Promise( resolve => resolve( this ) )

                    break
                case 'switch':
                    return new Promise( resolve => resolve( this.enabled ) )
                    break
            }
        }
    }
}

function Subset ( object = {}, enabled = true ) {
    return new Array( object, enabled )
}

const Settings = {
    scene: {
        movement: {
            panning: Subset( {
                screenEdges: new Setting(),
                mouseRightDrag: new Setting(),
                speed: -0.0005,
            }, true ),
        },
    },
}

export { Settings }