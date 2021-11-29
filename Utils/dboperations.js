const sql = require('mssql');
const config = require('../Configs/dbconfig');
const utils = require('./utils');

async function getList(_sql, _params) {
  try {
    if (_params) {
      _params.forEach((param, index) => {
        _sql = replaceQueryParameters(_sql, index, param);
      });
    }
    const pool = await sql.connect(config);
    const bd = await pool.request().query(_sql);
    return bd.recordset;
  } catch (error) {
    utils.handleError(error, 'Erro a obter a lista');
  }
}

async function getItem(_sql, _params) {
  try {
    const result = await getList(_sql, _params);

    if (result.length === 0) {
      throw new Error('Não foram encontrados registos');
    }
    if (result.length > 1) {
      throw new Error('Foram encontrados mais que um registo');
    }
    if (result.length === 1) return result[0];
    // devolver undefined
  } catch (error) {
    utils.handleError(error, error.message);
  }
}

function replaceQueryParameters(_sql, index, param) {
  index++; // Os parametros vão começar no 1
  const _paramNumber = `@${index}`;
  const re = new RegExp(_paramNumber, 'g'); // Para fazer replace all
  return _sql.replace(re, `'${param}'`);
}

module.exports = {
  getList,
  getItem,
};
