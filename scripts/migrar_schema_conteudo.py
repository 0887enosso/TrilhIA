"""
Migração de schema de conteúdo: de {conteudo: [...], questoes: [...]}
para {aulas: [{..., atividade: {...}}], atividade_final: [...]}.

Regra de distribuição: as primeiras 4 questões (uma por tela/aula, na ordem
original) viram a atividade embutida de cada aula. Tudo que sobrar (3 nos
módulos com 7 questões, 4 nos que têm a 8ª questão de revisão espaçada) vira
a atividade_final do módulo.

Não mexe no módulo 30 (schema próprio, sem 'conteudo'/'questoes').
Não mexe em conquista_de_bloco / conquista_final — só reposiciona.
"""
import json
import glob

ARQUIVOS = sorted(glob.glob('content/trilha-basica/modulos/*.json')) + \
           sorted(glob.glob('content/trilha-intermediaria/modulos/*.json'))

migrados = []

for caminho in ARQUIVOS:
    with open(caminho, encoding='utf-8') as f:
        dados = json.load(f)

    if 'conteudo' not in dados or 'questoes' not in dados:
        continue  # módulo 30 (ou qualquer módulo já migrado numa rerun)

    conteudo = dados['conteudo']
    questoes = dados['questoes']

    aulas = []
    for i, tela in enumerate(conteudo):
        aula = {
            'ordem': tela['ordem'],
            'titulo_aula': tela['titulo_tela'],
            'corpo': tela['corpo'],
        }
        if 'destaque' in tela:
            aula['destaque'] = tela['destaque']
        aula['atividade'] = questoes[i]
        aulas.append(aula)

    atividade_final = questoes[len(conteudo):]

    novo = {}
    for chave in ('modulo_id', 'trilha', 'bloco', 'ordem', 'titulo', 'descricao_curta', 'tempo_estimado_min'):
        if chave in dados:
            novo[chave] = dados[chave]
    novo['objetivos_aprendizagem'] = dados['objetivos_aprendizagem']
    novo['aulas'] = aulas
    novo['atividade_final'] = atividade_final
    if 'conquista_de_bloco' in dados:
        novo['conquista_de_bloco'] = dados['conquista_de_bloco']
    if 'conquista_final' in dados:
        novo['conquista_final'] = dados['conquista_final']

    with open(caminho, 'w', encoding='utf-8') as f:
        json.dump(novo, f, ensure_ascii=False, indent=2)
        f.write('\n')

    migrados.append((caminho, len(aulas), len(atividade_final)))

print(f'{len(migrados)} módulos migrados.\n')
for caminho, n_aulas, n_final in migrados:
    print(f'{caminho}: {n_aulas} aulas (1 atividade cada) + atividade_final com {n_final} questões')
