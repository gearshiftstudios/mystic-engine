import { Handler } from "../handler.module.js"

class Handler_Time extends Handler {
    constructor ( category ) {
        super( category )
    }

    get ( is12Hour ) {
        const _is12Hour = !is12Hour ? true : ( typeof is12Hour == 'boolean' ) ? is12Hour : true,
        
        date = new Date(),
        hour = date.getHours(),
        minutes = date.getMinutes()

        return {
            full: useMeridiem => {
                const _useMeridiem = !useMeridiem ? true : ( typeof useMeridiem == 'boolean' ) ? useMeridiem : true,
                
                trueMinute = ( minutes < 10 ) ? `0${ minutes }`: minutes,
                meridiem = ( hour == 0 ) ? 'a.m.' : ( hour >= 12 ) ? 'p.m.' : 'a.m.'

                switch ( _is12Hour ) {
                    case true:
                        const trueHour = ( hour == 0 ) ? 12 : ( hour > 12 ) ? hour - 12 : hour

                        return `${ trueHour }:${ trueMinute }${ ( _useMeridiem == true ) ? ` ${ meridiem }` : '' }`
                        break
                    case false:
                        return `${ hour }:${ trueMinute }${ ( _useMeridiem == true ) ? ` ${ meridiem }` : '' }`
                        break
                }
            }
        }
    }
}

export { Handler_Time as handler }