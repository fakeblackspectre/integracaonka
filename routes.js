const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const axios = require('axios');
const Utente = require('./Database/utente');
const Tratamento = require('./Database/tratamento');
const Terapeuta = require('./Database/terapeuta');
const Calendario = require('./Database/calendario');
const moment = require('moment');
const ApiConfiguracao = require('./Database/apiConfiguracao');

const router = express.Router();

// Rota para receber código do utente e devolver os dados do utente
router.get('/utente', verifyJWT, async (req, res, next) => {
  try {
    const id = req.body.id;
    if (id) {
      const utente = await Utente.getUtente(id);
      return res.json(utente);
    }
    console.log('entrei')
    const utenteAll = await Utente.getAllUtentes();
    res.json(utenteAll);
  } catch (err) {
    next(createError(500, err.message));
  }
});

// Rota para receber código do tratamento e devolver os dados do tratamento e respetivas aulas
router.get('/tratamento', verifyJWT, async (req, res, next) => {
  try {
    const id = req.body.id;
    if (id) {
      const cabecalho = await Tratamento.getTratamento(id);
      const aulas = await Tratamento.getAulas(id);
      const tratamento = { ...cabecalho, aulas: [...aulas] };

      return res.json(tratamento);
    }

    let tratamentoAll = new Array();
    const cabecalhoAll = await Tratamento.getAllTratamento();

    for await (c of cabecalhoAll) {
      const aulas = await Tratamento.getAulas(c.c_tratamen);
      const tratamento = { ...c, aulas: [...aulas] };
      tratamentoAll.push(tratamento);
    }

    res.json(tratamentoAll);
  } catch (err) {
    next(createError(500, err.message));
  }
});

router.get('/fisioterapeuta', verifyJWT, async (req, res, next) => {
  try {
    const id = req.body.id; // Exemplo: T123|1
    if (id) {
      const splited = id.split('|');
      const codigo = splited[0].substring(1);
      const tipo = splited[0][0];
      const filtro = splited[1];
      const terapeuta = await Terapeuta.getTerapeuta(codigo, tipo, filtro);

      return res.json(terapeuta);
    }
    const terapeutaAll = await Terapeuta.getAllTerapeuta();
    res.json(terapeutaAll);
  } catch (err) {
    next(createError(500, err.message));
  }
});

router.get('/calendario', verifyJWT, async (req, res, next) => {
  try {
    // #region funções
    const getSigla = {
      0: 'dm',
      1: 'sg',
      2: 'tr',
      3: 'qr',
      4: 'qn',
      5: 'sx',
      6: 'sb'
    };

    const addHorasPossiveis = (inicioP, fimP, intervalo, data, remove) => {
      const inicio = moment(inicioP, 'HH:mm');
      const fim = moment(fimP, 'HH:mm');
      for (let t = inicio; t < fim; t = t.add(intervalo, 'm')) {
        if (remove) {
          disponibilidadesDia = disponibilidadesDia.filter(
            (f) =>
              f.data.getTime() != data.getTime() || f.hora != t.format('HH:mm')
          );
          continue;
        }
        const vaga = {
          data: new Date(data.getTime()),
          hora: t.format('HH:mm'),
          vagas: maxTratamentos,
        };
        disponibilidadesDia.push(vaga);
      }
    };
    //#endregion
    //
    let disponibilidades = [];
    let disponibilidadesDia = [];
    let maxTratamentos;
    const id = req.body.id; // Exemplo: T123|1
    if (id) {
      const splited = id.split('|');
      const codigo = splited[0].substring(1);
      const tipo = splited[0][0];
      const filtro = splited[1];

      const terapeuta = await Terapeuta.getTerapeuta(codigo, tipo, filtro);
      if (!terapeuta) return res.json(terapeuta);

      const horarioVariavel = await Terapeuta.getHorarioVariavelTerapeuta(
        codigo,
        tipo
      );
      const folgas = await Terapeuta.getFolgasTerapeuta(codigo, tipo);
      const tempoTratamento = terapeuta.min_marc;
      const TempoTratamentoMinutos =
        moment(tempoTratamento, 'HH:mm').get('hours') * 60 +
        moment(tempoTratamento, 'HH:mm').get('minutes');
      maxTratamentos = terapeuta.maxtrat;
      const marcacoes = await Terapeuta.getAulasTerapeuta(codigo, tipo, filtro);
      //const empresa = await Calendario.getEmpresa(filtro);
      const folgasEmpresa = await Calendario.getFolgasEmpresa(filtro);
      const aulas = await Calendario.getMarcacoesComUnidade(
        codigo,
        tipo,
        filtro
      );

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataFinal = new Date(
        hoje.getFullYear() + 2, // Enviar intervalo de 2 anos
        hoje.getMonth(),
        hoje.getDate()
      );

      for (let d = hoje; d <= dataFinal; d.setDate(d.getDate() + 1)) {
        disponibilidadesDia = [];
        const diaSemana = d.getDay(); // domingo 0 // segunda 1....
        if (folgasEmpresa.includes(diaSemana)) continue;
        let sigla = getSigla[diaSemana];
        const horaInicioManha = terapeuta[`${sigla}_m_hi`];
        const horaFimManha = terapeuta[`${sigla}_m_hf`];
        const horaInicioTarde = terapeuta[`${sigla}_t_hi`];
        const horaFimTarde = terapeuta[`${sigla}_t_hf`];

        // #region Horário fixo de manhã
        if (!!horaInicioManha && !!horaFimManha)
          addHorasPossiveis(
            horaInicioManha,
            horaFimManha,
            TempoTratamentoMinutos,
            d
          );
        // #endregion
        // #region Horário fixo de tarde
        if (!!horaInicioTarde && !!horaFimTarde)
          addHorasPossiveis(
            horaInicioTarde,
            horaFimTarde,
            TempoTratamentoMinutos,
            d
          );
        //#endregion
        // #region HORARIO VARIAVEL
        const horarioVariavelDia = horarioVariavel.filter(
          (f) => f.data.getTime() == d.getTime()
        );
        if (horarioVariavelDia.length == 1) {
          // ou tem 1 ou tem 0 // não pode ter mais do que 1 por dia
          //Horario Variavel Manha
          if (
            !!horarioVariavelDia[0].d_m_inic &&
            !!horarioVariavelDia[0].d_m_fim
          ) {
            addHorasPossiveis(
              horarioVariavelDia[0].d_m_inic,
              horarioVariavelDia[0].d_m_fim,
              TempoTratamentoMinutos,
              d
            );
          }
          //Horario Variavel Tarde
          if (
            !!horarioVariavelDia[0].d_t_inic &&
            !!horarioVariavelDia[0].d_t_fim
          ) {
            addHorasPossiveis(
              horarioVariavelDia[0].d_t_inic,
              horarioVariavelDia[0].d_t_fim,
              TempoTratamentoMinutos,
              d
            );
          }
        }
        // #endregion
        // #region FOLGAS
        const folgasDia = folgas.filter((f) => f.data.getTime() == d.getTime());
        if (folgasDia.length == 1) {
          if (!!folgasDia[0].d_m_inic && !!folgasDia[0].d_m_fim) {
            addHorasPossiveis(
              folgasDia[0].d_m_inic,
              folgasDia[0].d_m_fim,
              TempoTratamentoMinutos,
              d,
              true
            );
          }
          if (!!folgasDia[0].d_t_inic && !!folgasDia[0].d_t_fim) {
            addHorasPossiveis(
              folgasDia[0].d_t_inic,
              folgasDia[0].d_t_fim,
              TempoTratamentoMinutos,
              d,
              true
            );
          }
        }
        //#endregion
        // #region Remover Vagas Por Marcação
        const aulasDia = aulas.filter((f) => f.data.getTime() == d.getTime());
        if (aulasDia.length > 0) {
          aulasDia.forEach((e) => {
            for (let a of disponibilidadesDia) {
              if (
                a.data.getTime() == e.data.getTime() &&
                a.hora == e.horainic
              ) {
                a.vagas -= e.UnidadeTempo;
                break;
              }
            }
          });
        }
        disponibilidadesDia = disponibilidadesDia.filter((f) => {
          return f.vagas > 0;
        });

        // #endregion

        disponibilidadesDia.sort((a, b) =>
          moment(a.hora, 'HH:mm') > moment(b.hora, 'HH:mm')
            ? 1
            : moment(b.hora, 'HH:mm') > moment(a.hora, 'HH:mm')
            ? -1
            : 0
        ); // ordenar por hora
        disponibilidades = disponibilidades.concat(disponibilidadesDia); // adicionar ao array global as disponiblidades do dia
      }

      const calendario = {
        id: terapeuta.id,
        nome: terapeuta.nome,
        marcacoes,
        disponibilidades,
      };
      res.json(calendario);
    } else {
      const terapeutaAll = await Terapeuta.getAllTerapeuta();
      if (terapeutaAll.length == 0) return res.json(terapeutaAll);
      let calendarioAll = new Array();
      for await (terapeuta of terapeutaAll) {
        disponibilidades = [];
        const splited = terapeuta.id.split('|');
        const codigo = splited[0].substring(1);
        const tipo = splited[0][0];
        const filtro = splited[1];
        const horarioVariavel = await Terapeuta.getHorarioVariavelTerapeuta(
          codigo,
          tipo
        );
        const folgas = await Terapeuta.getFolgasTerapeuta(codigo, tipo);
        const tempoTratamento = terapeuta.min_marc;
        const TempoTratamentoMinutos =
          moment(tempoTratamento, 'HH:mm').get('hours') * 60 +
          moment(tempoTratamento, 'HH:mm').get('minutes');
        maxTratamentos = terapeuta.maxtrat;
        const marcacoes = await Terapeuta.getAulasTerapeuta(
          codigo,
          tipo,
          filtro
        );
        //const empresa = await Calendario.getEmpresa(filtro);
        const folgasEmpresa = await Calendario.getFolgasEmpresa(filtro);
        const aulas = await Calendario.getMarcacoesComUnidade(
          codigo,
          tipo,
          filtro
        );
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataFinal = new Date(
          hoje.getFullYear() + 2, // Enviar intervalo de 2 anos
          hoje.getMonth(),
          hoje.getDate()
        );

        for (let d = hoje; d <= dataFinal; d.setDate(d.getDate() + 1)) {
          disponibilidadesDia = [];
          const diaSemana = d.getDay(); // domingo 0 // segunda 1....
          if (folgasEmpresa.includes(diaSemana)) continue;
          let sigla = getSigla[diaSemana];

          const horaInicioManha = terapeuta[`${sigla}_m_hi`];
          const horaFimManha = terapeuta[`${sigla}_m_hf`];
          const horaInicioTarde = terapeuta[`${sigla}_t_hi`];
          const horaFimTarde = terapeuta[`${sigla}_t_hf`];

          // #region Horário fixo de manhã
          if (!!horaInicioManha && !!horaFimManha)
            addHorasPossiveis(
              horaInicioManha,
              horaFimManha,
              TempoTratamentoMinutos,
              d
            );
          // #endregion
          // #region Horário fixo de tarde
          if (!!horaInicioTarde && !!horaFimTarde)
            addHorasPossiveis(
              horaInicioTarde,
              horaFimTarde,
              TempoTratamentoMinutos,
              d
            );
          //#endregion
          // #region HORARIO VARIAVEL
          const horarioVariavelDia = horarioVariavel.filter(
            (f) => f.data.getTime() == d.getTime()
          );
          if (horarioVariavelDia.length == 1) {
            // ou tem 1 ou tem 0 // não pode ter mais do que 1 por dia
            //Horario Variavel Manha
            if (
              !!horarioVariavelDia[0].d_m_inic &&
              !!horarioVariavelDia[0].d_m_fim
            ) {
              addHorasPossiveis(
                horarioVariavelDia[0].d_m_inic,
                horarioVariavelDia[0].d_m_fim,
                TempoTratamentoMinutos,
                d
              );
            }
            //Horario Variavel Tarde
            if (
              !!horarioVariavelDia[0].d_t_inic &&
              !!horarioVariavelDia[0].d_t_fim
            ) {
              addHorasPossiveis(
                horarioVariavelDia[0].d_t_inic,
                horarioVariavelDia[0].d_t_fim,
                TempoTratamentoMinutos,
                d
              );
            }
          }
          // #endregion
          // #region FOLGAS
          const folgasDia = folgas.filter(
            (f) => f.data.getTime() == d.getTime()
          );
          if (folgasDia.length == 1) {
            if (!!folgasDia[0].d_m_inic && !!folgasDia[0].d_m_fim) {
              addHorasPossiveis(
                folgasDia[0].d_m_inic,
                folgasDia[0].d_m_fim,
                TempoTratamentoMinutos,
                d,
                true
              );
            }
            if (!!folgasDia[0].d_t_inic && !!folgasDia[0].d_t_fim) {
              addHorasPossiveis(
                folgasDia[0].d_t_inic,
                folgasDia[0].d_t_fim,
                TempoTratamentoMinutos,
                d,
                true
              );
            }
          }
          //#endregion
          // #region Remover Vagas Por Marcação
          const aulasDia = aulas.filter((f) => f.data.getTime() == d.getTime());
          if (aulasDia.length > 0) {
            aulasDia.forEach((e) => {
              for (let a of disponibilidadesDia) {
                if (
                  a.data.getTime() == e.data.getTime() &&
                  a.hora == e.horainic
                ) {
                  a.vagas -= e.UnidadeTempo;
                  break;
                }
              }
            });
          }
          disponibilidadesDia = disponibilidadesDia.filter((f) => {
            return f.vagas > 0;
          });

          // #endregion

          disponibilidadesDia.sort((a, b) =>
            moment(a.hora, 'HH:mm') > moment(b.hora, 'HH:mm')
              ? 1
              : moment(b.hora, 'HH:mm') > moment(a.hora, 'HH:mm')
              ? -1
              : 0
          ); // ordenar por hora
          disponibilidades = disponibilidades.concat(disponibilidadesDia); // adicionar ao array global as disponiblidades do dia
        }
        const calendario = {
          id: terapeuta.id,
          nome: terapeuta.nome,
          marcacoes,
          disponibilidades,
        };
        calendarioAll.push(calendario);
      }

      res.json(calendarioAll);
    }
  } catch (err) {
    next(createError(500, err.message));
  }
});

// Rota para fazer login e devolver o token de autenticação
router.post('/login', (req, res, next) => {
  // esse teste abaixo deve ser feito no seu banco de dados
  if (
    req.body.ClientID === process.env.CLIENT_ID &&
    req.body.ClientSecret === process.env.CLIENT_SECRET
  ) {
    // auth ok
    const id = 1; // esse id viria do banco de dados
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 3600, // expires in 5min
    });
    return res.json({
      acess_token: token,
      expires_in: 3599,
      token_type: 'Bearer',
    });
  }
  res.status(500).json({ message: 'Login inválido!' });
});

router.post('/logout', (req, res) => {
  res.json({ auth: false, token: null });
});

// Recebe as requisições da clicloud e reencaminha o pedido para NKA
// Server para todos //UTENTES // CALENDARIO // FISIOTERAPEUTA // TRATAMENTO
router.post('/sendWebhook', async (req, res, next) => {
  if (
    req.body.modulo ||
    req.body.operacao ||
    req.body.operacaoregisto ||
    req.body.id ||
    req.body.urlexterno
  ) {
    const data = {
      modulo: req.body.modulo,
      operacao: req.body.operacao,
      operacaoregisto: req.body.operacaoregisto,
      id: req.body.id,
      clientid: process.env.NKA_CLIENT_ID,
      clientsecret: process.env.NKA_CLIENT_SECRET,
    };
    try {
      const hooks = registerHooks(req.body.urlexterno);
      hooks.trigger('callback_hook', data);
      return res.json({ message: 'webhook sent!' });

    } catch (err) {
      return next(createError(500, 'Erro a comunicar com API externa'));
    }
  }
  next(createError(500, 'API - Parâmetros em falta!'));
});

const registerHooks = (urlExterno) => {
  return new webhooks({
      db: {
          'callback_hook': [urlExterno]
      }
  });
}

//receber webhooks de NKA quando é alterada uma aula ou um registo de presença
router.post('/api/webhook', async (req, res, next) => {
  const _modulo = req.body.modulo;
  const _operacao = req.body.operacao;
  const _operacaoregisto = req.body.operacaoregisto;
  const _id = req.body.id;
  const _clientid = req.body.clientid;
  const _clientsecret = req.body.clientsecret;

  if (
    _clientid === process.env.CLIENT_ID &&
    _clientsecret === process.env.CLIENT_SECRET
  ) {
    const urlExterno = await ApiConfiguracao.getUrlExterno();
    const acess_token = await ObterTokenNKA(urlExterno);

    const header = {
      headers: { Authorization: `Bearer ${acess_token}` },
    };
    const urlModulo = urlExterno + `/${_modulo}/${_id}`;
    try {
      const resp = await axios.post(urlModulo, {}, header);
      if (resp) {
        if (_modulo == 'agenda') return Agenda(resp);
        if (_modulo == 'cabectarefas') return Presenca(resp);
      }
    } catch (err) {
      next(createError(500, err.message));
    }
  }
});

function Agenda(resp) {
  return 'A agenda ainda não faz nada';
}

function Presenca(resp) {
  return 'A presença ainda não faz nada';
}

// Obter token do url da NKA
async function ObterTokenNKA(urlExterno) {
  const data = {
    ClientID: process.env.NKA_CLIENT_ID,
    ClientSecret: process.env.NKA_CLIENT_SECRET,
  };
  try {
    const resp = await axios.post(urlExterno, data);
    if (resp && !!resp.acess_token) return resp.acess_token;
    createError(500, 'Erro a comunicar com a API externa');
  } catch (err) {
    createError(500, err.message);
  }
}

// Função que trata de validar o token
function verifyJWT(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ auth: false, message: 'No token provided.' });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(500)
        .json({ auth: false, message: 'Failed to authenticate token.' });
    }

    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id;
    next();
  });
}

router.use((req, res, next) => {
  next(createError(404, 'Not found'));
});

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message || 'Internal Server Error',
    },
  });
});

module.exports = router;
