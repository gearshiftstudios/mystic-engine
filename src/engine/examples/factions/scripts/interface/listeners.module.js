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

        resolve()
    } )
}

export { init }