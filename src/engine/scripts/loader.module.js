import { Log } from './log.module.js'

class Loader {
    constructor ( element, showWhenStarted = true, hideWhenFinished = true ) {
        const scope = this

        this.element = element
        this.show = showWhenStarted
        this.hide = hideWhenFinished
        this.complete = null
        this.begin = null

        this.steps = {
            count: 0,
            completed: 0,
            finished: false,
            labels: new Array(),
        }

        this.add = ( label = 'Loading' ) => {
            this.steps.count++
    
            this.steps.labels.push( label )

            return {
                add: scope.add,
            }
        }
    }

    finishTask () {
        if ( !this.steps.finished ) {
            this.steps.completed++

            this.update()

            if ( this.steps.completed >= this.steps.count ) {
                this.steps.finished = true

                if ( this.complete ) wait.seconds( this.complete[ 0 ], this.complete[ 1 ] )

                if ( this.hide ) {
                    this.element.hide()
                }
            }
        }
    }

    onComplete ( method, secondsToWait = 0 ) {
        this.complete = [ method, secondsToWait ]
    }

    onStart ( method, secondsToWait = 0 ) {
        this.begin = [ method, secondsToWait ]
    }

    start () {
        this.steps.completed = 0
        this.steps.finished = false

        this.update()

        if ( this.begin ) wait.seconds( this.begin[ 0 ], this.begin[ 1 ] )

        if ( this.show ) {
            this.element.show()
        }
    }

    reset () {
        this.steps.count = 0
        this.steps.completed = 0
        this.steps.finished = false
        this.steps.labels = new Array()
    }

    update () {
        const barWidth = ( 100 / this.steps.count ) * this.steps.completed

        this.element.qS( 'bar' ).style.width = `${ barWidth }%`
        this.element.qS( 'text' ).insert( `${ this.steps.labels[ this.steps.completed ] }...` )
    }
}

export { Loader, Loader as class }