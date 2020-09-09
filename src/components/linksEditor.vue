<template>
    <q-expansion-item
        expand-separator
        icon="perm_identity"
        label="קשרים"
        caption="קשרים"
        @show="fetchData">
        <q-card v-if="dataReady">
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

                <q-card-section>
                    <q-btn-dropdown split push color="primary" :label="newLink.typeAlias || 'בחר סוג קשר'">
                        <q-list dir="rtl">
                            <q-item 
                                v-for="t in availableTypes"
                                :key="t.name"
                                clickable
                                v-close-popup
                                @click="newLink.type = t.name; newLink.typeAlias = t.alias">
                                <q-item-section>
                                    <q-item-label>{{t.alias}}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="ביטול" v-close-popup />
                    <q-btn v-if="newLinkValid" flat label="חיבור" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
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
            search: "",
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
            newLink: { type: null,typeAlias: null, start: null, end: null },
            availableTypes: [],
            data: []
        }
    },

    computed: {
        graphData() {
            return { fromEntity: this.fromEntity, refs: this.data };
        },

        newLinkValid() {
            return (this.newLink.type != null);
        }
    }, 

    methods: {
        fetchData() {
            if (!this.fromEntity) return;

            this.ajaxing = true;
            this.dataReady = false;
            this.data = [];

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
            // reset new link
            this.newLink = { type: null,typeAlias: null, start: null, end: null };
            this.availableTypes = [];

            // calculate available types
            var f0 = this.fromEntity.item_id.substring(0,1);
            switch (f0) {
                case "D"://"מסמך בר כוכבא":
                    this.availableTypes.push({ name: 'referred at document', alias: 'מוזכר בתעודה'});
                    break;
                case "E"://"מסמך חיצוני":
                    this.availableTypes.push({ name: 'referred at document', alias: 'מוזכר בתעודה'});
                    break;
                case "L"://"מיקום":
                    this.availableTypes.push({ name: 'referred at document', alias: 'מוזכר בתעודה'});
                    break;
                case "P"://"דמות":
                    this.availableTypes.push({ name: 'referred at document', alias: 'מוזכר בתעודה'});
                    this.availableTypes.push({ name: 'visit at', alias: 'ביקר ב-' });
                    this.availableTypes.push({ name: 'child of', alias: 'בן/ת של' });
                    this.availableTypes.push({ name: 'sibling', alias: 'אח/ות של' });
                    this.availableTypes.push({ name: 'spouse', alias: 'בן/ת זוג של' });
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