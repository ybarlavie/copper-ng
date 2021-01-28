<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-table title="תוצאת חיפוש"
            dense
            ref="myTable"
            :data="data" 
            :columns="columns"
            :selected.sync="selectedRows"
            :pagination="initialPagination"
            rows-per-page-label="שורות לדף"
            selection="single"
            separator="vertical"
            row-key="_id"
            @update:selected="onSelectChanged()"
            style="font-size: 19px;">
            <template v-slot:top="props">
                <q-badge :label="'תוצאות חיפוש הביטוי:'" color="blue" outline style="font-size: 19px;" />
                <q-badge :label="query" color="green" outline style="font-size: 19px;" />
            </template>

            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th />
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
                <q-tr :props="props">
                    <q-td>
                        <q-checkbox v-model="props.selected" dense/>
                    </q-td>
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
    props: ['query', 'filterOptions', 'exclude', 'rowClickCB'],
    data () {
        return {
            initialPagination: {
                sortBy: 'desc',
                descending: false,
                page: 1,
                rowsPerPage: 15
            },
            componentKey: 0,
            ajaxing: false,
            columns: [
                { name: 'sug', required: true, label: 'סוג', field: "sug", sortable: true, align: "right" },
                { name: 'item_id', required: true, label: 'מזהה', field: "item_id", sortable: true, align: "left" },
                { name: 'name', required: true, label: 'שם', field: "name", sortable: true, align: "right" },
                { name: 'title', required: true, label: 'כותרת', field: "title", sortable: true, align: "right" },
                { name: 'keywords', required: true, label: 'מילות מפתח', field: "keywords", sortable: true, align: "right" },
                { name: 'aliases', required: false, label: 'שמות נרדפים', field: "aliases", sortable: true, align: "right" },
                { name: '_id', required: true, label: 'מזהה כללי', sortable: false, field: row => row._id, format: val => `${val}` }
            ],
            data: [],
            selectedRows: [],
            pagination: {
                rowsPerPage: 0
            },
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
        onSelectChanged: function() {
            var row = null;
            if (this.selectedRows.length > 0) {
                row = this.selectedRows[0];
            }
            if (typeof this.$props.rowClickCB === 'function') {
                this.$props.rowClickCB.apply(null, [row]);
            } else {
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
            }
        },

        fetchData() {
            this.ajaxing = true;
            this.data = [];

            console.log("querying " + JSON.stringify(this.query));

            const QUERY_LIMIT = 500;

            let researchURL = window.apiURL + 'research/';

            var opts = { query: this.query, filterOptions: this.filterOptions }
            researchURL += 'by_word_options/' + this.exclude + '/' + QUERY_LIMIT + '/' + encodeURIComponent(JSON.stringify(opts));

            let that = this;
            $.ajax({
                type: "GET",
                url: researchURL,
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