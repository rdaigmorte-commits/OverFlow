# OverFlow — Next.js MVP

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

- `/` Landing page
- `/onboarding` Profile qualification flow
- `/matches` Sample compatible players
- `/admin` Internal overview

## Notes

This MVP is intentionally simple: local state, no database, no auth, no social feed.

## Vérification pas à pas

1. Ouvre un terminal dans le dossier `overflow-next-app`.
2. Lance `npm install`.
3. Lance `npm run dev`.
4. Ouvre `http://localhost:3000`.
5. Vérifie que la landing s’affiche.
6. Clique sur `Start matching`.
7. Complète l’onboarding avec quelques valeurs de test.
8. Clique sur `See matches`.
9. Vérifie que la page de matches s’ouvre.
10. Ouvre `http://localhost:3000/admin` pour voir la vue interne.

## Points à contrôler

- Le texte du hero doit être lisible.
- L’onboarding doit permettre de sélectionner des jeux et des disponibilités.
- La page matches doit afficher plusieurs cartes.
- Aucun écran ne doit afficher d’erreur de compilation.
- Le design doit rester sombre, propre et cohérent.

## Commandes terminal

```bash
cd overflow-next-app
npm install
npm run dev
```

Si le dossier est téléchargé ailleurs, remplace `overflow-next-app` par le chemin exact du dossier.

## Accéder depuis Downloads

Si le projet est dans votre dossier Téléchargements, utilisez par exemple :

```bash
cd ~/Downloads/overflow-download
```

Puis :

```bash
npm install
npm run dev
```

Si le nom du dossier est différent, adaptez `overflow-download` au nom exact du dossier dézippé.

## Audit

If `npm audit` reports vulnerabilities in `next`, update Next.js to a patched version instead of forcing blind fixes. For this starter project, prefer a manual version bump and reinstall, then run `npm audit` again.

## Changer la version de Next

1. Ouvre `package.json`.
2. Trouve la ligne `"next": "14.2.5"`.
3. Remplace-la par `"next": "14.2.35"`.
4. Sauvegarde le fichier.
5. Dans le terminal, supprime `node_modules` et `package-lock.json` si nécessaire.
6. Relance `npm install`.
7. Relance `npm audit` pour vérifier que les vulnérabilités ont disparu.
8. Relance `npm run dev`.

Commandes utiles :

```bash
rm -rf node_modules package-lock.json
npm install
npm audit
npm run dev
```

## Supprimer node_modules et le lockfile

Dans le terminal, à l'intérieur du dossier du projet, lance :

```bash
rm -rf node_modules package-lock.json
```

Si tu es sur Windows PowerShell, utilise plutôt :

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

Ensuite relance :

```bash
npm install
```

## Windows PowerShell

Si `rm -rf` ne fonctionne pas, c'est normal sur PowerShell. Utilise :

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

Puis relance :

```powershell
npm install
npm audit
npm run dev
```

## Après l'audit

1. Vérifie que l'application démarre avec `npm run dev`.
2. Ouvre `http://localhost:3000`.
3. Navigue vers `/onboarding`, puis `/matches`, puis `/admin`.
4. Si tout fonctionne, ne touche plus au framework pour le moment.
5. Commence à tester le produit avec quelques profils de démonstration.
6. Note les erreurs ou blocages dans un petit fichier de suivi.

L'objectif maintenant est de tester le parcours, pas de refaire la stack à chaque audit.
