import { Parser_MOBJX } from './parsers/mobjx.module.js'
import { Parser_MNATPK } from './parsers/mnatpk.module.js'

const parser = {
    mnatpk: new Parser_MNATPK(),
    mobjx: new Parser_MOBJX(),
}

export { parser }