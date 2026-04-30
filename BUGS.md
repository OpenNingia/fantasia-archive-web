# BUGS

Bugs che ho trovato

## App

- [x] Bottoni minimizza, massimizza, chiudi sono un retaggio di electron -- rimuovere
- [x] Program settings -> Keybinds -> pagina vuota (q-table usava le prop di Quasar v1; switch a `:rows` + `v-model:pagination`. Patch transitoria, vedi punto sotto)
- [ ] Program settings -> Keybinds -> rimuovere l'intera funzionalità: in browser molti shortcut sono protetti (Ctrl+W chiude la tab del browser, Ctrl+N nuova finestra, Ctrl+Shift+N incognito, F11 fullscreen del browser, Ctrl+Shift+W chiude la finestra) e altri (Ctrl+F, Ctrl+S, Ctrl+D, Ctrl+E, Ctrl+Shift+T) richiederebbero `preventDefault()` oggi assente. ~11 di 36 keybind di default sono rotti o pericolosi. Vedi piano Phase 11 per scope di rimozione.

- [] Errore console in produzione
ReferenceError: can't access lexical declaration 'X' before initialization
    Y https://fa.dasi.casa/assets/ProjectScreen-DKkyVd2g.js:1
    setup https://fa.dasi.casa/assets/ProjectScreen-DKkyVd2g.js:1
    dn https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    qa https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    Ka https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    O https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    ae https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    v https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    s https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    run https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    oe https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    ae https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    v https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    s https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    run https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    oe https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    ae https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    v https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    s https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    run https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    runIfDirty https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    dn https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1
    Dn https://fa.dasi.casa/assets/runtime-core.esm-bundler-DP7QA9Y_.js:1

- [] Errore console dopo aver cliccato "Save project"    
Uncaught TypeError: can't access property "config", parentApp is undefined
    createChildApp quasar.client.js:1080
    timeout quasar.client.js:24673
    setTimeout handler*show quasar.client.js:24670
    saveProject projectManagent.ts:51
    commenceSave AppControl.vue:716
    callWithErrorHandling runtime-core.esm-bundler.js:199
    callWithAsyncErrorHandling runtime-core.esm-bundler.js:206
    emit runtime-core.esm-bundler.js:4448
    navigateOnClick quasar.client.js:1871
    onClick quasar.client.js:10853
    callWithErrorHandling runtime-core.esm-bundler.js:199
    callWithAsyncErrorHandling runtime-core.esm-bundler.js:206
    invoker runtime-dom.esm-bundler.js:745
    addEventListener runtime-dom.esm-bundler.js:696
    patchEvent runtime-dom.esm-bundler.js:714
    patchProp runtime-dom.esm-bundler.js:791
    mountElement runtime-core.esm-bundler.js:5668
    processElement runtime-core.esm-bundler.js:5605
    patch runtime-core.esm-bundler.js:5471
    componentUpdateFn runtime-core.esm-bundler.js:6132
    run reactivity.esm-bundler.js:250
    setupRenderEffect runtime-core.esm-bundler.js:6260
    mountComponent runtime-core.esm-bundler.js:6032
    processComponent runtime-core.esm-bundler.js:5984
    patch runtime-core.esm-bundler.js:5483
    mountChildren runtime-core.esm-bundler.js:5734
    mountElement runtime-core.esm-bundler.js:5650
    processElement runtime-core.esm-bundler.js:5605
    patch runtime-core.esm-bundler.js:5471
    componentUpdateFn runtime-core.esm-bundler.js:6132
    run reactivity.esm-bundler.js:250
    setupRenderEffect runtime-core.esm-bundler.js:6260
    mountComponent runtime-core.esm-bundler.js:6032
    processComponent runtime-core.esm-bundler.js:5984
    patch runtime-core.esm-bundler.js:5483
    mountChildren runtime-core.esm-bundler.js:5734
    mountElement runtime-core.esm-bundler.js:5650
    processElement runtime-core.esm-bundler.js:5605
    patch runtime-core.esm-bundler.js:5471
    componentUpdateFn runtime-core.esm-bundler.js:6132
    run reactivity.esm-bundler.js:250
    setupRenderEffect runtime-core.esm-bundler.js:6260
    mountComponent runtime-core.esm-bundler.js:6032

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

