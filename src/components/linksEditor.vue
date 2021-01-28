<template>
    <q-expansion-item
        expand-separator
        icon="perm_identity"
        label="קשרים"
        caption="קשרים"
        @show="fetchData">

        <q-dialog v-model="searchDlg">
            <q-card dir="rtl" style="width: 800px; max-width: 800px;">
                <DocsGrid :query="query" :filterOptions="filterOptions" :exclude="fromEntity._id" :rowClickCB="this.onSearchRowClicked" />

                <q-card-section class="q-gutter-md">
                    <q-badge :label="fromEntity.name" align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />

                    <q-btn-dropdown push color="primary" :label="newLink.typeAlias || 'בחר סוג קשר'" >
                        <q-list dir="rtl">
                            <q-item 
                                v-for="t in availableTypes"
                                :key="t.name"
                                clickable
                                v-close-popup
                                @click="onLinkTypeSelected(t)">
                                <q-item-section>
                                    <q-item-label>{{t.rev ? t.revAlias : t.alias}}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>

                    <q-badge :label="toEntityName" align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />
                </q-card-section>

                <q-card-section v-if="newLink.uniqueType == 'from-to-date'" class="row">
                    <q-badge label="בין התאריכים -" align="top" color="green" filled style="font-size: 19px;" />
                    <q-input filled v-model="newLink.range.from" hint="מתאריך" mask="date" :rules="['newLink.range.from']" style="max-width: 150px;">
                        <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                    <q-date v-model="newLink.range.from">
                                        <div class="row items-center justify-end">
                                            <q-btn v-close-popup label="סגור" color="primary" flat />
                                        </div>
                                    </q-date>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>

                    <q-badge label="ו -" align="top" color="green" filled style="font-size: 19px;" />
                    <q-input filled v-model="newLink.range.to" hint="עד תאריך" mask="date" :rules="['newLink.range.to']" style="max-width: 150px;">
                        <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                    <q-date v-model="newLink.range.to">
                                        <div class="row items-center justify-end">
                                            <q-btn v-close-popup label="סגור" color="primary" flat />
                                        </div>
                                    </q-date>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>referred at document

                </q-card-section>

                <q-card-section class="row">
                    <q-input rounded outlined type="textarea" v-model="newLink.descr" hint="תיאור הקשר" style="font-size: 19px; width:100%;" />
                </q-card-section>

                <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="ביטול" v-close-popup />
                    <q-btn v-if="newLinkValid" flat label="חיבור" @click="onSubmit" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-card v-if="dataReady">
            <q-toolbar v-if="editable" dir="rtl">
                <SearchParams @search-options="searchClicked($event)" />
                <q-btn color="positive" v-if="researchTextValid" icon="report" label="חישוב קשרים עפי טקסט התעודה" @click="onResearchText" />
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
                            <q-th v-if="editable" />
                            <q-th
                                v-for="col in props.cols"
                                :key="col.name"
                                :props="props"
                                :style="'text-align: right;'">{{ col.label }}</q-th>
                        </q-tr>
                    </template>

                    <template v-slot:body="props">
                        <q-tr :props="props" @click="onRowClicked(props)">
                            <q-td v-if="editable">
                                <q-btn flat dense color="negative" icon="delete" @click.stop="onDelete(props)" >
                                    <q-tooltip content-class="bg-accent">מחיקת הקשר</q-tooltip>
                                </q-btn>
                                <q-btn flat dense :color="(props.row._valid == 'yes') ? 'positive' : 'negative'" :icon="(props.row._valid == 'yes') ? 'report' : 'check_circle'" @click.stop="onToggleValid(props)"  >
                                    <q-tooltip content-class="bg-accent">{{ (props.row._valid == 'yes') ? 'הפיכת הקשר ללא מאומות' : 'הפיכת הקשר למאומת'}}</q-tooltip>
                                </q-btn>
                            </q-td>
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
import DocsGrid from '../components/docsGrid.vue';
import SearchParams from '../components/searchParams'

export default {
    props: ['fromEntity', 'editable'],
    components: {
        Graph,
        DocsGrid,
        SearchParams
    },
    data () {
        return { 
            componentKey: 0,
            ajaxing: false,
            dataReady: false,
            searchDlg: false,
            query: "",
            filterOptions: [],
            toEntity: null,
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
            newLink: { from_id: null, to_id: null, type: null, typeAlias: null, start: "-50000101T000000", end: "50000101T000000" , uniqueType: 'from-to', descr: "", range: { from: "-5000/01/01", to: "5000/01/01" } },
            availableTypes: [],
            data: []
        }
    },

    beforeMount() {
        this.newLink = { from_id: this.fromEntity.item_id, to_id: null, type: null, typeAlias: null, start: "-50000101T000000", end: "50000101T000000" , uniqueType: 'from-to', descr: "", range: { from: "-5000/01/01", to: "5000/01/01" } };
        this.toEntity = null;
    },

    computed: {
        graphData() {
            return { fromEntity: this.fromEntity, refs: this.data };
        },

        newLinkValid() {
            var nl = JSON.parse(JSON.stringify(this.newLink));

            if (nl.type != null) {
                if (nl.reversed == true) {
                    nl.from_id = JSON.parse(JSON.stringify(this.toEntity.item_id));
                    nl.to_id = JSON.parse(JSON.stringify(this.fromEntity.item_id));
                }

                for (var i=0; i<this.data.length; i++) {
                    var el = this.data[i];  // existing link
                    
                    if ((nl.reversed ? (nl.from_id == el.item_id) : (nl.to_id == el.item_id)) && nl.type == el.type) {
                        // link seems a duplicate... check it...
                        if (nl.uniqueType == 'from-to-date') {
                            // location can be a dup if the start-end periods are not overlapping
                            if ((nl.start >= el.start && nl.start <= el.end) 
                                ||
                                (nl.end >= el.start && nl.end <= el.end)
                                ||
                                (el.start >= nl.start && el.start <= nl.end) 
                                ||
                                (el.end >= nl.start && el.end <= nl.end)) 
                                {
                                    this.newLink.error = "חפיפה בזמנים בקישור למיקום";
                                    return false;
                                }
                        } else {
                            this.newLink.error = "קשר כבר קיים";
                            return false;
                        }
                    }
                }
            } else {
                this.newLink.error = "סוג קשר לא מוגדר";
                return false;
            }

            this.newLink.error = "קשר תקין";
            return true;
        },

        toEntityName() {
            return this.newLink && this.toEntity ? this.toEntity.name : '';
        },

        researchTextValid() {
            var f = this.fromEntity.item_id.substring(0,1);
            return f == 'E' || f == 'D'; 
        }
    }, 

    methods: {
        showNotif (ok, msg) {
            this.$q.notify({
                message: msg,
                color: ok ? 'green' : 'red'
            })
        },

        onResearchText() {
            let researchURL = window.apiURL + 'research/';
            var that = this;
            $.ajax({
                type: "GET",
                url: researchURL + 'text/' + this.fromEntity.item_id,
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.showNotif(true, "איתור קשרים הסתיים בהצלחה");
                    that.fetchData();
                },
                error: function (xhr, status, err) {
                    that.showNotif(false, "איתור קשרים נכשל");
                }
            });
        },

        onSubmit () {
            var nl = {
                from: this.newLink.from_id,
                to: this.newLink.to_id,
                type: this.newLink.type,
                created_by: 'yonib',
                description: this.newLink.descr,
                _valid: 'yes'
            };
            if (this.newLink.reversed == true)
            {
                nl.from = this.newLink.to_id;
                nl.to = this.newLink.from_id;
            }

            if (this.newLink.uniqueType == 'from-to-date') {
                var d = new Date(this.newLink.range.from);
                nl.start = d.toISOString().replace(/-|:|.\d\d\dZ/g,'');
                d = new Date(this.newLink.range.to);
                nl.end = d.toISOString().replace(/-|:|.\d\d\dZ/g,'');
            }
            var settings = {
                "url": window.apiURL + 'db/references',
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    "x-access-token": window.tokenData.token
                },
                "data": JSON.stringify(nl),
            };

            var that = this;
            this.ajaxing = true;
            console.log('ajaxing up!');
            $.ajax(settings).done(function (response) {
                that.showNotif(true, "השמירה הצליחה");
                that.fetchData();
            })
            .fail(function(err) {
                console.log('error' +  JSON.stringify(err))
                that.showNotif(false, "השמירה נכשלה");
            })
            .always(function() {
                that.ajaxing = false;
            });
        },

        fetchData() {
            if (!this.fromEntity) return;

            this.ajaxing = true;
            this.dataReady = false;
            this.data = [];

            // reset new link
            this.newLink = { from_id: JSON.parse(JSON.stringify(this.fromEntity.item_id)), to_id: null, type: null, typeAlias: null, start: "-50000101T000000", end: "50000101T000000" , uniqueType: 'from-to', descr: "", range: { from: "-5000/01/01", to: "5000/01/01" } };
            this.toEntity = null;

            let researchURL = window.apiURL + 'research/';
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
                    that.componentKey += 1;
                }
            });
        },

        onSearchRowClicked(row) {
            // reset new link
            this.newLink = { from_id: JSON.parse(JSON.stringify(this.fromEntity.item_id)), to_id: null, type: null, typeAlias: null, start: "-50000101T000000", end: "50000101T000000" , uniqueType: 'from-to', descr: "", range: { from: "-5000/01/01", to: "5000/01/01" } };
            this.toEntity = null;

            var from_item_id = JSON.parse(JSON.stringify(this.fromEntity.item_id));
            this.availableTypes = window.store.ref_types.flatMap( t => {
                if (t.toRegEx.source == t.fromRegEx.source && t.alias != t.revAlias
                    && from_item_id.match(t.toRegEx) && row.item_id.match(t.toRegEx))
                {
                    // this means that type from and to patterns are the same
                    // and the from_item_id and row.item_id match the pattern
                    // this means that the link could be both reversed and non-reveresed
                    // we return both...
                    var tt1 = JSON.parse(JSON.stringify(t));
                    tt1.rev = false; 
                    var tt2 = JSON.parse(JSON.stringify(t));
                    tt2.rev = true;
                    return [tt1, tt2];
                }
                else if (from_item_id.match(t.fromRegEx) && row.item_id.match(t.toRegEx)) 
                {
                    var tt = JSON.parse(JSON.stringify(t));
                    tt.rev = false; 
                    return [tt];
                } 
                else if (row.item_id.match(t.fromRegEx) && from_item_id.match(t.toRegEx) && t.alias != t.revAlias)
                {
                    var tt = JSON.parse(JSON.stringify(t));
                    tt.rev = true; 
                    return [tt];
                }
                return [];
            });

            if (this.availableTypes.length > 0) {
                this.toEntity = JSON.parse(JSON.stringify(row));
                this.newLink.to_id = JSON.parse(JSON.stringify(row.item_id));
            } else {
                this.showNotif(false, "לא נבחר יעד לקשר");
            }
        },

        onLinkTypeSelected(t) {
            this.newLink.type = t.type;
            this.newLink.typeAlias = t.rev ? t.revAlias : t.alias;
            this.newLink.uniqueType = t.uniqueType;
            this.newLink.reversed = t.rev;
            if (!this.newLinkValid) {
                this.showNotif(false, this.newLink.error);
            }
        },

        onRowClicked(props) {
            var row = props.row;
        },

        onToggleValid(props) {
            var row = props.row;
            var settings = {
                "url": window.apiURL + 'db/updateFields/references/' + row.ref_id ,
                "method": "PUT",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    "x-access-token": window.tokenData.token
                },
                "data": JSON.stringify({_valid: (row._valid == 'yes') ? 'no' : 'yes' }),
            };

            var that = this;
            this.ajaxing = true;
            console.log('ajaxing up!');
            $.ajax(settings).done(function (response) {
                that.showNotif(true, "העדכון הצליח");
                that.fetchData();
            })
            .fail(function(err) {
                console.log('error' + JSON.stringify(err))
                that.showNotif(false, "העדכון נכשל");
            })
            .always(function() {
                that.ajaxing = false;
            });
        },

        onDelete(props) {
            var row = props.row;
            var settings = {
                "url": window.apiURL + 'db/references',
                "method": "DELETE",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    "x-access-token": window.tokenData.token
                },
                "data": JSON.stringify(row),
            };

            var that = this;
            this.ajaxing = true;
            console.log('ajaxing up!');
            $.ajax(settings).done(function (response) {
                that.showNotif(true, "המחיקה הצליחה");
                that.fetchData();
            })
            .fail(function(err) {
                console.log('error' + JSON.stringify(err))
                that.showNotif(false, "המחיקה נכשלה");
            })
            .always(function() {
                that.ajaxing = false;
            });
        },

        searchClicked(opts) {
            this.query = opts.query;
            this.filterOptions = opts.options;
            this.searchDlg = true;
        }
    },

    beforeDestroy () {
    }
}
</script>