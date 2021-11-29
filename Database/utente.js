const dboperations = require('../Utils/dboperations');
const utils = require('../Utils/utils');

class Utente {
  //constructor(c_utente, Nome, Contribuinte){
  //    this.Id = c_utente;
  //    this.Nome = Nome;
  //    this.Contribuinte = Contribuinte;
  //}

  static async getUtente(codigo) {
    // Função para obter um ou todos os utentes
    try {
      let params = new Array();
      params.push(codigo);

      let _sql = `Select c_utente, nome, n_contrib, morada, telf, data_nasc, localidade, sexo, pai, mae, n_famil,
             txmod, contacto, contactelf, migrante, entidade_financeira, pais_efr, prefixo_pais, c_distrito, c_concelho, c_freguesia, 
             c_zona, num_bi, data_emiss, arquivo, userapi, passapi
             from UTENTES where c_utente = @1`;

      return await dboperations.getItem(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        error.message + ` do utente com o código ${codigo}`
      );
    }
  }
  static async getAllUtentes() {
    try {
      let params = new Array();

      let _sql = `Select c_utente, nome, n_contrib, morada, telf, data_nasc, localidade, sexo, pai, mae, n_famil,
             txmod, contacto, contactelf, migrante, entidade_financeira, pais_efr, prefixo_pais, c_distrito, c_concelho, c_freguesia, 
             c_zona, num_bi, data_emiss, arquivo, userapi, passapi
             from UTENTES `;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(error, error.message);
    }
  }
}

module.exports = Utente;
