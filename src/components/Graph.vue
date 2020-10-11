<template>
    <div dir="rtl">
        <div style="display:flex; flex-direction: row; align-items: center">
            <q-input rounded dense outlined type="text" v-model="nodeQuery" style="font-size: 19px;" />
            <q-btn rounded dense label="חיפוש בגרף לפי שם" @click="findNode" />
            <q-badge />
            <q-separator vertical />
            <q-badge outline label=" לחיצה בגרף " color="purple" style="font-size: 19px;" />
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
        qe: '[A-Z]+\\d*_[A-Z]+\\d*_\\d+',
        prj: {
            'text': 0,
            'images': 0,
            'images': 0,
            'keywords': 0,
            'aliases': 0,
            '_who': 0,
            '_when': 0
        }
    },
    documents: {
        qv: 'item_id',
        qe: 'D\\d+',
        prj: {
            'text': 0,
            'images': 0,
            'keywords': 0,
            'aliases': 0,
            '_who': 0,
            '_when': 0
        }
    },
    ext_documents: {
        qv: 'item_id',
        qe: 'ED\\d+',
        prj: {
            'text': 0,
            'images': 0,
            'keywords': 0,
            'aliases': 0,
            '_who': 0,
            '_when': 0
        }
    },
    persons: {
        qv: 'item_id',
        qe: 'P\\d+',
        prj: {
            'text': 0,
            'images': 0,
            'keywords': 0,
            'aliases': 0,
            '_who': 0,
            '_when': 0
        }
    },
    locations: {
        qv: 'item_id',
        qe: 'L\\d+',
        prj: {
            'text': 0,
            'images': 0,
            'keywords': 0,
            'aliases': 0,
            '_who': 0,
            '_when': 0
        }
    }
};

export default {
    name: 'home',
    props: ['queryData'],
    data: () => ({
        error: '',
        nodeQuery: ''
    }),
    mounted() {
        if (this.queryData)
        {
            this.drawQuery(this.queryData);
        }
        else
        {
            this.drawEntireGraph();
        }
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

        drawQuery: function (qd) {
            this.destroy();

            if (!qd.fromEntity.item_id) return;

            let opdsOpts = {};
            nodesDS = new vis.DataSet(opdsOpts);
            edgesDS = new vis.DataSet(opdsOpts);

            var fromEnt = {
                id: qd.fromEntity.item_id,
                name: qd.fromEntity.name,
                label: qd.fromEntity.name
            };
            switch (qd.fromEntity.item_id.substring(0,1))
            {
                case "E":
                    fromEnt.group = "ext_documents";
                    break;
                case "D":
                    fromEnt.group = "documents";
                    break;
                case "P":
                    fromEnt.group = "persons";
                    break;
                case "L":
                    fromEnt.group = "locations";
                    break;
            }
            nodesDS.add([fromEnt]);

            qd.refs.forEach(item => {
                var ref = {
                    id: item.ref_id,
                    title: item.type,
                    from: item.from,
                    to: item.to,
                    group: "references",
                    arrows: '',
                    dashes: item._valid ? false : true,
                    width: item._valid ? 1.0 : 1.5,
                }
                var types = window.store.ref_types.filter(rt => rt.type === item.type);
                if (types.length > 0) ref.arrows = types[0].arrows;

                edgesDS.add([ref]);

                if (!nodesDS.get(item.item_id))
                {
                    var toEnt = { 
                        id: item.item_id, 
                        name: item.name,
                        label: item.name,
                        group: item.collection
                    }
                    nodesDS.add([toEnt]);
                }
            });

            this.dataReady();
        },

        drawEntireGraph: function () {
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
                                    item.dashes = item._valid ? false : true;
                                    item.width = item._valid ? 1.0 : 1.5;

                                    var types = window.store.ref_types.filter(rt => rt.type === item.type);
                                    if (types.length > 0) item.arrows = types[0].arrows;

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

                    that.dataReady();
                });
            });
        },

        dataReady: function () {
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
                } else {
                    return;
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
                        window.open('https://maps.google.com/?hl=iw&q=' + sel.coordinates);
                    } else {
                        alert('אין מידע על מיקום');
                    }
                }
            });
        },

        findNode: function() {
            var q = this.nodeQuery;
            var sel = nodesDS.get({
                filter: function (item) {
                    return item.name == q;
                }
            });
            if (sel && sel.length > 0) {
                var xy = network.getPosition(sel[0].id);
                var newPos = {
                    position: xy,
                    scale: 1.5,
                    offset: {
                        x: 0,
                        y: 0
                    },
                    animation: false
                };
                network.moveTo(newPos);
            }
        }
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
