/**
 * Script for Adobe Reader to save tabs opened during session
 * and restore them with respective viewstate on next launch.
 *
 * Put this into "Javascripts" folder of your Adobe Reader installation.
 *
 * Basic idea: https://stackoverflow.com/q/12689154
 *
 * My improvements:
 * 1. Saves and restores complete viewstate for each document.
 * 2. Auto loads saved tabs only if any exists.
 * 3. Can automatically save current opened tabs and their viewstates every 1 second.
 */

var delim = '|';
var parentMenu = "View";

var trustedActiveDocs = app.trustedFunction(function () {
    app.beginPriv();
    var d = app.activeDocs;
    app.endPriv();
    return d;
})

function SaveTabs() {
    var d = trustedActiveDocs();
    var tabs = '';
    var states = '';

    for (var i = 0; i < d.length; i++) {
        if (i > 0) {
            tabs += delim;
            states += delim;
        }

        tabs += d[i].path;
        states += d[i].viewState.toSource();
    }

    global.tabs_opened = tabs;
    global.tabs_states = states;
    global.setPersistent("tabs_opened", true);
    global.setPersistent("tabs_states", true);
}

function SaveTabsWithAlert() {
    SaveTabs();
    app.alert("Tabs saved", 3);
}

var trustedOpenDoc = app.trustedFunction(function (path) {
    app.beginPriv();
    var d = app.openDoc(path);
    app.endPriv();
    return d;
});

function LoadTabs() {
    if (global.tabs_opened == null) {
        return;
    }

    var flat_tabs = global.tabs_opened.split(delim);
    var flat_viewstates = global.tabs_states.split(delim);

    for (i = 0; i < flat_tabs.length; i++) {
        try {
            var curr = trustedOpenDoc(flat_tabs[i]);
            var restoreViewState = eval(flat_viewstates[i]);
            curr.viewState = restoreViewState;
        } catch (ee) {
            app.alert("Error while opening requested document\n" + flat_tabs[i], 3);
        }
    }
}

function ToggleAutoSave() {
    if (global.save_auto == 0 || global.save_auto == null) {
        global.save_auto = 1;
        global.setPersistent("save_auto", true);
        app.alert("Tabs auto saving enabled", 3);
    } else {
        global.save_auto = 0;
        global.setPersistent("save_auto", true);
        app.alert("Tabs auto saving disabled", 3);
    }
}

function ToggleAutoLoad() {
    if (global.load_auto == 0 || global.load_auto == null) {
        global.load_auto = 1;
        global.setPersistent("load_auto", true);
        app.alert("Tabs auto loading enabled", 3);
    } else {
        global.load_auto = 0;
        global.setPersistent("load_auto", true);
        app.alert("Tabs auto loading disabled", 3);
    }
}

app.addMenuItem({
    cName: "-",
    cParent: parentMenu,
    cExec: "void(0);"
});

app.addMenuItem({
    cName: "Save Tabs View State",
    cParent: parentMenu,
    cExec: "SaveTabsWithAlert();"
});

app.addMenuItem({
    cName: "Load Tabs View State",
    cParent: parentMenu,
    cExec: "LoadTabs();"
});

app.addMenuItem({
    cName: "Toggle Auto Save View State",
    cParent: parentMenu,
    cExec: "ToggleAutoSave();"
});

app.addMenuItem({
    cName: "Toggle Auto Load View State",
    cParent: parentMenu,
    cExec: "ToggleAutoLoad();"
});

if (global.load_auto == 1 && global.tabs_opened.length > 0) {
    LoadTabs();
}

if (global.save_auto == 1) {
    pp = app.setInterval("SaveTabs()", 1000);
    pp.count = 0;
}