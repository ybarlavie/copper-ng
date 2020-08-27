<template>
    <div dir="rtl">
        <div style="display:flex; flex-direction: row;">
            <input id="btnRefresh" type="button" value="Refresh" onclick="draw()">
            <input id="findNode" type="text" dir="ltr">
            <input id="btnFind" type="button" value="איתור" onclick="findNode()">
            <span> </span>
            <label>לחיצה בגרף :</label>
            <input type="radio" id="card" name="graphClick" value="card" checked>
            <label for="card">כרטיס</label><br>
            <input type="radio" id="map" name="graphClick" value="map">
            <label for="map">מפה</label><br>
        </div>
        <div style="display: flex; flex-direction: row;">
            <div id="mynetwork" ref="mynetwork"></div>
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
        qv: 'item_id',
        qe: 'D\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    ext_documents: {
        qv: 'item_id',
        qe: 'ED\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    persons: {
        qv: 'item_id',
        qe: 'P\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    },
    locations: {
        qv: 'item_id',
        qe: 'L\\d+',
        prj: {
            'text': 0,
            'images': 0
        }
    }
};

export default {
    name: 'home',
    props: ['fromEntity', 'editable'],
    data: () => ({
        error: '',
    }),
    mounted() {
        this.draw();
    },
    methods: {
        queryMongoCollection: function (collection, query) {
            let dbURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'db/';
            var that = this;

            return new Promise((resolve, reject) => {
                if (!collection || !query) {
                    resolve([]);
                }
                $.ajax({
                    type: "GET",
                    url: dbURL + collection + "?q=" + encodeURIComponent(JSON.stringify(query)),
                    crossdomain: true,
                    headers: {
                        "x-access-token": window.tokenData.token
                    },
                    success: function (result) {
                        resolve({ collection: collection, records: result });
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
                        let collection = res.value.collection;
                        let records = res.value.records;
                        let fI = (records.length > 0) ? records[0] : null;
                        if (fI) {
                            if (collection == "references")
                            {
                                records.forEach(item => {
                                    item.id = item.ref_id;
                                    item.title = item.type;
                                    item.group = collection;
                                    switch (item.type) {
                                        case 'referred at document':
                                        case 'visit at':
                                            item.arrows = 'to';
                                            break;
                                        case 'child of':
                                            item.arrows = 'from';
                                            break;
                                        case 'sibling':
                                        case 'spouse':
                                            item.arrows = 'to, from';
                                    }
                                    edgesDS.add([item]);
                                });
                            } else {
                                records.forEach(item => {
                                    item.id = item.item_id;
                                    item.group = collection;
                                    nodesDS.add([item]);
                                });
                            }
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
                    var params = { itemId: sel.item_id, editable: false, collName: sel.group };
                    switch (sel.group)
                    {
                        case "documents":
                            that.$router.push({ name: 'bcDocument', params: params });
                            break;
                        case "ext_documents":
                            that.$router.push({ name: 'extDocument', params: params });
                            break;
                        case "locations":
                            that.$router.push({ name: 'Location', params: params });
                            break;
                        case "persons":
                            that.$router.push({ name: 'Person', params: params });
                            break;
                        default:
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
        width: 100vw;
        height: 80vh;
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
