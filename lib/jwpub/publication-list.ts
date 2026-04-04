// types.ts

export type CategoriaPublicacao =
    | 'Bíblias'
    | 'Obras de referência'
    | 'Periódicos'
    | 'Livros'
    | 'Anuários'
    | 'Brochuras'
    | 'Livretos'
    | 'Folhetos'
    | 'Programas'
    | 'Séries de Artigos'
    | 'Manuais e Orientações';

export interface Publicacao {
    codigo: string;
    titulo: string;
    ano: string; // Usado como string para acomodar intervalos (ex: "1970–2025")
    categoria: CategoriaPublicacao;
}

export const publicacoes: Publicacao[] = [
    // --- Bíblias ---
    { codigo: 'nwtsty', titulo: 'Tradução do Novo Mundo (Edição de Estudo)', ano: '2024', categoria: 'Bíblias' },
    { codigo: 'nwt', titulo: 'Tradução do Novo Mundo', ano: '2015', categoria: 'Bíblias' },
    { codigo: 'Rbi8', titulo: 'Tradução do Novo Mundo com Referências', ano: '1986', categoria: 'Bíblias' },

    // --- Obras de referência ---
    { codigo: 'nwtstg', titulo: 'Glossário', ano: '2023', categoria: 'Obras de referência' },
    { codigo: 'dx60–90', titulo: 'Índice', ano: '1993', categoria: 'Obras de referência' },
    { codigo: 'dx91–25', titulo: 'Índice', ano: '2025', categoria: 'Obras de referência' },
    { codigo: 'it–1', titulo: 'Perspicaz, Volume 1', ano: '2020', categoria: 'Obras de referência' },
    { codigo: 'it–2', titulo: 'Perspicaz, Volume 2', ano: '2020', categoria: 'Obras de referência' },
    { codigo: 'rs', titulo: 'Raciocínios', ano: '1989', categoria: 'Obras de referência' },
    { codigo: 'rsg19', titulo: 'Guia de Pesquisa — 2019', ano: '2024', categoria: 'Obras de referência' },
    { codigo: 'scl', titulo: 'Princípios Bíblicos para a Vida Cristã', ano: '2023', categoria: 'Obras de referência' },

    // --- Periódicos ---
    { codigo: 'g', titulo: 'Despertai!', ano: '1970–2025', categoria: 'Periódicos' },
    { codigo: 'km', titulo: 'Nosso Ministério do Reino', ano: '1970–2015', categoria: 'Periódicos' },
    { codigo: 'mwb', titulo: 'Apostila', ano: '2016–2025', categoria: 'Periódicos' },
    { codigo: 'w, wp', titulo: 'Sentinela, A', ano: '1970–2025', categoria: 'Periódicos' },
    { codigo: 'ws', titulo: 'Sentinela, A (Fácil de Ler)', ano: '2011-2018', categoria: 'Periódicos' },

    // --- Livros ---
    { codigo: 'cl', titulo: 'Achegue-se a Jeová', ano: '2022', categoria: 'Livros' },
    { codigo: 'wt', titulo: 'Adore a Deus', ano: '2002', categoria: 'Livros' },
    { codigo: 'ad', titulo: 'Ajuda', ano: '1982', categoria: 'Livros' },
    { codigo: 'lv', titulo: '‘Amor de Deus’', ano: '2015', categoria: 'Livros' },
    { codigo: 'kj', titulo: '“As Nações Terão de Saber”', ano: '1973', categoria: 'Livros' },
    { codigo: 'lp', titulo: 'A Vida Tem Objetivo', ano: '1977', categoria: 'Livros' },
    { codigo: 'lfb', titulo: 'Histórias da Bíblia', ano: '2017', categoria: 'Livros' },
    { codigo: 'bh', titulo: 'Bíblia Ensina', ano: '2015', categoria: 'Livros' },
    { codigo: 'gh', titulo: 'Boas Novas', ano: '1977', categoria: 'Livros' },
    { codigo: 'sh', titulo: 'Busca de Deus', ano: '1990', categoria: 'Livros' },
    { codigo: 'sjj', titulo: 'Cante de Coração', ano: '2025', categoria: 'Livros' },
    { codigo: 'sn', titulo: 'Cantemos a Jeová', ano: '2009', categoria: 'Livros' },
    { codigo: 'snnw', titulo: 'Cantemos a Jeová — Novos Cânticos', ano: '2016', categoria: 'Livros' },
    { codigo: 'Ssb', titulo: 'Cantemos Louvores', ano: '1985', categoria: 'Livros' },
    { codigo: 'cj', titulo: 'Carta de Tiago', ano: '1979', categoria: 'Livros' },
    { codigo: 're', titulo: 'Clímax de Revelação', ano: '1989', categoria: 'Livros' },
    { codigo: 'kl', titulo: 'Conhecimento', ano: '1995', categoria: 'Livros' },
    { codigo: 'ce', titulo: 'Criação', ano: '1985', categoria: 'Livros' },
    { codigo: 'ct', titulo: 'Criador', ano: '1998', categoria: 'Livros' },
    { codigo: 'jd', titulo: 'Dia de Jeová', ano: '2006', categoria: 'Livros' },
    { codigo: 'ts', titulo: 'É Esta Vida?', ano: '1975', categoria: 'Livros' },
    { codigo: 'bhs', titulo: 'Entenda a Bíblia', ano: '2016', categoria: 'Livros' },
    { codigo: 'be', titulo: 'Escola do Ministério', ano: '2002', categoria: 'Livros' },
    { codigo: 'hs', titulo: 'Espírito Santo', ano: '1976', categoria: 'Livros' },
    { codigo: 'fy', titulo: 'Família Feliz', ano: '1996', categoria: 'Livros' },
    { codigo: 'hp', titulo: 'Felicidade', ano: '1981', categoria: 'Livros' },
    { codigo: 'te', titulo: 'Grande Instrutor', ano: '1972', categoria: 'Livros' },
    { codigo: 'go', titulo: 'Governo Mundial', ano: '1977', categoria: 'Livros' },
    { codigo: 'my', titulo: 'Histórias Bíblicas', ano: '2004', categoria: 'Livros' },
    { codigo: 'ia', titulo: 'Imite', ano: '2013', categoria: 'Livros' },
    { codigo: 'lr', titulo: 'Instrutor', ano: '2003', categoria: 'Livros' },
    { codigo: 'jr', titulo: 'Jeremias', ano: '2010', categoria: 'Livros' },
    { codigo: 'jy', titulo: 'Jesus — o Caminho', ano: '2015', categoria: 'Livros' },
    { codigo: 'yy', titulo: 'Juventude', ano: '1976', categoria: 'Livros' },
    { codigo: 'sg', titulo: 'Manual da Escola', ano: '1992', categoria: 'Livros' },
    { codigo: 'bw', titulo: 'Melhor Modo de Vida', ano: '1979', categoria: 'Livros' },
    { codigo: 'ka', titulo: 'O Reino de Deus de Mil Anos', ano: '1975', categoria: 'Livros' },
    { codigo: 'kr', titulo: 'O Reino de Deus já Governa!', ano: '2014', categoria: 'Livros' },
    { codigo: 'yp1', titulo: 'Os Jovens Perguntam 1', ano: '2011', categoria: 'Livros' },
    { codigo: 'yp2', titulo: 'Os Jovens Perguntam 2', ano: '2008', categoria: 'Livros' },
    { codigo: 'gm', titulo: 'Palavra de Deus', ano: '1989', categoria: 'Livros' },
    { codigo: 'pm', titulo: 'Paraíso Restabelecido', ano: '1974', categoria: 'Livros' },
    { codigo: 'tp73', titulo: 'Paz e Segurança', ano: '1973', categoria: 'Livros' },
    { codigo: 'jv', titulo: 'Proclamadores', ano: '1993', categoria: 'Livros' },
    { codigo: 'dp', titulo: 'Profecia de Daniel', ano: '1999', categoria: 'Livros' },
    { codigo: 'ip–1', titulo: 'Profecia de Isaías I', ano: '2000', categoria: 'Livros' },
    { codigo: 'ip–2', titulo: 'Profecia de Isaías II', ano: '2001', categoria: 'Livros' },
    { codigo: 'po', titulo: '“Propósito Eterno”', ano: '1976', categoria: 'Livros' },
    { codigo: 'go', titulo: 'Reino de Deus', ano: '1977', categoria: 'Livros' },
    { codigo: 'sl', titulo: 'Salvação do Homem', ano: '1976', categoria: 'Livros' },
    { codigo: 'ws', titulo: 'Segurança Mundial', ano: '1986', categoria: 'Livros' },
    { codigo: 'lff', titulo: 'Seja Feliz para Sempre!', ano: '2021', categoria: 'Livros' },
    { codigo: 'su', titulo: 'Sobrevivência', ano: '1984', categoria: 'Livros' },
    { codigo: 'bt', titulo: 'Testemunho Cabal', ano: '2023', categoria: 'Livros' },
    { codigo: 'si', titulo: '“Toda a Escritura”', ano: '1990', categoria: 'Livros' },
    { codigo: 'uw', titulo: 'Unidos', ano: '1983', categoria: 'Livros' },
    { codigo: 'kc', titulo: '“Venha o Teu Reino”', ano: '1981', categoria: 'Livros' },
    { codigo: 'cf', titulo: '‘Venha Ser Meu Seguidor’', ano: '2007', categoria: 'Livros' },
    { codigo: 'tp', titulo: 'Verdadeira Paz', ano: '1986', categoria: 'Livros' },
    { codigo: 'fl', titulo: 'Vida Familiar', ano: '1978', categoria: 'Livros' },
    { codigo: 'pe', titulo: 'Viver Para Sempre', ano: '1989', categoria: 'Livros' },
    { codigo: 'od', titulo: 'Organização de Jeová', ano: '1971', categoria: 'Livros' },
    { codigo: 'lvs', titulo: 'Continue a amar a Deus', ano: '2002', categoria: 'Livros' },

    // --- Anuários ---
    { codigo: 'yb', titulo: 'Anuários', ano: '1973–2017', categoria: 'Anuários' },
    { codigo: 'syr', titulo: 'Relatório Mundial do Ano de Serviço', ano: '2017-2024', categoria: 'Anuários' },

    // --- Brochuras ---
    { codigo: 'ypq', titulo: '10 Perguntas', ano: '2016', categoria: 'Brochuras' },
    { codigo: 'lmd', titulo: 'Ame as Pessoas', ano: '2023', categoria: 'Brochuras' },
    { codigo: 'gf', titulo: 'Amigo de Deus', ano: '2000', categoria: 'Brochuras' },
    { codigo: 'lc', titulo: 'A Vida — Teve um Criador?', ano: '2010', categoria: 'Brochuras' },
    { codigo: 'gl', titulo: '‘Boa Terra’', ano: '2003', categoria: 'Brochuras' },
    { codigo: 'fg', titulo: 'Boas Notícias', ano: '2016', categoria: 'Brochuras' },
    { codigo: 'ol', titulo: 'Caminho para a Vida', ano: '2002', categoria: 'Brochuras' },
    { codigo: 'hb', titulo: 'Como Pode o Sangue?', ano: '1990', categoria: 'Brochuras' },
    { codigo: 'rq', titulo: 'Deus Requer', ano: '1996', categoria: 'Brochuras' },
    { codigo: 'ed', titulo: 'Educação', ano: '2002', categoria: 'Brochuras' },
    { codigo: 'Lmn', titulo: '“Eis”', ano: '1986', categoria: 'Brochuras' },
    { codigo: 'sj', titulo: 'Escola', ano: '1983', categoria: 'Brochuras' },
    { codigo: 'yc', titulo: 'Ensine Seus Filhos', ano: '2014', categoria: 'Brochuras' },
    { codigo: 'ld', titulo: 'Escute a Deus', ano: '2025', categoria: 'Brochuras' },
    { codigo: 'll', titulo: 'Escute e Viva', ano: '2025', categoria: 'Brochuras' },
    { codigo: 'sp', titulo: 'Espíritos dos Mortos', ano: '2005', categoria: 'Brochuras' },
    { codigo: 'hf', titulo: 'Família', ano: '2014', categoria: 'Brochuras' },
    { codigo: 'je', titulo: 'Fazer Mundialmente a Vontade de Deus', ano: '1989', categoria: 'Brochuras' },
    { codigo: 'bp', titulo: 'Governo', ano: '1993', categoria: 'Brochuras' },
    { codigo: 'dg', titulo: 'Importa-se Deus?', ano: '2002', categoria: 'Brochuras' },
    { codigo: 'kp', titulo: 'Mantenha-se Vigilante!', ano: '2004', categoria: 'Brochuras' },
    { codigo: 'bm', titulo: 'Mensagem da Bíblia', ano: '2009', categoria: 'Brochuras' },
    { codigo: 'mb', titulo: 'Minhas Lições da Bíblia', ano: '2013', categoria: 'Brochuras' },
    { codigo: 'wi', titulo: 'Mundo sem Guerra', ano: '1992', categoria: 'Brochuras' },
    { codigo: 'na', titulo: 'Nome Divino', ano: '1984', categoria: 'Brochuras' },
    { codigo: 'pr', titulo: 'Objetivo da Vida', ano: '1993', categoria: 'Brochuras' },
    { codigo: 'gu', titulo: 'Orientações de Deus', ano: '1999', categoria: 'Brochuras' },
    { codigo: 'lf', titulo: 'Origem da Vida', ano: '2010', categoria: 'Brochuras' },
    { codigo: 'ph', titulo: 'Paz e Felicidade', ano: '2010', categoria: 'Brochuras' },
    { codigo: 'wj', titulo: 'Por Que Adorar a Deus', ano: '2000', categoria: 'Brochuras' },
    { codigo: 'we', titulo: 'Quando Morre Alguém', ano: '2005', categoria: 'Brochuras' },
    { codigo: 'ie', titulo: 'Quando Morremos', ano: '1998', categoria: 'Brochuras' },
    { codigo: 'lffi', titulo: 'Seja Feliz para Sempre! — brochura', ano: '2021', categoria: 'Brochuras' },
    { codigo: 'jt', titulo: 'Testemunhas de Jeová — Quem São? Em que Crêem?', ano: '2000', categoria: 'Brochuras' },
    { codigo: 'br78', titulo: 'TJ', ano: '1989', categoria: 'Brochuras' },
    { codigo: 'ti', titulo: 'Trindade', ano: '1989', categoria: 'Brochuras' },
    { codigo: 'ba', titulo: 'Um Livro para Todas as Pessoas', ano: '1997', categoria: 'Brochuras' },
    { codigo: 'rk', titulo: 'Verdadeira Fé', ano: '2010', categoria: 'Brochuras' },
    { codigo: 'pc', titulo: 'Verdadeira Paz e Felicidade', ano: '2009', categoria: 'Brochuras' },
    { codigo: 'hl', titulo: 'Vida Feliz', ano: '2013', categoria: 'Brochuras' },
    { codigo: 'la', titulo: 'Vida Satisfatória', ano: '2001', categoria: 'Brochuras' },
    { codigo: 'le', titulo: 'Viva Para Sempre', ano: '1982', categoria: 'Brochuras' },
    { codigo: 'rj', titulo: 'Volte para Jeová', ano: '2015', categoria: 'Brochuras' },
    { codigo: 'jl', titulo: 'Vontade de Jeová', ano: '2015', categoria: 'Brochuras' },

    // --- Livretos ---
    { codigo: 'us', titulo: 'Espíritos Invisíveis', ano: '1978', categoria: 'Livretos' },
    { codigo: 'es', titulo: 'Examine as Escrituras', ano: '2017-2025', categoria: 'Livretos' },
    { codigo: 'gc', titulo: 'Existe um Deus Que se Importa?', ano: '1976', categoria: 'Livretos' },
    { codigo: 'hu', titulo: 'Fracasso dos Planos Humanos', ano: '1974', categoria: 'Livretos' },
    { codigo: 'fu', titulo: 'Futuro Seguro', ano: '1976', categoria: 'Livretos' },
    { codigo: 'ml', titulo: 'Há Muito Mais Envolvido na Vida!', ano: '1976', categoria: 'Livretos' },
    { codigo: 'bq', titulo: 'Questão do Sangue', ano: '1977', categoria: 'Livretos' },
    { codigo: 'dn', titulo: 'Regência Divina', ano: '1972', categoria: 'Livretos' },
    { codigo: 'sv', titulo: 'Salvação da Raça Humana', ano: '1970', categoria: 'Livretos' },
    { codigo: 'og', titulo: 'Soberania de Deus', ano: '1975', categoria: 'Livretos' },
    { codigo: 'nc', titulo: 'Todas as Nações', ano: '1971', categoria: 'Livretos' },
    { codigo: 'td', titulo: 'Tópicos Bíblicos para Palestrar', ano: '1997', categoria: 'Livretos' },
    { codigo: 'sm', titulo: 'Verdadeira Submissão', ano: '1992', categoria: 'Livretos' },
    { codigo: 'dy', titulo: 'Vitória Divina', ano: '1973', categoria: 'Livretos' },

    // --- Folhetos ---
    { codigo: 'kn26', titulo: 'Alívio da Tensão', ano: '1978', categoria: 'Folhetos' },
    { codigo: 'kn27', titulo: 'Amor', ano: '1979', categoria: 'Folhetos' },
    { codigo: 'T–26', titulo: 'Aprender da Bíblia', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'kn31', titulo: 'Armagedom', ano: '1982', categoria: 'Folhetos' },
    { codigo: 'kn33', titulo: 'A Vida — Qual a Sua Origem?', ano: '1985', categoria: 'Folhetos' },
    { codigo: 'kn20', titulo: 'Boas Notícias', ano: '1975', categoria: 'Folhetos' },
    { codigo: 'rp', titulo: 'Caminho do Paraíso', ano: '1990', categoria: 'Folhetos' },
    { codigo: 'T–13', titulo: 'Confiar na Bíblia', ano: '1987', categoria: 'Folhetos' },
    { codigo: 'kt', titulo: 'Conhecer a verdade', ano: '2008', categoria: 'Folhetos' },
    { codigo: 'T–20', titulo: 'Consolo Para os Deprimidos', ano: '2000', categoria: 'Folhetos' },
    { codigo: 'kn22', titulo: 'Crime e Violência', ano: '1976', categoria: 'Folhetos' },
    { codigo: 'T–71', titulo: 'Destino Governa a Nossa Vida?', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'T–14', titulo: 'Em Que Creem as Testemunhas de Jeová?', ano: '1990', categoria: 'Folhetos' },
    { codigo: 'kn16', titulo: 'Esgota–se o Tempo', ano: '1973', categoria: 'Folhetos' },
    { codigo: 'kn28', titulo: 'Esperança', ano: '1980', categoria: 'Folhetos' },
    { codigo: 'T–16', titulo: 'Esperança para Falecidos', ano: '1987', categoria: 'Folhetos' },
    { codigo: 'T–25', titulo: 'Espírito Imortal', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'kn24', titulo: 'Família — Pode Sobreviver?', ano: '1977', categoria: 'Folhetos' },
    { codigo: 'kn32', titulo: 'Família Unida e Feliz', ano: '1983', categoria: 'Folhetos' },
    { codigo: 'kn18', titulo: 'Governo', ano: '1974', categoria: 'Folhetos' },
    { codigo: 'T–74', titulo: 'Inferno de Fogo', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'T–72', titulo: 'Maior Nome', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'kn36', titulo: 'Novo Milênio', ano: '2000', categoria: 'Folhetos' },
    { codigo: 'T–30', titulo: 'O Que Acha da Bíblia?', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'T–31', titulo: 'O Que Espera do Futuro?', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'T–34', titulo: 'O Sofrimento Vai Acabar?', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'T–15', titulo: 'Pacífico Novo Mundo', ano: '1987', categoria: 'Folhetos' },
    { codigo: 'kn30', titulo: 'Planeta Terra', ano: '1981', categoria: 'Folhetos' },
    { codigo: 'T–19', titulo: 'Pode Este Mundo Sobreviver?', ano: '2005', categoria: 'Folhetos' },
    { codigo: 'kn34', titulo: 'Por Que a Vida é Tão Cheia de Problemas?', ano: '1995', categoria: 'Folhetos' },
    { codigo: 'kn25', titulo: 'Por Que Existimos?', ano: '1978', categoria: 'Folhetos' },
    { codigo: 'T–33', titulo: 'Quem Controla o Mundo?', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'T–23', titulo: 'Quem é Jeová?', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'T–24', titulo: 'Quem é Jesus?', ano: '1999', categoria: 'Folhetos' },
    { codigo: 'T–22', titulo: 'Quem Realmente Governa o Mundo?', ano: '1992', categoria: 'Folhetos' },
    { codigo: 'T–73', titulo: 'Quem São as Testemunhas de Jeová?', ano: '2001', categoria: 'Folhetos' },
    { codigo: 'T–36', titulo: 'Reino', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'kn17', titulo: 'Religião', ano: '1973', categoria: 'Folhetos' },
    { codigo: 'kn37', titulo: 'Religião Falsa', ano: '2006', categoria: 'Folhetos' },
    { codigo: 'T–37', titulo: 'Respostas Importantes', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'T–32', titulo: 'Segredo para uma Família Feliz', ano: '2015', categoria: 'Folhetos' },
    { codigo: 'kn21', titulo: 'Seu Futuro', ano: '1975', categoria: 'Folhetos' },
    { codigo: 'kn23', titulo: 'Sofrimento', ano: '1976', categoria: 'Folhetos' },
    { codigo: 'T–27', titulo: 'Sofrimento Acabará', ano: '2005', categoria: 'Folhetos' },
    { codigo: 'yi', titulo: 'Sua Vida', ano: '2002', categoria: 'Folhetos' },
    { codigo: 'kn35', titulo: 'Todas as Pessoas', ano: '1997', categoria: 'Folhetos' },
    { codigo: 'T–21', titulo: 'Vida Familiar', ano: '1998', categoria: 'Folhetos' },
    { codigo: 'kn29', titulo: 'Vida Feliz', ano: '1981', categoria: 'Folhetos' },
    { codigo: 'kn19', titulo: 'Vida Só Isso?', ano: '1974', categoria: 'Folhetos' },
    { codigo: 'T–35', titulo: 'Voltar a Viver', ano: '2015', categoria: 'Folhetos' },

    // --- Programas ---
    { codigo: 'ca-brpgm', titulo: 'Programa da Assembleia de Circuito com o Representante de Betel', ano: '2017-2025', categoria: 'Programas' },
    { codigo: 'ca-copgm', titulo: 'Programa da Assembleia de Circuito com o Superintendente de Circuito', ano: '2017-2025', categoria: 'Programas' },
    { codigo: 'co-pgm', titulo: 'Programa do Congresso', ano: '2017-2025', categoria: 'Programas' },

    // --- Séries de Artigos ---
    { codigo: 'ijwcl', titulo: 'A Bíblia Muda a Vida das Pessoas', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'ijwhf', titulo: 'Ajuda para a Família', ano: '2025', categoria: 'Séries de Artigos' },
    { codigo: 'hdu', titulo: 'Como Seus Donativos São Usados', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'foa', titulo: 'De Nossos Arquivos', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'lfs', titulo: 'Histórias de Vida', ano: '2023', categoria: 'Séries de Artigos' },
    { codigo: 'ijwia', titulo: 'Imite a Sua Fé', ano: '2020', categoria: 'Séries de Artigos' },
    { codigo: 'ijwyp', titulo: 'Os Jovens Perguntam', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'mrt', titulo: 'Outros Assuntos', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'ijwbq', titulo: 'Perguntas Bíblicas Respondidas', ano: '2023', categoria: 'Séries de Artigos' },
    { codigo: 'ijwfq', titulo: 'Perguntas Frequentes sobre as Testemunhas de Jeová', ano: '2022', categoria: 'Séries de Artigos' },
    { codigo: 'ijwif', titulo: 'Presos por causa de sua fé', ano: '2023', categoria: 'Séries de Artigos' },
    { codigo: 'ijwex', titulo: 'Relatos da Vida de Testemunhas de Jeová', ano: '2023', categoria: 'Séries de Artigos' },
    { codigo: 'ijwbv', titulo: 'Textos Bíblicos Explicados', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'ijwwd', titulo: 'Teve um Projeto?', ano: '2024', categoria: 'Séries de Artigos' },
    { codigo: 'ljfac', titulo: 'Vamos Aprender com os Amigos de Jeová — Atividades', ano: '2024', categoria: 'Séries de Artigos' },

    // --- Manuais e Orientações ---
    { codigo: 'S-38', titulo: 'Instruções Reunião Vida e Ministério', ano: '2023', categoria: 'Manuais e Orientações' }
];

/**
 * Exemplo de como usar:
 * * const biblias = publicacoes.filter(p => p.categoria === 'Bíblias');
 * const publicacaoPorCodigo = publicacoes.find(p => p.codigo === 'w, wp');
 */