<template>
    <div dir="rtl">
        <div style="display:flex; flex-direction: row; justify-content: space-between;">
            <q-input rounded dense outlined type="text" v-model="nodeQuery" style="font-size: 19px;">
                <q-btn rounded unelevated class="GPLAY__toolbar-input-btn" color="primary" icon="search" @click="findNode">
                    <q-tooltip content-class="bg-accent">חיפוש בגרף לפי שם</q-tooltip>
                </q-btn>
            </q-input>
            <q-field outlined rounded dense>
                <div style="display:flex; flex-direction: row; align-items: center;">
                    <input type="radio" id="card" name="graphClick" value="card" checked>
                    <label for="card">כרטיס</label>
                    <div class="q-pa-sm">...</div>
                    <input type="radio" id="map" name="graphClick" value="map">
                    <label for="map">מפה</label>
                    <q-tooltip content-class="bg-accent">לחיצה בגרף</q-tooltip>
                </div>
            </q-field>
        </div>
        <div style="display: flex; flex-direction: row;">
            <div id="map_root" ref="map_root" style="position:relative;">
                <div id="mymap" ref="mymap" style="position: absolute; top: 0; left: 0;"></div>
                <div id="mynetwork" ref="mynetwork"></div>
            </div>
        </div>
    </div>
</template>
<script>
import graphOptions from '../assets/graphOptions.json';

const   _LEFT = 3806054;    // 3857 left x
const   _TOP = 3934294;     // 3857 top y
const   _RIGHT = 3972366;   // 3857 right x
const   _BOT = 3437999;     // 3857 bot y

const   _SCALE_BASE = 50;
const   _SCALE_FACTOR = 4;

let GIS_WIDTH = -1;
let GIS_HEIGHT = -1;
let NETWORK_OFFSET_X = -1;
let NETWORK_OFFSET_Y = -1;
let NETWORK_WIDTH = -1;
let NETWORK_HEIGHT = -1;

let _map = null;
let _currScale = 1.5;
let _currZoom = 10;
let _accumScale = 0;

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
            '_when': 0,
            '_answers': 0
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
    props: ['filter', 'queryData', 'mapObj'],
    data: () => ({
        error: '',
        nodeQuery: ''
    }),
    mounted() {
        if (this.mapObj) {
            this.bindMap();
        }

        if (this.queryData)
        {
            this.drawQuery(this.queryData);
        }
        else if (this.filter && this.filter.query && this.filter.options)
        {
            this.drawFilter(this.filter);
        }
        else
        {
            this.drawEntireGraph();
        }
    },
    methods: {
        bindMap: function() {
            GIS_WIDTH = Math.abs(_RIGHT - _LEFT);
            GIS_HEIGHT = Math.abs(_BOT - _TOP);

            NETWORK_OFFSET_X = Math.ceil(GIS_WIDTH / (_SCALE_BASE/_SCALE_FACTOR*-1));
            NETWORK_OFFSET_Y = Math.ceil(GIS_HEIGHT / (_SCALE_BASE/_SCALE_FACTOR*-1));

            NETWORK_WIDTH = Math.abs(NETWORK_OFFSET_X * 2);
            NETWORK_HEIGHT = Math.abs(NETWORK_OFFSET_Y * 2);

            var mN = this.$refs.mynetwork;
            var mM = this.$refs.mymap;

            mM.width = mN.offsetWidth + "px";
            mM.style.width = mN.offsetWidth + "px";
            mM.height = mN.offsetWidth + "px";
            mM.style.height = mN.offsetHeight + "px";

            _currZoom = 10;
            _map = new ol.Map({
                target: 'mymap',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat([35.10979, 31.75725]),
                    zoom: _currZoom
                })
            });
        },

        _syncNetwork: function (nwRef) {
            if (!nwRef) return;

            var extent = _map.getView().calculateExtent();
            var center = ol.extent.getCenter(extent);
            var minX = extent[0];
            var minY = extent[1];
            var maxX = extent[2];
            var maxY = extent[3];
            
            var scale = (nwRef.clientHeight / NETWORK_HEIGHT) * (GIS_HEIGHT / (maxY - minY));

            var newPos = {
                position: {
                    x: NETWORK_OFFSET_X + ((center[0] - _LEFT) / GIS_WIDTH) * NETWORK_WIDTH,
                    y: NETWORK_OFFSET_Y + (1 - (center[1] - _BOT) / GIS_HEIGHT) * NETWORK_HEIGHT
                },
                scale: scale,
                animation: false
            };

            network.moveTo(newPos);
        },

        queryByIds: function (collection, ids) {
            var that = this;

            return new Promise((resolve, reject) => {
                if (!collection || !ids || ids.length <= 0) {
                    resolve([]);
                }
                var settings = {
                    "url": window.apiURL.replace(this.$route.matched[0].path, '') + 'db/byIds/' + collection,
                    "method": "POST",
                    "timeout": 0,
                    "headers": {
                        "Content-Type": "application/json",
                        "x-access-token": window.tokenData.token
                    },
                    "data": JSON.stringify(ids),
                };
                            
                $.ajax(settings)
                    .done(function (result) {
                        resolve({ collection: collection, records: result });
                    })
                    .fail(function(err) {
                        reject(err);
                    });
            });
        },
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
        queryResearch: function (filter) {
            var that = this;
            const QUERY_LIMIT = 500;
            let researchURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'research/';
            var opts = { query: filter.query, filterOptions: filter.options, extractRefs: true }
            researchURL += 'by_word_options/1/' + QUERY_LIMIT + '/' + encodeURIComponent(JSON.stringify(opts));

            return new Promise((resolve, reject) => {
                $.ajax({
                    type: "GET",
                    url: researchURL,
                    crossdomain: true,
                    headers: {
                        "x-access-token": window.tokenData.token
                    },
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
                    dashes: item._valid == 'yes' ? false : true,
                    width: item._valid == 'yes' ? 1.5 : 1.0,
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

        projectItem: function(item) {
            if (item['lat'] && item['lng'] && item.lat>0 && item.lng>0) 
            {
                // this is a location
                var coords = ol.proj.transform([item.lng, item.lat], 'EPSG:4326', 'EPSG:3857');
                item.X_3857 = coords[0];
                item.Y_3857 = coords[1];
                item.x = NETWORK_OFFSET_X + (item.X_3857 - _LEFT) / GIS_WIDTH * NETWORK_WIDTH;
                item.y = NETWORK_OFFSET_Y + (1 - (item.Y_3857 - _BOT) / GIS_HEIGHT) * NETWORK_HEIGHT;
                item.fixed = true;
                item.group = item.group + ".fixed";
            }
        },

        drawFilter: function (filter) {
            //console.log(filter.query + " " + filter.options)
            this.destroy();

            let opdsOpts = {};
            nodesDS = new vis.DataSet(opdsOpts);
            edgesDS = new vis.DataSet(opdsOpts);

            // map frame pass
            nodesDS.add([{ id: 'min_XY', x: NETWORK_OFFSET_X, y: NETWORK_OFFSET_Y, fixed: true }]);
            nodesDS.add([{ id: 'max_XY', x: Math.abs(NETWORK_OFFSET_X), y: Math.abs(NETWORK_OFFSET_Y), fixed: true }]);

            let that = this;
            this.queryResearch(filter)
            .then((results) => {
                // first pass, non-references first
                console.log('first pass');
                results.forEach(item => {
                    if (item.collection != "references") {
                        item.id = item.item_id;
                        item.group = item.collection;
                        item.label = item.name;

                        if (that.mapObj) {
                            that.projectItem(item);
                        }
                        nodesDS.add([item]);
                    }
                });

                // second pass - references only
                var missing = { ext_documents: [], documents: [], persons: [], locations: [] };

                console.log('second pass');
                results.forEach(item => {
                    if (item.collection == "references")
                    {
                        item.id = item.ref_id;
                        item.title = item.type;
                        item.group = item.collection;
                        item.dashes = item._valid == 'yes' ? false : true;
                        item.width = item._valid == 'yes' ? 1.5 : 1.0;

                        var types = window.store.ref_types.filter(rt => rt.type === item.type);
                        if (types.length > 0) item.arrows = types[0].arrows;

                        edgesDS.add([item]);
                        // TODO: fix this. bring in the real entities
                        var sel = nodesDS.get({ 
                            filter: ((n) => { return (n.id == item.from || n.id == item.to); } ) 
                        });
                        if (sel && sel.length == 1) {
                            // only one side of the reference was found...
                            // we need to create the other side
                            var id = (sel[0].id == item.to) ? item.from : item.to; 
                            var newNode = { id: id, item_id: id, label: id };
                            switch (id.substring(0,1)) {
                                case "E":
                                    missing.ext_documents.push(id);
                                    break;
                                case "D":
                                    missing.documents.push(id);
                                    break;
                                case "P":
                                    missing.persons.push(id);
                                    break;
                                case "L":
                                    missing.locations.push(id);
                                    break;
                            }
                        }
                    }
                });

                var qts = [];
                for (var k in missing) {
                    if (missing[k].length > 0)
                        qts.push(that.queryByIds(k, missing[k]));
                }

                Promise.allSettled(qts).then((results) => {
                    results.forEach(res => {
                        let collection = res.value.collection;
                        let records = res.value.records;
                        let fI = (records.length > 0) ? records[0] : null;
                        if (fI) {
                            records.forEach(item => {
                                item.id = item.item_id;
                                item.group = collection + ".sec";
                                if (that.mapObj) {
                                    that.projectItem(item);
                                }
                                nodesDS.add([item]);
                            });
                        }
                    });

                    that.dataReady();
                });
            });
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
                                    item.dashes = item._valid == 'yes' ? false : true;
                                    item.width = item._valid == 'yes' ? 1.5 : 1.0;

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

        _getZoom: function(scale) {
            var _curr = 0.040789915;
            for (var zoom=7; zoom<21; zoom++) {
                if (scale < _curr/_SCALE_FACTOR) return zoom;
                _curr *= 2;
            }
            return -1;
        },

        dataReady: function () {
            network = new vis.Network(this.$refs.mynetwork, {
                nodes: nodesDS,
                edges: edgesDS,
            }, graphOptions);

            allNodes = nodesDS.get({
                returnType: "Object",
            });

            if (this.mapObj) {
                this._syncNetwork(this.$refs.mynetwork);
            }

            let that = this;

            if (this.mapObj) {
                network.on('zoom', function(params) {
                    var oldZoom = _currZoom;

                    _currZoom = that._getZoom(params.scale);

                    if (_currZoom != oldZoom) {
                        if (_currZoom == -1) {
                            _currZoom = oldZoom;
                        } else {
                            var pos = network.getViewPosition();

                            var X = (((pos.x - NETWORK_OFFSET_X) / NETWORK_WIDTH) * GIS_WIDTH) + _LEFT;
                            var Y = ((((-1 * pos.y) - NETWORK_OFFSET_Y) / NETWORK_HEIGHT) * GIS_HEIGHT) + _BOT + 1;
                    
                            _map.getView().setCenter([X, Y]);
                            _map.getView().setZoom(_currZoom);
                        }
                        that._syncNetwork(that.$refs.mynetwork);
                    }
                });
                network.on('release', function(params) {
                    //console.log('network release...');
                    var pos = network.getViewPosition();

                    var X = (((pos.x - NETWORK_OFFSET_X) / NETWORK_WIDTH) * GIS_WIDTH) + _LEFT;
                    var Y = ((((-1 * pos.y) - NETWORK_OFFSET_Y) / NETWORK_HEIGHT) * GIS_HEIGHT) + _BOT + 1;
                    
                    _map.getView().setCenter([X, Y]);

                    that._syncNetwork(that.$refs.mynetwork);
                });
            }

            network.on('click', function (params) {
                //console.log('network click...');
                let sel = null;
                if (params.nodes.length > 0) {
                    sel = nodesDS.get(params.nodes[0]);
                } else if (params.edges.length > 0) {
                    sel = edgesDS.get(params.edges[0]);
                } else {
                    return;
                }
                if (document.getElementById("card").checked) {
                    var tokens = sel.group.split('.');
                    var collName = tokens[0];

                    var params = { itemId: sel.item_id, editable: false, collName: collName };
                    switch (collName)
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
        height: 90vh;
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
