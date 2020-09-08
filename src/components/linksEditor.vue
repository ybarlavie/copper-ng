<template>
    <q-expansion-item
        expand-separator
        icon="perm_identity"
        label="קשרים"
        caption="קשרים"
        @show="fetchData">
        <q-card>
            <q-toolbar dir="rtl">
                <div class="GPLAY__toolbar-input-container row no-wrap">
                    <q-input dense outlined square v-model="search" placeholder="חיפוש" class="bg-white col" />
                    <q-btn class="GPLAY__toolbar-input-btn" color="primary" icon="search" unelevated @click="searchClicked()" />
                </div>
            </q-toolbar>

            <q-card-section>
                <q-linear-progress v-if="ajaxing" indeterminate />
                <q-table title="קשרים לישויות אחרות" 
                    :data="data" 
                    :columns="columns"
                    separator="vertical"
                    row-key="_id"
                    @row-click="onRowClicked"
                    style="font-size: 19px;">

                    <template v-slot:header="props">
                        <q-tr :props="props">
                            <q-th
                                v-for="col in props.cols"
                                :key="col.name"
                                :props="props"
                                :style="'text-align: right;'">{{ col.label }}</q-th>
                        </q-tr>
                    </template>

                    <template v-slot:body="props">
                        <q-tr :props="props" @click="onRowClicked(props)">
                            <q-td v-for="col in props.cols"
                                :key="col.name" 
                                :props="props"
                                :style="'text-align: ' + col.align + ';'">{{ col.value }}</q-td>
                        </q-tr>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>
        <q-dialog v-model="searchDlg">
            <q-card dir="rtl">
                <DocsGrid :query="search" :exclude="fromEntity._id" :rowClickCB="this.onSearchRowClicked" />
                <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="ביטול" v-close-popup />
                    <q-btn flat label="חיבור" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <!-- <q-dialog v-model="currLink">
            <q-card class="my-card">
                <q-img src="https://cdn.quasar.dev/img/chicken-salad.jpg" />

                <q-card-section>
                <q-btn
                    fab
                    color="primary"
                    icon="place"
                    class="absolute"
                    style="top: 0; right: 12px; transform: translateY(-50%);"
                />

                <div class="row no-wrap items-center">
                    <div class="col text-h6 ellipsis">
                    Cafe Basilico
                    </div>
                    <div class="col-auto text-grey text-caption q-pt-md row no-wrap items-center">
                    <q-icon name="place" />
                    250 ft
                    </div>
                </div>

                <q-rating v-model="stars" :max="5" size="32px" />
                </q-card-section>

                <q-card-section class="q-pt-none">
                <div class="text-subtitle1">
                    $・Italian, Cafe
                </div>
                <div class="text-caption text-grey">
                    Small plates, salads & sandwiches in an intimate setting.
                </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="right">
                    <q-btn v-close-popup flat color="primary" label="Reserve" />
                    <q-btn v-close-popup flat color="primary" round icon="event" />
                </q-card-actions>
            </q-card>
        </q-dialog> -->
        <q-card v-if="dataReady">
            <Graph :queryData="graphData" />
        </q-card>
      </q-expansion-item>
</template>
<script>
import Graph from '../components/Graph.vue';
import DocsGrid from '../components/docsGrid.vue';

export default {
    props: ['fromEntity', 'editable'],
    components: {
        Graph,
        DocsGrid
    },
    data () {
        return { 
            componentKey: 0,
            ajaxing: false,
            dataReady: false,
            searchDlg: false,
            search: '',
            columns: [
                { name: 'sug', required: true, label: 'סוג ישות', field: "sug", sortable: true, align: "right" },
                { name: 'item_id', required: true, label: 'מזהה ישות', field: "item_id", sortable: true, align: "left" },
                { name: 'name', required: true, label: 'שם ישות', field: "name", sortable: true, align: "right" },
                { name: 'ref_id', required: true, label: 'מזהה קשר', field: "ref_id", sortable: true, align: "left" },
                { name: 'type', required: true, label: 'סוג קשר', field: "type", sortable: true, align: "left" },
                { name: 'description', required: true, label: 'תיאור קשר', field: "description", sortable: true, align: "right" },
                { name: 'start', required: true, label: 'התחלה', field: "start", sortable: true, align: "left" },
                { name: 'end', required: true, label: 'סיום', field: "end", sortable: true, align: "left" },
            ],
            data: []
        }
    },

    computed: {
        graphData() {
            return { fromEntity: this.fromEntity, refs: this.data };
        }
    }, 

    methods: {
        fetchData() {
            this.ajaxing = true;
            this.dataReady = false;
            this.data = [];

            console.log("querying " + JSON.stringify(this.query));

            let researchURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'research/';
            let that = this;
            const QUERY_LIMIT = 500;
            $.ajax({
                type: "GET",
                url: researchURL + 'refs/' + this.fromEntity.item_id,
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.ajaxing = false;
                    that.dataReady = true;
                    that.data = result;
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    that.ajaxing = false;
                    console.log("failed searching " + that.query);
                    that.componentKey += 1;
                }
            });
        },

        onSearchRowClicked(row) {
            switch(row.sug) {
                case "מסמך בר כוכבא":
                    this.$router.push({ name: 'bcDocument', params: { itemId: row.item_id, editable: false, collName: 'documents' } });
                    break;
                case "מסמך חיצוני":
                    this.$router.push({ name: 'extDocument', params: { itemId: row.item_id, editable: false, collName: 'ext_documents' } });
                    break;
                case "מיקום":
                    this.$router.push({ name: 'Location', params: { itemId: row.item_id, editable: false, collName: 'locations' } });
                    break;
                case "דמות":
                    this.$router.push({ name: 'Person', params: { itemId: row.item_id, editable: false, collName: 'persons' } });
                    break;
            }
        },

        onRowClicked(props) {
            var row = props.row;
        },

        searchClicked() {
            this.searchDlg = true;
        }
    },

    beforeDestroy () {
    }
}
</script>