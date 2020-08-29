<template>
    <q-expansion-item
        expand-separator
        icon="perm_identity"
        label="קשרים"
        caption="קשרים"
        @show="fetchData">
        <q-card>
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
        <q-card v-if="dataReady">
            <Graph :queryData="graphData" />
        </q-card>
      </q-expansion-item>
</template>
<script>
import Graph from '../components/Graph.vue';

export default {
    props: ['fromEntity', 'editable'],
    components: {
        Graph
    },
    data () {
        return { 
            componentKey: 0,
            ajaxing: false,
            dataReady: false,
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

        onRowClicked(props) {
            var row = props.row;
        }
    },

    beforeDestroy () {
    }
}
</script>