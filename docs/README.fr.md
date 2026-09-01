# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | Français | [Deutsch](README.de.md) | [Español](README.es.md) | [Italiano](README.it.md) | [Português (BR)](README.pt-BR.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [Indonesia](README.id.md)】

Un plugin Obsidian qui transforme un journal quotidien en une relation de travail avec une IA —
pratique et à taille humaine, pas un coach de bien-être.

Vous continuez à écrire votre journal comme vous le faites déjà, et vous partagez des liens depuis votre téléphone
comme vous le faites déjà. Le plugin lit les deux, répond avec des conseils concrets, résume les
liens en une synthèse quotidienne, et construit lentement une image de qui vous êtes pour que son aide devienne
plus ciblée avec le temps.

## Fonctionnalités

**Retour sur le journal** — Lit ce que vous avez écrit et répond avec le ton que le sujet requiert :
🫂 un confident pour une dispute, 🎒 un professeur pour quelque chose concernant votre enfant, 🔧 un ingénieur
pour un bug. Chaque réponse commence par l'emoji et le nom de ce ton, de sorte qu'une journée contenant les trois
se lit comme trois réponses plutôt qu'un seul bloc de texte. L'attribution d'un ton à une situation est
un tableau modifiable dans les paramètres, tout comme l'emoji, le nom et l'instruction de chaque ton.

**Synthèse d'actualités** — Partagez une publication depuis Threads, X ou Facebook vers votre vault depuis votre téléphone,
et le plugin fait le reste : il liste le lien sous l'en-tête de partages, puis le rédige selon une structure
fixe en trois parties — source, points à retenir, pourquoi c'est important. Avec la recherche activée, il récupère chaque page
et résume ce qu'elle dit réellement, plutôt que de deviner à partir du titre. Les gens enregistrent des choses
pour les utiliser au travail, pour essayer dans leurs propres créations, pour quelqu'un de la famille, ou simplement parce qu'elles
étaient bonnes — c'est pourquoi la troisième ligne indique ce que vous pouvez en faire, et ne l'évalue jamais.

**Rapports complets** — Lorsqu'un élément mérite plus que quelques lignes, l'IA le marque et
lui rédige une note à part dans le dossier de ce jour — ce que c'est, comment le faire, à quoi faire
attention — en citant la méthode mot pour mot afin qu'elle soit utilisable sans rouvrir la source. L'entrée de la synthèse
y fait un lien. Limité par exécution, et désactivable.

**Tableau des faits** — L'IA accumule des faits durables sur vous (personnes, projets, objectifs,
problèmes récurrents) dans une note ordinaire et modifiable. Chaque autre fonctionnalité la lit avant
de répondre. Les faits sont énoncés tels qu'ils sont *maintenant* et réécrits à mesure que les choses changent, afin que le fichier
reste lisible après des mois plutôt que de se transformer en journal des modifications.

## Comment fonctionne une journée

1. Pendant la journée, partagez des liens depuis votre téléphone vers le dossier landing.
2. Écrivez votre journal — seulement la section du journal ; le reste est rempli pour vous.
3. Exécutez **Générer la synthèse**. Vos partages apparaissent sous l'en-tête de partages, les résumés
   sous l'en-tête de synthèse, et les notes de partage sont déplacées vers les archives.
4. Exécutez **Générer un retour sur le journal** lorsque vous voulez une réponse à ce que vous avez écrit.

Ou définissez une planification et laissez les étapes 3 et 4 se produire toutes seules.

## Mise en page de la note quotidienne

Vous possédez la première et la troisième section ; l'IA écrit la deuxième et la quatrième.

```markdown
## Journal
- ce que vous avez fait aujourd'hui

## Retour IA
- (L'IA écrit ici, avec horodatage)

## Partages du jour
- (L'IA liste vos liens partagés ici)

## Synthèse IA
- (L'IA écrit ici, avec horodatage)
```

Les en-têtes suivent les paramètres de langue d'Obsidian, donc une interface chinoise écrit
`## 日誌`, `## AI回饋`, et ainsi de suite. Les notes écrites sous une langue continuent de fonctionner
sous une autre : la correspondance reconnaît les en-têtes de chaque paramètre régional, et une section
existante conserve l'en-tête qu'elle a déjà au lieu d'être réécrite.

Les sections sont trouvées par leur en-tête, donc leur ordre dans votre fichier n'a pas d'importance. Réexécuter une
commande ajoute un nouveau bloc horodaté plutôt que de remplacer ce qui précédait, de sorte que plusieurs
exécutions par jour s'accumulent. Tout ce qui se trouve en dehors de ces quatre en-têtes n'est jamais touché.

## Disposition des dossiers

```
ai-companion/
  journal/              notes quotidiennes ; chaque jour peut avoir son propre dossier pour les rapports
  news/
    landing/            ← partagez vers ce dossier depuis votre téléphone
    archived/           les partages traités sont déplacés ici
  memory/
    facts.md            ce que l'IA sait de vous — modifiez-le librement
    _log.md             enregistrement en ajout seul des dates de mise à jour
```

Chaque dossier est configurable dans les paramètres. Ils sont créés au chargement du plugin, donc le
dossier landing existe avant même que vous ne le cherchiez dans le menu de partage de votre mobile.

## Installation

Nécessite Obsidian 1.5.0+ sur ordinateur.

1. Téléchargez `main.js`, `manifest.json`, et `styles.css` depuis la dernière version.
2. Placez-les dans `<vault>/.obsidian/plugins/ai-companion/`.
3. Activez **AI Companion** dans Paramètres → Plugins communautaires.
4. Définissez votre chemin vers le CLI d'IA dans Paramètres → AI Companion.

### Configuration du CLI

Le plugin transmet votre prompt à un CLI d'IA local sur stdin et lit son stdout, la commande
doit donc s'exécuter de manière non interactive. Pour Claude Code :

Choisissez votre CLI dans la liste déroulante et ses indicateurs non interactifs sont appliqués pour vous. Ne définissez
un chemin que si l'exécutable n'est pas dans votre `PATH`.

| CLI | Statut |
| --- | --- |
| Claude Code | Vérifié ; prompt envoyé sur stdin |
| Antigravity (`agy`) | Vérifié ; prompt passé en tant qu'argument |
| Codex (ChatGPT) | Proposé mais non testé — veuillez signaler ce que vous trouvez |

Si une commande ne renvoie aucune sortie, le CLI voulait probablement une session interactive ; vérifiez les
indicateurs sous Arguments supplémentaires.

### Compilation depuis les sources

```bash
npm install
npm run build
```

## Commandes

Toutes ces commandes se trouvent dans la palette de commandes, et dans le menu derrière l'icône du ruban.

| Commande | Ce qu'elle fait |
| --- | --- |
| Nouvelle note de journal | Crée la note d'aujourd'hui à partir du modèle et l'ouvre |
| Générer un retour sur le journal | Répond à l'entrée du jour, avec le ton que chaque partie requiert |
| Générer la synthèse | Liste vos partages et les rédige un par un |
| Accumuler les faits | Met à jour le tableau des faits à partir de l'entrée du jour |
| Ouvrir le tableau des faits | Ouvre `facts.md` pour lecture ou correction |
| Archiver les partages traités | Nettoie tous les partages traités restants |

Les commandes qui écrivent dans une note de journal sont désactivées lorsqu'une note différente est ouverte, elles
n'agissent donc jamais sur un fichier que vous n'aviez pas l'intention de modifier.

## Paramètres

- **IA** — choisissez votre CLI (Claude Code, Antigravity, Codex) et les indicateurs dont il a besoin sont remplis ;
  ou choisissez Personnalisé. Plus le chemin, les arguments supplémentaires, le modèle, le délai d'attente.
- **Voix** — le tableau situation → voix et l'instruction de chaque voix. Chaque entrée intégrée
  se réinitialise individuellement ; ajoutez vos propres situations et voix.
- **Journal** — dossier, format de date, chemin du modèle (prend en charge `{{date}}` et `{{time}}`).
  Un modèle personnalisé doit conserver les quatre en-têtes ; c'est ainsi que l'IA trouve où écrire.
- **Actualités** — dossiers landing et archived, bascule de recherche, durée de conservation des archives en jours
  (0 conserve tout).
- **Planification** — manuel (par défaut), à l'ouverture, ou toutes les N heures, avec des bascules distinctes pour
  déterminer si une exécution planifiée lance la synthèse, le retour, ou les deux.
- **Faits** — dossier, et une bascule d'activation (désactivée par défaut).
- **Apparence** — un style optionnel pour les propres sections du plugin (cartes, discret, magazine),
  désactivé par défaut et limité aux notes de journal. Les styles s'appliquent en mode Lecture ; chaque valeur
  provient des variables CSS d'Obsidian, donc votre thème a toujours le dernier mot.

### Planification

Les exécutions planifiées ne se produisent que lorsque Obsidian est ouvert — un plugin adossé à un CLI n'a pas de processus
en arrière-plan, et une fenêtre manquée est rattrapée au prochain cycle plutôt que d'être compensée.

La synthèse convient à une planification, car chaque exécution traite les nouveaux partages arrivés. Le
retour sur le journal est désactivé par défaut dans les exécutions planifiées : chaque passage ajoute un nouveau bloc, donc l'exécuter
six fois par jour remplit la section avec des conseils presque identiques.

## Confidentialité et sécurité

Lisez ceci avant d'activer quoi que ce soit.

- **Votre journal est envoyé à un fournisseur d'IA.** Le plugin lance un CLI d'IA local et lui transmet
  le texte de votre journal. Ce que ce CLI envoie par la suite — et à qui — est régi par cet outil,
  et non par ce plugin. Les journaux contiennent des détails de santé et des questions familiales ; décidez en connaissance de cause.
- **L'IA écrit directement dans votre vault.** Il n'y a pas d'étape de confirmation. Elle écrit seulement dans
  les sections listées ci-dessus, mais elle le fait sans demander.
- **La provenance est conservée.** `memory/_log.md` est en ajout seul et enregistre de quelle journée de journal provient
  chaque mise à jour de fait, afin que vous puissiez séparer ce que vous avez écrit de ce que l'IA a déduit.
- **Le tableau des faits vous appartient et vous pouvez le modifier.** Si l'IA enregistre quelque chose de faux, ouvrez-le et corrigez-le ;
  la prochaine exécution lira votre version corrigée. Notez que l'IA réécrit l'intégralité du fichier à chaque
  fois, donc une ligne sans fondement dans votre journal pourrait ne pas survivre.
- **La planification est par défaut sur manuel.** Les exécutions sans surveillance qui écrivent dans votre vault devraient être une
  décision, pas un comportement par défaut.
- **La suppression des archives est optionnelle** et utilise la corbeille du système, elle est donc récupérable.
- **Ordinateur uniquement.** Le lancement d'un CLI nécessite Node, cela ne peut donc pas fonctionner sur mobile. Partager *vers*
  le vault depuis un téléphone fonctionne parfaitement — c'est simplement Obsidian Sync.

## Internationalisation

L'interface est disponible en 21 langues, suivant les paramètres de langue d'Obsidian : Arabe,
Allemand, Anglais, Espagnol, Persan, Français, Indonésien, Italien, Japonais, Coréen, Néerlandais,
Polonais, Portugais, Portugais (Brésil), Russe, Thaï, Turc, Ukrainien, Vietnamien,
Chinois (Simplifié), et Chinois (Traditionnel).

Les traductions se trouvent dans `src/i18n/locales/`. Chaque région est typée par rapport à l'Anglais, donc une clé manquante
est une erreur de compilation plutôt qu'un repli silencieux.

## Licence

MIT
