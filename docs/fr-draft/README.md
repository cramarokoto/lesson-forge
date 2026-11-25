# Cours en micro-leçons, vérifiés par une équipe d'agents

Fabrique un cours interactif « byte-sized » (micro-leçons de 5 à 8 minutes, schéma animé qui évolue à chaque étape, panneaux de notation et de compteurs, quiz) **pour n'importe quel domaine**, à partir d'un sujet et d'une liste de chapitres.

La qualité repose sur une règle simple : **ceux qui écrivent ne valident pas**. Chaque production est relue par des sous-agents indépendants qui ne voient que le résultat et le référentiel.

## Utilisation (Claude Code)

1. Copie `inputs/exemple-physique-chimie-2nde.yaml` et remplis-le : sujet, public, langue, référentiel officiel, chapitres.
2. Lance Claude Code à la racine du dépôt, puis :
   ```
   /creer-cours inputs/mon-sujet.yaml
   ```
3. Valide le plan de chaque chapitre, puis les captures finales, avant publication.

## L'équipe

| Agent | Rôle | Voit |
|---|---|---|
| `creer-cours` (commande) | chef d'orchestre : planifie, délègue, arbitre, livre | tout |
| `cadreur` | découpe un chapitre en leçons d'après le référentiel | référentiel |
| `redacteur` | écrit les étapes, la notation, les compteurs, le quiz | plan validé |
| `scenographe` | traduit chaque étape en état de scène animable | leçon |
| `verif-exactitude` | chaque fait, chiffre, calcul ; sources | leçon + plan |
| `verif-programme` | conformité, hors-programme, ordre des notions | production + référentiel |
| `verif-pedagogie` | une idée par étape, longueur, progressivité | leçon |
| `verif-quiz` | une seule bonne réponse, distracteurs faux | quiz + leçon |
| `verif-securite` | activités concrètes sans danger | activités |
| `qa-technique` | assemblage, tests de rendu ordinateur/mobile | build |

Boucle de correction : au plus 3 tours par leçon ; une erreur non résolue est remontée à l'humain, jamais contournée.

## Structure

```
.claude/commands/creer-cours.md   prompt chef d'orchestre
.claude/agents/*.md               prompts des sous-agents
schema/course.schema.json         format des plans et des leçons
inputs/                           fichiers d'entrée (un par cours)
engine/                           moteur d'affichage (schéma isométrique, étapes, quiz)
scripts/                          validation, build, tests Playwright
work/                             productions intermédiaires et rapport
dist/                             cours final (HTML autonome)
```

## Sans Claude Code

Le contenu de `.claude/commands/creer-cours.md` peut servir de prompt dans une conversation Claude disposant de sous-agents : colle-le, puis fournis le fichier d'entrée.
