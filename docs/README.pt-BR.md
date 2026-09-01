# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Italiano](README.it.md) | Português (BR) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [Indonesia](README.id.md)】

Um plugin do Obsidian que transforma um diário em um relacionamento de trabalho com uma IA — prático e em tamanho real, não um treinador de bem-estar.

Você continua escrevendo seu diário da forma que já faz, e compartilha links do seu celular da forma que já faz. O plugin lê ambos, responde com conselhos concretos, resume os links em um relatório diário e lentamente constrói uma imagem de quem você é, para que a ajuda se torne mais direcionada com o tempo.

## Funcionalidades

**Feedback do diário** — Lê o que você escreveu e responde com a voz que o assunto exige: 🫂 um confidente para um desentendimento, 🎒 um professor para algo sobre seu filho, 🔧 um engenheiro para um bug. Cada resposta começa com o emoji e o nome daquela voz, para que um dia contendo as três pareça três respostas em vez de uma parede de texto. Qual voz se aplica a quê é uma tabela editável nas configurações, assim como o emoji, nome e instrução de cada voz.

**Resumo de notícias** — Compartilhe um post do Threads, X ou Facebook para o seu vault do seu celular, e o plugin faz o resto: ele lista o link sob o cabeçalho de compartilhamentos e o escreve em um formato triplo fixo — fonte, ponto principal, por que importa. Com a pesquisa ativada, ele busca cada página e resume o que ela realmente diz, em vez de adivinhar pelo título. As pessoas salvam coisas para usar no trabalho, para tentar fazer, para alguém na família, ou simplesmente porque eram boas — então a terceira linha diz o que você pode fazer com aquilo, e nunca a avalia.

**Relatórios completos** — Quando um item merece mais do que algumas linhas, a IA o marca e escreve uma nota própria na pasta daquele dia — o que é, como fazer, ao que prestar atenção — citando o método literalmente para que seja utilizável sem reabrir a fonte. A entrada do resumo tem um link para isso. Limitado por execução, e pode ser desativado.

**Tabela de fatos** — A IA acumula fatos duradouros sobre você (pessoas, projetos, objetivos, problemas recorrentes) em uma nota comum e editável. Todas as outras funcionalidades a leem antes de responder. Os fatos são declarados como estão *agora* e reescritos conforme as coisas mudam, para que o arquivo permaneça legível após meses, em vez de crescer como um changelog.

## Como funciona um dia

1. Durante o dia, compartilhe links do seu celular para a pasta landing.
2. Escreva seu diário — apenas a seção Diário; o resto é preenchido para você.
3. Execute **Gerar Resumo**. Seus compartilhamentos aparecem sob o cabeçalho de compartilhamentos, os resumos sob o cabeçalho de resumos, e as notas de compartilhamento são movidas para o arquivo.
4. Execute **Gerar Feedback do Diário** quando quiser uma resposta ao que escreveu.

Ou defina um agendamento e deixe as etapas 3 e 4 acontecerem por conta própria.

## Layout da nota diária

Você é dono da primeira e terceira seções; a IA escreve a segunda e a quarta.

```markdown
## Diário
- o que você fez hoje

## Comentários da IA
- (A IA escreve aqui, com data e hora)

## Compartilhado hoje
- (A IA lista seus links compartilhados aqui)

## Resumo da IA
- (A IA escreve aqui, com data e hora)
```

Os cabeçalhos seguem a configuração de idioma do Obsidian, então uma interface em chinês escreve `## 日誌`, `## AI回饋` e assim por diante. Notas escritas em um idioma continuam funcionando em outro: a correspondência reconhece os cabeçalhos de todos os locais, e uma seção existente mantém qualquer cabeçalho que já tenha, em vez de ser reescrita.

As seções são encontradas pelo cabeçalho, então a ordem delas no seu arquivo não importa. Executar um comando novamente anexa um novo bloco com data e hora, em vez de substituir o que veio antes, para que várias execuções diárias se acumulem. Qualquer coisa fora desses quatro cabeçalhos nunca é tocada.

## Layout de pastas

```
ai-companion/
  journal/              notas diárias; cada dia pode receber uma pasta própria para relatórios
  news/
    landing/            ← compartilhe para esta pasta do seu celular
    archived/           compartilhamentos processados são movidos para cá
  memory/
    facts.md            o que a IA sabe sobre você — edite livremente
    _log.md             registro apenas de anexação de quando foi atualizado
```

Cada pasta é configurável nas configurações. Elas são criadas quando o plugin carrega, então a pasta landing existe antes de você procurá-la em uma tela de compartilhamento móvel.

## Instalação

Requer Obsidian 1.5.0+ no desktop.

1. Baixe `main.js`, `manifest.json` e `styles.css` da versão mais recente.
2. Coloque-os em `<vault>/.obsidian/plugins/ai-companion/`.
3. Ative o **AI Companion** em Configurações → Plugins comunitários.
4. Defina o caminho da sua CLI de IA em Configurações → AI Companion.

### Configurando a CLI

O plugin direciona o seu prompt para uma CLI de IA local via stdin e lê o seu stdout, portanto o comando deve ser executado de forma não interativa. Para o Claude Code:

Escolha sua CLI no menu suspenso e suas flags não interativas serão aplicadas para você. Apenas defina um caminho se o executável não estiver no seu `PATH`.

| CLI | Status |
| --- | --- |
| Claude Code | Verificado; prompt enviado no stdin |
| Antigravity (`agy`) | Verificado; prompt passado como argumento |
| Codex (ChatGPT) | Oferecido, mas não testado — por favor, reporte o que encontrar |

Se um comando não relatar saída, é provável que a CLI quisesse uma sessão interativa; verifique as flags em Argumentos extras.

### Compilando a partir do código-fonte

```bash
npm install
npm run build
```

## Comandos

Todos esses estão na paleta de comandos e no menu por trás do ícone da barra lateral (ribbon).

| Comando | O que faz |
| --- | --- |
| Nova Nota de Diário | Cria a nota de hoje a partir do modelo e a abre |
| Gerar Feedback do Diário | Responde à entrada do dia, na voz que cada parte exige |
| Gerar Resumo | Lista seus compartilhamentos e escreve sobre cada um |
| Acumular Fatos | Atualiza a tabela de fatos a partir da entrada do dia |
| Abrir Tabela de Fatos | Abre `facts.md` para leitura ou correção |
| Arquivar Compartilhamentos Processados | Varre quaisquer compartilhamentos processados restantes |

Os comandos que escrevem em uma nota de diário ficam desativados enquanto uma nota que não é de diário está aberta, para que nunca atuem em um arquivo que você não tinha intenção de alterar.

## Configurações

- **IA** — escolha sua CLI (Claude Code, Antigravity, Codex) e as flags necessárias são preenchidas; ou escolha Custom (Personalizado). Além de caminho, argumentos extras, modelo, tempo limite (timeout).
- **Vozes** — a tabela de situação → voz e a instrução de cada voz. Cada entrada integrada é redefinida individualmente; adicione suas próprias situações e vozes.
- **Diário** — pasta, formato de data, caminho do modelo (suporta `{{date}}` e `{{time}}`). Um modelo personalizado deve manter os quatro cabeçalhos; é assim que a IA encontra onde escrever.
- **Notícias** — pastas landing e archive, alternador de pesquisa, retenção de arquivo em dias (0 mantém tudo).
- **Agendamento** — manual (padrão), ao abrir, ou a cada N horas, com alternadores separados para se uma passagem agendada executa o resumo, o feedback ou ambos.
- **Fatos** — pasta e um alternador de ativação (desativado por padrão).
- **Aparência** — um estilo opcional para as próprias seções do plugin (cartões, silencioso, revista), desativado por padrão e restrito às notas de diário. Os estilos se aplicam no modo de Leitura; cada valor vem das variáveis CSS do Obsidian, então seu tema ainda prevalece.

### Agendamento

Execuções agendadas só acontecem enquanto o Obsidian está aberto — um plugin baseado em CLI não tem processo em segundo plano, e uma janela perdida é retomada no próximo ciclo, em vez de ser recuperada depois.

O resumo é adequado para um agendamento, pois cada execução lida com os novos compartilhamentos que chegaram. O feedback do diário fica desativado por padrão em execuções agendadas: cada passagem anexa um bloco novo, então executá-lo seis vezes por dia enche a seção com conselhos quase idênticos.

## Privacidade e segurança

Leia isto antes de ativar qualquer coisa.

- **O seu diário é enviado para um provedor de IA.** O plugin inicia uma CLI de IA local e direciona o texto do seu diário para ela. O que quer que essa CLI envie adiante — e para quem — é governado por essa ferramenta, não por este plugin. Diários contêm detalhes de saúde e assuntos de família; decida deliberadamente.
- **A IA escreve diretamente no seu vault.** Não há etapa de confirmação. Ela escreve apenas nas seções listadas acima, mas faz isso sem perguntar.
- **A procedência é mantida.** `memory/_log.md` é apenas de anexação e registra de qual dia de diário veio cada atualização de fato, para que você possa separar o que você escreveu do que a IA deduziu.
- **A tabela de fatos é sua para editar.** Se a IA registrar algo errado, abra-a e conserte; a próxima execução lerá a sua versão corrigida. Observe que a IA reescreve todo o arquivo a cada vez, então uma linha sem suporte no seu diário pode não sobreviver.
- **O agendamento é manual por padrão.** Execuções não assistidas que escrevem no seu vault devem ser uma decisão, não um padrão.
- **A exclusão do arquivo é opcional (opt-in)** e usa a lixeira do sistema, então é recuperável.
- **Apenas no desktop.** Iniciar uma CLI exige Node, então isso não pode ser executado em dispositivos móveis. Compartilhar *para* o vault a partir de um celular funciona bem — isso é apenas o Obsidian Sync.

## Internacionalização

A interface é disponibilizada em 21 idiomas, seguindo a própria configuração de idioma do Obsidian: Árabe, Alemão, Inglês, Espanhol, Persa, Francês, Indonésio, Italiano, Japonês, Coreano, Holandês, Polonês, Português, Português (Brasil), Russo, Tailandês, Turco, Ucraniano, Vietnamita, Chinês (Simplificado) e Chinês (Tradicional).

As traduções ficam em `src/i18n/locales/`. Cada localidade tem seus tipos verificados em relação ao Inglês, portanto uma chave ausente é um erro de compilação em vez de um fallback silencioso.

## Licença

MIT
