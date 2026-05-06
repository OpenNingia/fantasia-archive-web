# BUGS

Bugs che ho trovato

## App

- [x] Bottoni minimizza, massimizza, chiudi sono un retaggio di electron -- rimuovere
- [x] Program settings -> Keybinds -> pagina vuota (q-table usava le prop di Quasar v1; switch a `:rows` + `v-model:pagination`. Patch transitoria, vedi punto sotto)
- [x] Program settings -> Keybinds -> rimuovere l'intera funzionalità (Phase 11, 2026-05-05): rimossi store `keybinds`, `defaultKeybinds`, `KeybindCheatsheet`, l'intera tab Keybinds in ProgramSettings, tutti i watcher su `keybindsStore.getCurrentKeyBindData` (App, AppControl, DocumentControl, TopTabs, ObjectTree, NewDocument, ExistingDocument, Field_Wysiwyg), `userKeybindList` da OptionsState, e la voce di menu "Show keybind cheatsheet" in Help & Info. Il "full-page search popup" (`appSearchBox`) era triggerabile solo da keybind: il binding non c'è più, il componente è ancora montato ma non si attiva — eventuale rimozione/UI alternativa è scope futuro.

- [x] Errore console dopo aver cliccato "Save current document" — `documentManager.ts:214` castava il valore di `parentDoc` (campo `singleToNoneRelationship`, value = `{ value: { _id, type, ... } }`) a `string`: il cast TS non fa nulla a runtime, quindi al backend arrivava l'intero oggetto come `parentDocId` e Prisma rifiutava con `Unknown argument 'value'` → 500. Frontend incassava col `.catch`, ma `savedDocument` diventava `undefined` e il successivo accesso a `.documentCopy` faceva il TypeError visibile in console; il `Loading.show` ritardato (setTimeout 750ms) restava orfano e crashava Quasar (`parentApp is undefined`) come effetto collaterale. Fix: estrarre `_id` dalla struttura `value.value._id` come già si fa altrove nello stesso file (line 19) e in `ObjectTree.vue:792`.

- [x] Cliccare la (x) accanto a una relazione in un campo MultiRelationship (es. Thomas Rowan nella scheda di Linda Rowan) crashava con `TypeError: can't access property "label", $setup.localInput[index] is undefined` (`Field_MultiRelationship.vue:526`). Il template della tabella in edit mode itera `inputNotes` ma accede a `localInput[index]`; `removeInput` chiamava solo `scope.removeAtIndex(scope.index)` che muta `localInput` via v-model di q-select senza toccare `inputNotes`, quindi al re-render gli array avevano lunghezze diverse. `moveItem` invece manteneva l'allineamento mutando entrambi gli array in lockstep. Fix: dopo `removeAtIndex` filtrare `inputNotes` per i `pairedId` ancora presenti in `localInput` e chiamare `signalInput(false)` per propagare la rimozione al parent.

- [x] Selezionare un'opzione dal dropdown di un campo MultiRelationship o SingleRelationship non si propagava al documento al Save: `Field_MultiRelationship.vue:212` e `Field_SingleRelationship.vue:205` avevano `@input="selectValue"` (sintassi Vue 2 / Quasar 1), ma `q-select` in Quasar 2 emette `update:modelValue` (verificato in `node_modules/quasar/src/components/select/QSelect.js:526`). Quindi il `v-model` aggiornava `localInput` reattivamente ma `selectValue` non scattava mai → `processInput()` → `signalInput` non venivano chiamati → `DocumentDisplay.reactToFieldUpdate` non riceveva nulla → `currentData.extraFields[i].value` restava invariato → Save inviava il payload vecchio (con relazione vuota) e il backend persisteva il vuoto. La rimozione (chip × → `removeInput`) e l'auto-generazione (`addNewRelationshipObject`) chiamavano `processInput()` direttamente, quindi sembravano funzionare; solo l'aggiunta esistente era rotta. Fix: sostituito `@input="selectValue"` con `@update:model-value="selectValue"` in entrambi i field. Pattern Vue-2 simile presente anche su altri Field_* (SingleSelect, MultiSelect, Tags, ColorPicker, Switch, Wysiwyg, List, DocumentTemplate) — molti di quei componenti usano `q-input`/`q-toggle`/`q-checkbox` che hanno comportamenti diversi sul retro-compat di `@input`; verificare caso per caso quando emergono regressioni equivalenti.

- [x] Le back-reference delle relazioni non venivano scritte sul documento paired (es. aggiungere Thomas come rivale di Linda salvava il forward su Linda ma non aggiungeva Linda alla lista rivali di Thomas). Cause concorrenti in `backend/src/services/documentService.ts`:
  1. `getRelationshipTargets` leggeva i target da `field.value.addedValues`, ma il frontend (`Field_MultiRelationship.vue` / `Field_SingleRelationship.vue`) li mette in `field.value.value` — `addedValues` contiene solo le note testuali. I target dei campi multi non venivano mai estratti, quindi nessun back-ref creato. Per single, lo spread `[...many]` su `addedValues` (oggetto singolo `{pairedId, value}`, non array) crashava la transazione → fallivano sia create sia back-ref.
  2. `addBackReference` scriveva il back-ref in `value.addedValues` del paired field, ma il frontend legge i target da `value.value`: anche quando il back-ref single→single veniva scritto, l'UI non lo mostrava.
  3. `isRelationshipField` si basava su `extraField.type`, ma `buildDefaultExtraFields` (e i payload reali) emettono solo `{id, value}` — quindi nessun campo veniva riconosciuto come relazione e la sync non partiva mai.
  Fix: `getRelationshipTargets` legge da `value.value` (singolo o array). Detezione del field type via blueprint del tipo sorgente (con fallback su `field.type` se presente, per back-compat con import PouchDB). `addBackReference`/`removeBackReference` scrivono in `value.value` nella shape giusta (oggetto per `singleTo*`, array deduplicato per `manyTo*`), determinata via blueprint del tipo paired; il back-ref entry porta `{_id: source, type: sourceType, pairedField: sourceFieldId}` così il ciclo di rimozione dal lato paired propaga correttamente. Test: aggiunti 3 test in `documentService.test.ts` ("frontend payload shape") che usano la shape esatta emessa dal frontend (senza `type` sul field) e seedano le blueprint built-in nel `beforeAll`.

## Menu
- [x] Menù Help & Info -> Toggle developer tools -- refuso di app electron
- [x] Menù Help & Info -> License -- apre una finestra vuota, dovrebbe far vedere la licenza
- [x] Menù Help & Info -> Changelog -- apre una finestra vuota, dato che non voglio mantenere un changelog per adesso lo rimuoverei
- [x] Menù Help & Info -> Program tutorials -- apre una finestra dove molte voci sono vuote. dovrebbero contenere le guide (voce di menu nascosta finché le guide non vengono scritte)
- [x] Menù Help & Info -> Advanced search guide  -- apre una finestra vuota, indagare cosa dovrebbe mostrare
- [x] Menù Help & Info -> Show binding cheatsheet -- apre una finestra vuota, dovrebbe mostrare la cheatsheet delle combinazioni di tasti

- [x] Menù Project -> Project settings -> Backup project -- non fa niente (early return su getter inesistente)
- [x] Menù Project -> Project settings -> Restore project -- non fa niente (stesso bug del Backup)
- [x] Menù Project -> Close project -- non fa niente (puliti currentProjectId/name/css del project store + toast feedback; da verificare in browser)
- [x] Menù Project -> Save current project -- produce un file export.html quasi vuoto


## Build

- [x] Sembra che non trovi 'professions' e 'conditions' (Dockerfile non copiava extraFieldLists; extractBlueprints ingoiava silenziosamente l'errore)

