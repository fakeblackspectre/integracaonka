const dboperations = require('./dboperations')
const utils = require('./utils')

class Utente{
    //constructor(c_utente, Nome, Contribuinte){
    //    this.Id = c_utente;
    //    this.Nome = Nome;
    //    this.Contribuinte = Contribuinte;
    //}

    static async getUtente(codigo){
        try {
            let params = new Array()
            params.push(codigo)
    
            let _sql = "Select c_utente Id, nome Nome, n_contrib Contribuinte from UTENTES where c_utente = @1";
            
            return await dboperations.getItem(_sql, params)
        }
        catch(error) {
            utils.handleError(error, "Não foi encontrado o utente com o código " + codigo)
        }
    }

}

module.exports = Utente;