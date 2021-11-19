const dboperations = require('./dboperations');
const utils = require('./utils');

class Utente {
  //constructor(c_utente, Nome, Contribuinte){
  //    this.Id = c_utente;
  //    this.Nome = Nome;
  //    this.Contribuinte = Contribuinte;
  //}

  static async getUtente(codigo) {
    try {
      let params = new Array();
      params.push(codigo);

      let _sql = `Select u_utente, nome, n_contrib, morada, telf, data_nasc, localidade, sexo, pai, mae, n_famil,
             txmod, contacto, contactelf, migrante, entidade_financeira, pais_efr, prefixo_pais, c_distrito, c_concelho, c_freguesia, 
             c_zona, num_bi, data_emiss, arquivo
             from UTENTES where c_utente = @1`;

      return await dboperations.getItem(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Não foi encontrado o utente com o código ' + codigo
      );
    }
  }
  static async getAllUtentes() {
    try {
      let params = new Array();

      let _sql = `Select u_utente, nome, n_contrib, morada, telf, data_nasc, localidade, sexo, pai, mae, n_famil,
             txmod, contacto, contactelf, migrante, entidade_financeira, pais_efr, prefixo_pais, c_distrito, c_concelho, c_freguesia, 
             c_zona, num_bi, data_emiss, arquivo
             from UTENTES `;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(error, 'Não foi encontrados utentes');
    }
  }
}

module.exports = Utente;
