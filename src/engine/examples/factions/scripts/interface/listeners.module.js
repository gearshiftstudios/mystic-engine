function init () {
    return new Promise( resolve => {
        /* Create necessary window events */ 
        window.onresize = () => {
            program.domevents.window.resizing.toggle.wait.seconds( 1 )

            program.handlers.minimap.update.render().then( () => {
                program.handlers.minimap.update.pixels().then( () => {
                    program.environments.main.resize()
                } )
            } )
        }

        window.onmousemove = e => {
            program.mouse.x = e.clientX
            program.mouse.y = e.clientY
        }

        /* Create necessary document events */ 
        App.onmouseenter = () => program.domevents.window.mouse.inside.on()
        App.onmouseleave = () => program.domevents.window.mouse.inside.off()

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#size' ).qS( 'input' ).oninput = function () {
                program.macromap.size.width = Number( this.value ) 
                program.macromap.size.height = Number( this.value )    
            }

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#elevation' ).qS( 'input' ).oninput = function () {
                program.macromap.elev.max = Number( this.value )   
            }
        
        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#fractal' ).qS( 'input' ).oninput = function () {
                program.macromap.mult = Number( this.value )   
            }
        
        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#regenerate' ).onclick = () => {
                program.handlers.macromap.generateMacro( program.macromap.mult )
            }

        App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qS( '#reset' ).onclick = () => {
                program.handlers.macromap.resetGenerationPanel()
            }

        const leaflets = App.body.state( 'macromap-generation' )
            .qS( '#macromap-generation-panel' )
            .qSA( 'leaflet' )
        
        for ( let i = 0; i < leaflets.length; i++ ) {
            if ( leaflets[ i ].hasAttribute( 'biome' ) ) {
                leaflets[ i ].qS( 'input' ).oninput = function () {
                    if ( !leaflets[ i ].isLocked() ) {
                        const biomeData = program.handlers.macromap.biomes[ Number( leaflets[ i ].getAttribute( 'biome' ) ) ]

                        switch ( Number( this.value ) ) {
                            case 0:
                                biomeData[ 1 ] = 1
                                break
                            case 1:
                                biomeData[ 1 ] = 0.99
                                break
                            case 2:
                                biomeData[ 1 ] = 0.95
                                break
                            case 3:
                                biomeData[ 1 ] = 0.75
                                break
                            case 4:
                                biomeData[ 1 ] = 0.5
                                break
                        }
                    }
                }
            }

            if ( leaflets[ i ].hasAttribute( 'preset' ) ) {
                leaflets[ i ].onclick = () => {
                    if ( !leaflets[ i ].isLocked() ) {
                        program.macromap.biomePreset = Number( leaflets[ i ].getAttribute( 'preset' ) )

                        leaflets[ i ].qS( 'input' ).checked = true

                        for ( let j = 0; j < leaflets.length; j++ ) {
                            if ( leaflets[ j ].hasAttribute( 'preset' ) ) {
                                const number = Number( leaflets[ j ].getAttribute( 'preset' ) )
            
                                if ( number == program.macromap.biomePreset ) leaflets[ j ].qS( 'input' ).checked = true
                                else leaflets[ j ].qS( 'input' ).checked = false
                            }
                        }
                    }
                }
            }
        }

        resolve()
    } )
}

export { init }