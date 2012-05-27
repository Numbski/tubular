var tube = document.getElementById("tube");
var referenceTube;
var t;

function initialize() {
    tube.onkeyup = function(event) {
        if (t) {
            window.clearTimeout(t);
        }
        t = setTimeout(searchEvent, 200);
    };

    var form = document.getElementsByTagName("form")[0];
    form.onsubmit = searchEvent;

    var reference = document.getElementById("clearReference");
    reference.onclick = function(event) {
        clearReferenced();
        searchEvent(event);
    };

    var search = document.getElementById("searchBody")
    search.onclick = function(event) {
        var node = event.target;
        while (node.tube == undefined | node.tagName == "body") {
            node = node.parentNode;
        }
        if (! node.tube) {
            return;
        }
        setReferenceTube(node.tube);
        clearSearch();
    };

    window.onpopstate = function(event) {
        restoreState(event.state);
    };

    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            initializeState();
            clearInterval(readyStateCheckInterval);
        }
    }, 10);
};



// State

function initializeState() {
    var state = window.location.hash.substring(1);
    if (state) {
        restoreState(state);
    } else {
        tube.focus();
    }
};

function restoreState(state) {
    var state = parseState(state);
    if (state.search) {
        tube.value = state.search;
    }
    if (state.compat) {
        setReferenceTube(getTube(state.compat));
    } else {
        clearReferenced();
    }

    searchFor(state.search);
    setTitle(state);
};

function getState() {
    var stateObj = new Object;
    if (tube.value) {
        stateObj.search = tube.value;
    }
    if (referenceTube) {
        stateObj.compat = referenceTube[0];
    }
    return stateObj;
};

function getStateHash() {
    return hashForState(getState());
};

function hashForState(state) {
    var stateCpts = new Array;
    if (state.search) {
        stateCpts.push("s/" + state.search);
    }
    if (state.compat) {
        stateCpts.push("c/" + state.compat);
    }
    return stateCpts.join(",");
};

function parseState(state) {
    var stateObj = new Object;
    if (!state) {
        return stateObj;
    }
    var cpts = state.split(",");
    for (i in cpts) {
        switch (cpts[i].substring(0, 2)) {
        case "s/":
            stateObj.search = cpts[i].substring(2);
            break;
        case "c/":
            stateObj.compat = cpts[i].substring(2);
            break;
        }
    };
    return stateObj;
};

function updateState() {
    history.pushState(
        getState(), document.title, "#" + getStateHash());
};


function buildTitle(state)
{
    var title = "Monitor Helper -";
    if (state.search) {
        title += " Search for " + state.search;
    }
    if (state.compat) {
        title += " Compatible with " + state.compat;
    }
    return title;
};

function setTitle(state) {
    document.title = buildTitle(state);
};


// Compatibility

function setReferenceTube(tube) {
    referenceTube = tube;

    var compat = document.getElementById("compat");
    flush(compat);
    compat.appendChild(document.createTextNode(tube[0]));
    document.getElementById("reference").style.display = "block";
    return tube;
};

function clearReferenced() {
    document.getElementById("reference").style.display = "none";
    referenceTube = undefined;
    updateState();
    tube.focus();
};

function isCompatible(tubeA, tubeB) {
    return tubeA[1] == tubeB[1] &&
        tubeA[2] == tubeB[2] &&
        tubeA[3] == tubeB[3];
};

function inchesToMm(inches) {
    return inches * 2.540;
}

function sizeInMm(tube) {
    if (tube[0][0] == "A") {
        return tube[0].substring(1, 2);
    }
    return inchesToMm(tube[0].substring(0, 2));
};



function makeRow(tube) {
    var row = document.createElement("tr");
    if (tube[3] == "c") {
        var typeLabel = "color";
    } else {
        var typeLabel = "mono";
    }

    var modelCell = document.createElement("td");
    modelCell.appendChild(document.createTextNode(tube[0]));
    var heaterCell = document.createElement("td");
    heaterCell.appendChild(document.createTextNode(tube[1] + "v"));
    var crcaCell = document.createElement("td");
    crcaCell.appendChild(document.createTextNode("CR-" + tube[2]));
    var typeCell = document.createElement("td");
    if (tube[3] == 1) {
        var typeLabel = "color";
    } else {
        var typeLabel = "mono";
    }
    typeCell.appendChild(document.createTextNode(typeLabel));

    row.appendChild(modelCell);
    row.appendChild(heaterCell);
    row.appendChild(crcaCell);
    row.appendChild(typeCell);
    row.tube = tube;
    return row;
};

function getTube(tube) {
    for (i in tubes) {
        if (tubes[i][0] == tube) {
            return tubes[i];
        }
    }
};

function flush(node) {
    while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
    }
};

function searchEvent(event) {
    if (event) {
        event.stopPropagation();
    }
    var state = getState();
    if (event && event.type == "submit" ||
        (state.search && state.search.length > 1)) {
        setTitle(state);
        searchFor(state.search);
        updateState();
    }
    return false;
};

function searchFor(tube) {
    var exp = new RegExp(tube, "i");
    var predicate = function(mTube) {
        return mTube[0].search(exp) !== -1;
    };
    var tbody = document.getElementById("searchBody");
    flush(tbody);
    if (! tube) {
        clearSearch();
        return;
    }
    document.getElementById("search").style.display = "table";
    var x = 0;
    for (i in tubes) {
        if (referenceTube && !isCompatible(referenceTube, tubes[i])) {
            continue;
        }
        if (predicate(tubes[i])) {
            tbody.appendChild(makeRow(tubes[i]));
            x++;
        }
    }
};

function clearSearch() {
    tube.value = "";
    flush(document.getElementById("searchBody"));
    document.getElementById("search").style.display = "none";
    updateState();
    tube.focus();
};

initialize();
