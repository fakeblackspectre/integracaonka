const dboperations = require('../Utils/dboperations');
const utils = require('../Utils/utils');

class Calendario {
  static async getEmpresa(filtro) {
    try {
      let params = new Array();
      params.push(filtro);

      let _sql = `
      select hora_inic_manha, hora_fim_tarde 
      from EMPRESAS where c_empresa = @1`;

      return await dboperations.getItem(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Não foi encontrada a empresa com o código ' + filtro
      );
    }
  }
  static async getFolgasEmpresa(filtro) {
    try {
      let params = new Array();
      params.push(filtro);

      let _sql = `
      select (dia - 1) dia, filtro from CLINFOLG where filtro = @1`;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Não foram encontradas folgas da empresa com o código ' + filtro
      );
    }
  }
  static async getMarcacoesComUnidade(codigo, tipo, filtro) {
    try {
      let params = new Array();
      params.push(codigo, tipo, filtro);

      let _sql = `
      select data, horainic, SUM(UnidadeTempo) UnidadeTempo from (
        select s.data, case when(ter.tipo= 'T')then(s.horafisio)
          when(ter.tipo= 'A')then(s.horafisio)	
          else s.horaoutro end horainic, 
          case when(ter.tipo= 'T')then(isnull(t.unidadeTempoFisio, 1))
          when(ter.tipo= 'A')then(isnull(t.unidadeTempoAux, 1))	
          else isnull(t.unidadeTempoOutro, 1) end UnidadeTempo
      
        from TRATAMEN t 
        INNER JOIN INSTITUI i on i.c_instit = t.codinst
        INNER JOIN SESSTRAT s on t.c_tratamen = s.c_tratamen AND isnull(s.apagado, 0) = 0 
        AND (isnull(s.faltou, 0) = 0 or isnull(i.faltas, 0) = 0)
        AND (isnull(t.suspenso, 0) = 0 or t.DataSuspensao > s.data or (t.DataSuspensao = s.data AND isnull(s.histsess, 0) = 1))
        AND s.data >= cast(GETDATE() as date)
        INNER join (
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
        where isnull(t.apagado, 0) = 0
        AND ter.c_tecnico =@1 AND ter.tipo = @2 AND t.filtro = @3
      )B1 
      group by data, horainic
      order by data 
      `;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Erro a obter as marcações com unidades de tempo do terapeuta com o código ' +
          codigo +
          ' e o filtro ' +
          filtro
      );
    }
  }
}

module.exports = Calendario;
