var nodesDS = null;
var edgesDS = null;
var network = null;
var allNodes = null;
var customNodes = null;

var apiURL = window.location.href;
if (!apiURL.endsWith('/')) apiURL += '/';
apiURL += 'api/';

var currQuery = {
    references: { qv: 'ref_id', qe: '[A-Z]+_[A-Z]+_\\d+', prj: { 'text': 0, 'images': 0 } },
    documents: { qv: 'doc_id', qe: 'D\\d+', prj: { 'text': 0, 'images': 0 } },
    ext_documents: { qv: 'edoc_id', qe:'ED\\d+', prj: { 'text': 0, 'images': 0 } },
    persons: { qv: 'prsn_id', qe: 'P\\d+', prj: { 'text': 0, 'images': 0 } },
    locations: { qv: 'loc_id', qe: 'L\\d+', prj: { 'text': 0, 'images': 0 } }
}

function queryMongoCollection(collection, query) {
    var that = this;

    return new Promise( (resolve, reject) => {
        if (!collection || !query) {
            resolve([]);
        }
        $.ajax({
            type: "GET",
            url: that.apiURL + 'db/' + collection + "?q=" + encodeURIComponent(JSON.stringify(query)),
            crossdomain: true,
            success: function(result) {
                resolve(result);
            },
            error: function(xhr, status, err) {
                reject(err);
            }
        });
    });
}

function destroy() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function init() {
    this.draw();
}

function draw() {
    destroy();

    var that = this;

    var promise = new Promise( (resolve, reject) => {
        var qts = [];
        for (var k in currQuery) {
            qts.push(queryMongoCollection(k, currQuery[k]));
        }

        var opdsOpts = {};
        that.nodesDS = new vis.DataSet(opdsOpts);
        that.edgesDS = new vis.DataSet(opdsOpts);

        Promise.allSettled(qts).then((results) => {
            results.forEach(res => {
                var idFieldName = '';
                var group = '';
                var fI = (res && res.value && res.value.length > 0) ? res.value[0] : null;
                if (fI) {
                    if (fI.hasOwnProperty('ref_id')) {
                        res.value.forEach(item => {
                            item.id = item.ref_id;
                            that.edgesDS.add([item]);
                        });
                    } else if (fI.hasOwnProperty('doc_id')) { idFieldName = 'doc_id'; group='doc_id'; }
                    else if (fI.hasOwnProperty('edoc_id')) { idFieldName = 'edoc_id'; group='edoc_id'; }
                    else if (fI.hasOwnProperty('loc_id')) { idFieldName = 'loc_id'; group='loc_id'; }
                    else if (fI.hasOwnProperty('prsn_id')) { idFieldName = 'prsn_id'; group='prsn_id'; }
                }
                if (idFieldName !== '') {
                    res.value.forEach(item => {
                        item.id = item[idFieldName];
                        item.group = idFieldName;
                        that.nodesDS.add([item]);
                    });
                }
            });

            that.dataReceived();
        });
    });
}

function dataReceived() {
    var options = {
        nodes: {
            shape: 'dot',
            size: 20,
            font: {
                size: 15,
                color: '#000000'
            },
            borderWidth: 2
        },
        edges: {
            width: 1.0
        },
        groups: {
            doc_id: {
                shape: 'icon',
                icon: {
                    face: "'Font Awesome 5 Free'",
                    weight: "bold", // Font Awesome 5 doesn't work properly unless bold.
                    code: '\uf1c6',
                    size: 20,
                    color: '#ff0000'
                }
            },
            edoc_id: {
                shape: 'icon',
                icon: {
                    face: "'Font Awesome 5 Free'",
                    weight: "bold", // Font Awesome 5 doesn't work properly unless bold.
                    code: '\uf70e',
                    size: 20,
                    color: '#00ff00'
                }
            },
            loc_id: {
                shape: 'icon',
                icon: {
                    face: "'Font Awesome 5 Free'",
                    weight: "bold", // Font Awesome 5 doesn't work properly unless bold.
                    code: '\uf57d',
                    size: 15,
                    color: '#ff00aa'
                }
            },
            prsn_id: {
                shape: 'icon',
                icon: {
                    face: "'Font Awesome 5 Free'",
                    weight: "bold", // Font Awesome 5 doesn't work properly unless bold.
                    code: '\uf007',
                    size: 20,
                    color: '#ff00ff'
                }
            },
            unselected: {
                shape: 'dot',
                size: 15,
                color: '#aaaaaa'
            }
        },
        physics: {
            stabilization: false
        }
    };

    var container = document.getElementById('mynetwork');

    network = new vis.Network(container, {
        nodes: nodesDS,
        edges: edgesDS
    }, options);

    allNodes = nodesDS.get({
        returnType: "Object"
    });

    network.on("click", function (params) {
        var sel = null;
        if (params.nodes.length > 0) {
            sel = nodesDS.get(params.nodes[0]);
        } else if (params.edges.length > 0) {
            sel = edgesDS.get(params.edges[0]);
        }
        if (document.getElementById('url').checked) {
            if (sel && sel.url) {
                window.open(sel.url);
            } else {
                alert('אין מידע');
            }
        } else if (document.getElementById('map').checked) {
            if (sel && sel.coordinates) {
                window.open('https://maps.google.com/?hl=iw&q=' + sel.coordinates);
            } else {
                alert('אין מידע על מיקום');
            }
        }
    });
}