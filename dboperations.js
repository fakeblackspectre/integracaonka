var config = require('./dbconfig')
var utils = require('./utils')
const sql = require('mssql')

async function getList(_sql, _params){
    try {
        if (_params){
            _params.forEach((param, index) => {
                _sql = replaceQueryParameters(_sql, index, param)
            });
        }
        let pool = await sql.connect(config)
        let bd = await pool.request().query(_sql)
        return bd.recordsets;
    }
    catch (error){
        utils.handleError(error, "Erro a obter a lista")
    }
}

async function getItem(_sql, _params){
    try {
        let result = await getList(_sql, _params)

        if (result.length > 1) throw new Error("Foram encontrados mais que um registo")
        if (result.length == 1) return result[0]
        // devolver undefined
    }
    catch (error){
        utils.handleError(error, "Erro a obter item")
    }
}

function replaceQueryParameters(_sql, index, param){
    index++;// Os parametros vão começar no 1
    return _sql.replace('@'+ index, `'${param}'`)
}

module.exports = {
    getList: getList,
    getItem: getItem
}