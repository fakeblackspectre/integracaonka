const dboperations = require('../Utils/dboperations');
const utils = require('../Utils/utils');

class ApiConfiguracao {
  static async getUrlExterno() {
    try {
      let _sql = `select UrlExterno, Codigo 
      from API.Configuracao
      where Ativo = 1 `;

      return await dboperations.getItem(_sql);
    } catch (error) {
      utils.handleError(error, error.message);
    }
  }
}

module.exports = ApiConfiguracao;
