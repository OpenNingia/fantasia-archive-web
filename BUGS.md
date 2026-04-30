# BUGS

Bugs che ho trovato

## App

- [x] Bottoni minimizza, massimizza, chiudi sono un retaggio di electron -- rimuovere

## Menu
- [x] Menù Help & Info -> Toggle developer tools -- refuso di app electron
- [x] Menù Help & Info -> License -- apre una finestra vuota, dovrebbe far vedere la licenza
- [x] Menù Help & Info -> Changelog -- apre una finestra vuota, dato che non voglio mantenere un changelog per adesso lo rimuoverei
- [x] Menù Help & Info -> Program tutorials -- apre una finestra dove molte voci sono vuote. dovrebbero contenere le guide (voce di menu nascosta finché le guide non vengono scritte)
- [x] Menù Help & Info -> Advanced search guide  -- apre una finestra vuota, indagare cosa dovrebbe mostrare
- [x] Menù Help & Info -> Show binding cheatsheet -- apre una finestra vuota, dovrebbe mostrare la cheatsheet delle combinazioni di tasti

- [] Menù Project -> Project settings -> Backup project -- non fa niente
- [] Menù Project -> Project settings -> Restore project -- non fa niente
- [] Menù Project -> Close project -- non fa niente
- [] Menù Project -> Save current project -- produce un file export.html quasi vuoto


## Build

- [x] Sembra che non trovi 'professions' e 'conditions' (Dockerfile non copiava extraFieldLists; extractBlueprints ingoiava silenziosamente l'errore)

#27 [backend builder 12/12] RUN npm run build
#27 0.734   ✗ professions: Cannot find module '../extraFieldLists/RPGSystemsStats'
#27 0.734 Require stack:
#27 0.734 - /src/scripts/databaseManager/blueprints/professions.ts
#27 0.743   ✓ resources
#27 0.753   ✗ conditions: Cannot find module './../extraFieldLists/RPGSystemsStats'
#27 0.753 Require stack:
#27 0.753 - /src/scripts/databaseManager/blueprints/conditions.ts
#27 0.760   ✓ myths
#27 0.769   ✓ loreNotes
#27 0.775   ✓ chapters
#27 0.785   ✓ scienceTechnology
#27 0.794   ✓ politicalGroups
#27 0.802   ✓ culture
