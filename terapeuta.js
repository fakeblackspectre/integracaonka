const dboperations = require('./dboperations');
const utils = require('./utils');

class Terapeuta {
  static async getTerapeuta(codigo, tipo, filtro) {
    try {
      let params = new Array();
      params.push(codigo, tipo, filtro);

      let _sql = `
            select 
            'T' + convert(varchar, c_tecnico) + '|' + convert(varchar, filtro) id, 
            c_tecnico, nome, n_contrib, localidade, telf, num_bi, arquivo, data_emiss, data_nasc,
            pai, mae, sexo, min_marc, cartprof, maxtrat, telemovel,sg_m_hi,sg_m_hf,sg_t_hi,sg_t_hf,tr_m_hi,tr_m_hf,tr_t_hi,tr_t_hf,qr_m_hi,qr_m_hf
            ,qr_t_hi,qr_t_hf,qn_m_hi,qn_m_hf,qn_t_hi,qn_t_hf,sx_m_hi,sx_m_hf,sx_t_hi,sx_t_hf
            ,sb_m_hi,sb_m_hf,sb_t_hi,sb_t_hf,dm_m_hi,dm_m_hf,dm_t_hi,dm_t_hf, obs
            from TERAPEUTA where c_tecnico = @1 AND 'T' = @2 AND filtro = @3
            
            UNION ALL
            
            select 
            'A' + convert(varchar, c_tecnico) + '|' + convert(varchar, filtro) id, 
            c_tecnico, nome, n_contrib, localidade, telf, num_bi, arquivo, data_emiss, data_nasc,
            pai, mae, sexo, min_marc, cartprof, maxtrat, telemovel,sg_m_hi,sg_m_hf,sg_t_hi,sg_t_hf,tr_m_hi,tr_m_hf,tr_t_hi,tr_t_hf,qr_m_hi,qr_m_hf
            ,qr_t_hi,qr_t_hf,qn_m_hi,qn_m_hf,qn_t_hi,qn_t_hf,sx_m_hi,sx_m_hf,sx_t_hi,sx_t_hf
            ,sb_m_hi,sb_m_hf,sb_t_hi,sb_t_hf,dm_m_hi,dm_m_hf,dm_t_hi,dm_t_hf, obs
            from AUXILIAR where c_tecnico = @1 AND 'A' = @2 AND filtro = @3
            
            UNION ALL
            
            select 
            'O' + convert(varchar, c_tecnico) + '|' + convert(varchar, filtro) id, 
            c_tecnico, nome, n_contrib, localidade, telf, num_bi, arquivo, data_emiss, data_nasc,
            pai, mae, sexo, min_marc, cartprof, maxtrat, telemovel,sg_m_hi,sg_m_hf,sg_t_hi,sg_t_hf,tr_m_hi,tr_m_hf,tr_t_hi,tr_t_hf,qr_m_hi,qr_m_hf
            ,qr_t_hi,qr_t_hf,qn_m_hi,qn_m_hf,qn_t_hi,qn_t_hf,sx_m_hi,sx_m_hf,sx_t_hi,sx_t_hf
            ,sb_m_hi,sb_m_hf,sb_t_hi,sb_t_hf,dm_m_hi,dm_m_hf,dm_t_hi,dm_t_hf, obs
            from TERAPEUTAOCUP where c_tecnico = @1 AND 'O' = @2 AND filtro = @3`;

      return await dboperations.getItem(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Não foi encontrado o terapeuta com o código ' +
          codigo +
          ' e o filtro ' +
          filtro
      );
    }
  }

  static async getAulasTerapeuta(codigo, tipo, filtro) {
    try {
      let params = new Array();
      params.push(codigo, tipo, filtro);

      let _sql = `
      select s.data, 
      case when('T'= ter.tipo)then(s.horafisio)
           when('A'= ter.tipo)then(s.horaaux)	
           else s.horaoutro end horainic, 
      convert(varchar(5), cast(convert(datetime, 
          case when('T'= ter.tipo)then(s.horafisio)
              when('A'= ter.tipo)then(s.horaaux)	
              else s.horaoutro end
      ) + convert(datetime, ter.min_marc) as time)) horaFim
      
      from TRATAMEN t 
      INNER JOIN INSTITUI i on i.c_instit = t.codinst
      INNER JOIN SESSTRAT s on t.c_tratamen = s.c_tratamen AND isnull(s.apagado, 0) = 0 
        AND (isnull(s.faltou, 0) = 0 or isnull(i.faltas, 0) = 0)
        AND (isnull(t.suspenso, 0) = 0 or t.DataSuspensao > s.data or (t.DataSuspensao = s.data AND isnull(s.histsess, 0) = 1))
      INNER join (
          select c_tecnico, filtro, nome, min_marc, 'T' tipo from TERAPEUTA
          UNION ALL 
          select c_tecnico, filtro, nome, min_marc, 'A' tipo from AUXILIAR
          UNION ALL 
          select c_tecnico, filtro, nome, min_marc, 'O' tipo from TERAPEUTAOCUP
      ) ter on t.filtro = ter.filtro AND (
          (s.c_fisioter = ter.c_tecnico AND ter.tipo = 'T') or 
          (s.c_auxiliar = ter.c_tecnico AND ter.tipo = 'A') or
          (s.outro = ter.c_tecnico AND ter.tipo = 'O')
          )
      where isnull(t.apagado, 0) = 0
      AND ter.c_tecnico = @1 AND ter.tipo = @2 AND t.filtro = @3
      order by s.data, horainic`;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Não foram encontradas aulas para o terapeuta com o código ' +
          codigo +
          ' e o filtro ' +
          filtro
      );
    }
  }
  static async getHorarioVariavelTerapeuta(codigo, tipo) {
    try {
      let params = new Array();
      params.push(codigo, tipo);

      let _sql = `
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from HORVART where c_tecnico = @1 AND @2 = 'T' 
      UNION ALL 
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from HORVARA where c_tecnico = @1 AND @2 = 'A' 
      UNION ALL
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from HORVARTOCUP where c_tecnico = @1 AND @2 = 'O' `;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Erro a obter o horário variável do terapeuta com o código ' + codigo
      );
    }
  }
  static async getFolgasTerapeuta(codigo, tipo) {
    try {
      let params = new Array();
      params.push(codigo, tipo);

      let _sql = `
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from FOLGAST where c_tecnico = @1 AND @2 = 'T' 
      UNION ALL 
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from FOLGASA where c_tecnico = @1 AND @2 = 'A' 
      UNION ALL
      select c_tecnico, data, d_m_inic, d_m_fim , d_t_inic, d_t_fim
      from FOLGASTOCUP where c_tecnico = @1 AND @2 = 'O' `;

      return await dboperations.getList(_sql, params);
    } catch (error) {
      utils.handleError(
        error,
        'Erro a obter as folgas do terapeuta com o código ' + codigo
      );
    }
  }
}

module.exports = Terapeuta;
