export class Log {
    constructor ( category, isWorker, isEngine ) {
        this.category = !category ? 'General' : ( typeof category != 'string' ) ? 'General' : category
        this.isWorker = !isWorker ? false : ( typeof isWorker != 'boolean' ) ? false : isWorker
        this.isEngine = !isEngine ? 'Program' : ( isEngine != true ) ? 'Program' : isEngine
    }

    output ( content, subject ) {
        const verify = () => {
            let verified = false

            if ( content ) verified = true

            return {
                then: func => {
                    if ( func ) {
                        if ( typeof func == 'function' ) setTimeout( func, 0 )
                    }
                }
            }
        }

        return {
            reg: () => {
                verify().then( console.log( 
                    `%c ${ ( this.isEngine != true ) ? this.isEngine : `${ 'Mystic Engine' } v${ 0.1 }` } %c ${ this.category }${ ( this.isWorker == true ) ? ' Worker' : '' } %c${ !subject ? '' : ( typeof subject != 'string' ) ? '' : ` ${ subject } ` }%c ${ content }`,
                    `background: ${ ( this.isEngine == true ) ? 'black' : 'blue' }; color: ${ ( this.isEngine == true ) ? 'turquoise' : 'white' }; font-weight: bold;`,
                    `background: ${ ( this.isWorker == true ) ? 'yellow' : 'white' }; color: black; font-weight: bold;`,
                    `background: magenta; color: white; font-weight: bold;`,
                    `background: transparent; color: white;`
                ) )
            },
            warn: () => {
                verify().then( console.warn( 
                    `%c ${ ( this.isEngine != true ) ? this.isEngine : `${ 'Mystic Engine' } v${ 0.1 }` } %c ${ this.category }${ ( this.isWorker == true ) ? ' Worker' : '' } %c${ !subject ? '' : ( typeof subject != 'string' ) ? '' : ` ${ subject } ` }%c ${ content }`,
                    `background: ${ ( this.isEngine == true ) ? 'black' : 'blue' }; color: ${ ( this.isEngine == true ) ? 'turquoise' : 'white' }; font-weight: bold;`,
                    `background: ${ ( this.isWorker == true ) ? 'yellow' : 'white' }; color: black; font-weight: bold;`,
                    `background: magenta; color: white; font-weight: bold;`,
                    `background: transparent; color: white;`
                ) )
            },
            error: line => {
                verify().then( console.error( 
                    `%c ${ ( this.isEngine != true ) ? this.isEngine : `${ 'Mystic Engine' } v${ 0.1 }` } %c ${ this.category }${ ( this.isWorker == true ) ? ' Worker' : '' } %c${ !subject ? '' : ( typeof subject != 'string' ) ? '' : ` ${ subject } ` }%c${ !line ? '' : ( typeof line != 'number' ) ? '' : ` ${ line } ` }%c ${ content }`,
                    `background: ${ ( this.isEngine == true ) ? 'black' : 'blue' }; color: ${ ( this.isEngine == true ) ? 'turquoise' : 'white' }; font-weight: bold;`,
                    `background: ${ ( this.isWorker == true ) ? 'yellow' : 'white' }; color: black; font-weight: bold;`,
                    `background: magenta; color: white; font-weight: bold;`,
                    `background: darkgreen; color: white; font-weight: bold;`,
                    `background: transparent; color: white;`
                ) )
            }
        }
    }
}