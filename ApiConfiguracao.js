const dboperations = require('./dboperations');
const utils = require('./utils');

class ApiConfiguracao {
  static async getUrlExterno() {
    try {
      let _sql = `select UrlExterno, Codigo 
      from API.Configuracao
      where Ativo = 1 `;

      return await dboperations.getItem(_sql);
    } catch (error) {
      utils.handleError(error, 'Não foi encontrada nenhuma configuração');
    }
  }
}

module.exports = ApiConfiguracao;
