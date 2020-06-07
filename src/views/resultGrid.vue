<template>
  <div class="q-pa-md" :key="componentKey">
    <q-table
      title="תוצאת חיפוש"
      :data="data"
      :columns="columns"
      row-key="name"
      :visible-columns="visibleColumns"
      style="font-size: 19px;"
    >
      <template v-slot:top="props">
        <div class="col-2 q-table__title">תוצאות חיפוש: '{{query}}'</div>

        <q-space />

        <div v-if="$q.screen.gt.xs" class="col">
          <q-toggle v-model="visibleColumns" val="_id" label="מזהה כללי" />
          <q-toggle v-model="visibleColumns" val="item_id" label="מזהה" />
          <q-toggle v-model="visibleColumns" val="name" label="שם" />
          <q-toggle v-model="visibleColumns" val="title" label="כותרת" />
          <q-toggle v-model="visibleColumns" val="keywords" label="מילות מפתח" />
          <q-toggle v-model="visibleColumns" val="sug" label="סוג" />
        </div>
        <q-select
          v-else
          v-model="visibleColumns"
          multiple
          borderless
          dense
          options-dense
          :display-value="$q.lang.table.columns"
          emit-value
          map-options
          :options="columns"
          option-value="name"
          style="min-width: 150px"
        />

        <q-btn
          flat round dense
          :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          @click="props.toggleFullscreen"
          class="q-ml-md"
        />
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
            visibleColumns: [ '_id', 'item_id', 'name', 'title', 'keywords', 'sug' ],
            columns: [
                { name: 'sug', required: true, label: 'סוג', field: "sug", sortable: true },
                { name: '_id', required: true, label: 'מזהה כללי', field: "_id", sortable: true },
                { name: 'item_id', required: true, label: 'מזהה', field: "item_id", sortable: true },
                { name: 'name', required: true, label: 'שם', field: "name", sortable: true },
                { name: 'title', required: true, label: 'כותרת', field: "title", sortable: true },
                { name: 'keywords', required: true, label: 'מילות מפתח', field: "keywords", sortable: true },
            ],
            data: []
        }
    },

    mounted() {
        this.fetchData();
    },

    methods: {
        onImageClick(url) {
            window.open(url);
        },

        fetchData() {
            this.data = null;

            console.log("querying " + JSON.stringify(this.query));

            let researchURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'research/';
            let that = this;
            const QUERY_LIMIT = 10;
            $.ajax({
                type: "GET",
                url: researchURL + 'by_word/' + this.exclude + '/' + QUERY_LIMIT + '/' + encodeURIComponent(this.query),
                crossdomain: true,
                success: function (result) {
                    that.data = result;
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    console.log("failed searching " + that.query);
                    that.componentKey += 1;
                }
            });
        },
    },
}
</script>