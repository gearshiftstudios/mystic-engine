onmessage = e => {
    const classes = {
        person: class {
            constructor ( gender ) {
                this.age = 0
                this.gender = gender
            }
        }
    }

    const pop = e.data[ 0 ],
        food = e.data[ 1 ],
        housing = e.data[ 2 ],
        wealth = e.data[ 3 ],
        destruction = e.data[ 4 ]

    for ( i = 0; i < pop.length; i++ ) {
        pop[ i ].age++

        if( pop[ i ].age >= 13 ) {
            if ( pop[ i ].age >= 22 ) {
                if ( Math.random() * 100 <= -0.25 * ( pop[ i ].age - 22 )^0.5 * 40 + 50 && pop[ i ].gender == 'f' ) {
                    if ( pop.length <= food * 10000 && pop.length <= housing * 10000 ) {
                        if ( Math.random() <= 0.496 ) pop.push( new classes.person( 'f' ) )
                        else pop.push( new classes.person( 'm' ) )
                    }
                }
            } else if ( pop[ i ].age <= 47 ) {
                if ( Math.random() * 100 <= 765 * ( -pop[ i ].age + 30 )^-1 - 45 && pop[ i ].gender == 'f' ) {
                    if ( pop.length <= food * 10000 && pop.length <= housing * 10000 ) {
                        if ( Math.random() <= 0.496 ) pop.push( new classes.person( 'f' ) )
                        else pop.push( new classes.person( 'm' ) )
                    }
                }
            }
        }

        if( Math.random() * 100 <= ( pop[ i ].age / 5 ) + ( ( ( pop.length ) - ( food * 10000 ) / 10000 ) * 100 ) ) {
            pop.splice( i, 1 )
        }

        if ( destruction > 0 ) pop.splice( 0,( destruction / 2 /100 ) * pop.length )
    }

    for ( let i = 0; i <= wealth / 4 ; i++ ) {
        if ( Math.random() <= 0.496 ) pop.push( new classes.person( 'f' ) )
        else pop.push( new classes.person( 'm' ) )
    }

    postMessage( [ pop ] )
}