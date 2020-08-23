<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-table title="תוצאת חיפוש" 
        :data="data" 
        :columns="columns"
        separator="vertical"
        row-key="_id"
        @row-click="onRowClicked"
        style="font-size: 19px;">
            <template v-slot:top="props">
                <div class="col-4 q-table__title">תוצאות חיפוש הביטוי: '{{query}}' {{exclude != '' ? ' - ללא מסמך ' + exclude : '' }}</div>
            </template>

            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                        :style="'text-align: right;'"
                        >
                        {{ col.label }}
                    </q-th>
                </q-tr>
            </template>

            <template v-slot:body="props">
                <q-tr :props="props" @click="onRowClicked(props)">
                    <q-td v-for="col in props.cols"
                        :key="col.name" 
                        :props="props"
                        :style="'text-align: ' + col.align + ';'"
                    >
                        {{ col.value }}
                    </q-td>
                </q-tr>
            </template>
        </q-table>
    </div>
</template>

<script>
export default {
    props: ['query', 'exclude'],
    data () {
        return {
            componentKey: 0,
            ajaxing: false,
            columns: [
                { name: 'sug', required: true, label: 'סוג', field: "sug", sortable: true, align: "right" },
                { name: '_id', required: true, label: 'מזהה כללי', field: "_id", sortable: true },
                { name: 'item_id', required: true, label: 'מזהה', field: "item_id", sortable: true, align: "left" },
                { name: 'name', required: true, label: 'שם', field: "name", sortable: true, align: "right" },
                { name: 'title', required: true, label: 'כותרת', field: "title", sortable: true, align: "right" },
                { name: 'keywords', required: true, label: 'מילות מפתח', field: "keywords", sortable: true, align: "right" },
                { name: 'aliases', required: false, label: 'שמות נרדפים', field: "aliases", sortable: true, align: "right" },
            ],
            data: []
        }
    },

    watch: {
        query: function() {
            this.fetchData();
        }
    },

    beforeMount() {
        this.fetchData();
    },

    methods: {
        onRowClicked(props) {
            var row = props.row;
            switch(row.sug) {
                case "מסמך בר כוכבא":
                    this.$router.push({ name: 'bcDocument', params: { idCol: 'doc_id', docId: row.item_id, editable: false, collName: 'documents' } });
                    break;
                case "מסמך חיצוני":
                    this.$router.push({ name: 'extDocument', params: { idCol: 'edoc_id', docId: row.item_id, editable: false, collName: 'ext_documents' } });
                    break;
                case "מיקום":
                    this.$router.push({ name: 'Location', params: { idCol: 'loc_id', docId: row.item_id, editable: false, collName: 'locations' } });
                    break;
                case "דמות":
                    this.$router.push({ name: 'Person', params: { idCol: 'prsn_id', docId: row.item_id, editable: false, collName: 'persons' } });
                    break;
            }
        },

        fetchData() {
            this.ajaxing = true;
            this.data = [];

            console.log("querying " + JSON.stringify(this.query));

            let researchURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'research/';
            let that = this;
            const QUERY_LIMIT = 500;
            $.ajax({
                type: "GET",
                url: researchURL + 'by_word/' + this.exclude + '/' + QUERY_LIMIT + '/' + encodeURIComponent(this.query),
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.ajaxing = false;
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
    },
}
</script>