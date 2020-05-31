<template>
    <div>
        <div style="display:flex; flex-direction: row;">
            <input id="btnRefresh" type="button" value="Refresh" onclick="draw()">
            <input id="findNode" type="text" dir="ltr">
            <input id="btnFind" type="button" value="איתור" onclick="findNode()">
            <span> </span>
            <label>לחיצה בגרף :</label>
            <input type="radio" id="card" name="graphClick" value="card">
            <label for="card">כרטיס</label><br>
            <input type="radio" id="map" name="graphClick" value="map">
            <label for="map">מפה</label><br>
        </div>
        <div style="display: flex; flex-direction: row;">
            <div id="mynetwork" ref="mynetwork"></div>
            <textarea id="frozenPos" cols=30 rows=50 dir="ltr"></textarea>
        </div>
    </div>
</template>
<script>
import graphOptions from '../assets/graphOptions.json';

let nodesDS = null;
let edgesDS = null;
let network = null;
let allNodes = null;
let customNodes = null;
let currQuery = {
    references: {
        qv: 'ref_id',
        qe: '[A-Z]+_[A-Z]+_\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    documents: {
        qv: 'doc_id',
        qe: 'D\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    ext_documents: {
        qv: 'edoc_id',
        qe: 'ED\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    persons: {
        qv: 'prsn_id',
        qe: 'P\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    locations: {
        qv: 'loc_id',
        qe: 'L\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    }
};

let apiURL = window.location.origin + window.location.pathname;
if (!apiURL.endsWith('/')) apiURL += '/';
apiURL += 'api/';

export default {
    name: 'home',
    data: () => ({
        error: '',
    }),
    mounted() {
        this.draw();
    },
    methods: {
        queryMongoCollection: function (collection, query) {
            var that = this;

            return new Promise((resolve, reject) => {
                if (!collection || !query) {
                    resolve([]);
                }
                $.ajax({
                    type: "GET",
                    url: apiURL + 'db/' + collection + "?q=" + encodeURIComponent(JSON.stringify(query)),
                    crossdomain: true,
                    success: function (result) {
                        resolve(result);
                    },
                    error: function (xhr, status, err) {
                        reject(err);
                    }
                });
            });
        },
        destroy: function () {
            if (network) {
                network.destroy();
                network = null;
            }
        },
        draw: function () {
            this.destroy();

            let that = this;

            let promise = new Promise((resolve, reject) => {
                let qts = [];
                for (var k in currQuery) {
                    qts.push(that.queryMongoCollection(k, currQuery[k]));
                }

                let opdsOpts = {};
                nodesDS = new vis.DataSet(opdsOpts);
                edgesDS = new vis.DataSet(opdsOpts);

                Promise.allSettled(qts).then((results) => {
                    results.forEach(res => {
                        let idFieldName = '';
                        let group = '';
                        let fI = (res && res.value && res.value.length >
                            0) ? res.value[0] : null;
                        if (fI) {
                            if (fI.hasOwnProperty('ref_id')) {
                                res.value.forEach(item => {
                                    item.id = item.ref_id;
                                    edgesDS.add([item]);
                                });
                            } else if (fI.hasOwnProperty('doc_id')) {
                                idFieldName = 'doc_id';
                                group = 'doc_id';
                            } else if (fI.hasOwnProperty('edoc_id')) {
                                idFieldName = 'edoc_id';
                                group = 'edoc_id';
                            } else if (fI.hasOwnProperty('loc_id')) {
                                idFieldName = 'loc_id';
                                group = 'loc_id';
                            } else if (fI.hasOwnProperty('prsn_id')) {
                                idFieldName = 'prsn_id';
                                group = 'prsn_id';
                            }
                        }
                        if (idFieldName !== '') {
                            res.value.forEach(item => {
                                item.id = item[idFieldName];
                                item.group = idFieldName;
                                nodesDS.add([item]);
                            });
                        }
                    });

                    that.dataReceived();
                });
            });
        },

        dataReceived: function () {
            network = new vis.Network(this.$refs.mynetwork, {
                nodes: nodesDS,
                edges: edgesDS,
            }, graphOptions);

            allNodes = nodesDS.get({
                returnType: "Object",
            });

            let that = this;

            network.on('click', function (params) {
                let sel = null;
                if (params.nodes.length > 0) {
                    sel = nodesDS.get(params.nodes[0]);
                } else if (params.edges.length > 0) {
                    sel = edgesDS.get(params.edges[0]);
                }
                if (document.getElementById("card").checked) {
                    if (sel.hasOwnProperty("doc_id")) {
                        that.$router.push({ name: 'bcDocument', params: { docId: sel.doc_id } });
                    } else {
                        alert('אין מידע');
                    }
                } else if (document.getElementById('map').checked) {
                    if (sel && sel.coordinates) {
                        window.open('https://maps.google.com/?hl=iw&q=' + sel
                            .coordinates);
                    } else {
                        alert('אין מידע על מיקום');
                    }
                }
            });
        },
    },
};
</script>
<style scoped>
    body {
        font: 10pt sans;
    }

    #mynetwork {
        width: 1600px;
        height: 750px;
        border: 1px solid lightgray;
    }

    #message {
        color: darkred;
        max-width: 600px;
        font-size: 16px;
        cursor: pointer;
        text-decoration: underline;
    }
</style>
