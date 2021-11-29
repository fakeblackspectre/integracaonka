const dboperations = require('../Utils/dboperations');
const utils = require('../Utils/utils');

class Tratamento {
  static async getTratamento(codigo) {
    try {
      let params = new Array();
      params.push(codigo);

      let _sql = `
            select t.c_tratamen, u.c_utente, u.nome, u.n_contrib
            from TRATAMEN t
            inner join UTENTES u on t.c_utente = u.c_utente
            where t.c_tratamen = @1`;

      return await dboperations.getItem(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        error.message + ` do tratamento com o código ${codigo}`
      );
    }
  }

  static async getAllTratamento() {
    try {
      let params = new Array();

      let _sql = `
      select t.c_tratamen, u.c_utente, u.nome, u.n_contrib 
      from TRATAMEN t 
      inner join UTENTES u on t.c_utente = u.c_utente
      inner join SESSTRAT s on t.c_tratamen = s.c_tratamen and isnull(s.apagado, 0) = 0
      inner join (
        select c_tecnico, filtro, 'T' tipo from TERAPEUTA where isnull(Pilates, 0) = 1
        UNION ALL 
        select c_tecnico, filtro, 'A' tipo from AUXILIAR where isnull(Pilates, 0) = 1
        UNION ALL 
        select c_tecnico, filtro, 'O' tipo from TERAPEUTAOCUP where isnull(Pilates, 0) = 1
      ) tec on (tec.tipo = 'T' AND tec.c_tecnico = s.c_fisioter AND t.filtro = tec.filtro)
      OR (tec.tipo = 'A' AND tec.c_tecnico = s.c_auxiliar AND t.filtro = tec.filtro)
      OR (tec.tipo = 'O' AND tec.c_tecnico = s.outro AND t.filtro = tec.filtro)
      group by t.c_tratamen, u.c_utente, u.nome, u.n_contrib`;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(error, error.message);
    }
  }

  static async getAulas(codigo) {
    try {
      let params = new Array();
      params.push(codigo);

      let _sql = `
            select s.c_sesstrat codigo, s.data, s.horainic, 
            convert(varchar(5), cast(convert(datetime, s.horainic) + convert(datetime, ter.min_marc) as time)) horafim,
            ter.tipo + convert(varchar, ter.c_tecnico) + '|' + convert(varchar, ter.filtro) codigotecnico, 
            ter.nome nometecnico
            from TRATAMEN t
            inner join INSTITUI i on i.c_instit = t.codinst
            inner join SESSTRAT s on t.c_tratamen = s.c_tratamen 
                AND isnull(s.apagado, 0) = 0 AND (isnull(s.faltou, 0) = 0 or isnull(i.faltas, 0) = 0)
                AND (isnull(t.suspenso, 0) = 0 
                    or (isnull(t.suspenso, 0) = 1 AND t.DataSuspensao > s.data) 
                    or (isnull(t.suspenso, 0) = 1 AND t.DataSuspensao = s.data AND isnull(s.histsess, 0) = 1) 
                ) 
            left join (
                select c_tecnico, filtro, nome, min_marc, 'T' tipo from TERAPEUTA where Pilates = 1
                UNION ALL 
                select c_tecnico, filtro, nome, min_marc, 'A' tipo from AUXILIAR where Pilates = 1
                UNION ALL 
                select c_tecnico, filtro, nome, min_marc, 'O' tipo from TERAPEUTAOCUP where Pilates = 1
            ) ter on t.filtro = ter.filtro AND (
                (s.c_fisioter = ter.c_tecnico AND ter.tipo = 'T') or 
                (s.c_auxiliar = ter.c_tecnico AND ter.tipo = 'A') or
                (s.outro = ter.c_tecnico AND ter.tipo = 'O')
                )
            where t.c_tratamen = @1`;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        error.message + ` de aulas para o tratamento com o código ${codigo}`
      );
    }
  }
}

module.exports = Tratamento;
