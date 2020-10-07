<template>
    <q-card class="my-card" flat bordered>
        <div class="GPLAY__toolbar-input-container row no-wrap">
            <q-btn
                color="grey"
                round
                flat
                dense
                :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                @click="expanded = !expanded"
            />
            <q-input dense outlined square v-model="search" placeholder="חיפוש" class="bg-white col" />
            <q-btn class="GPLAY__toolbar-input-btn" color="primary" icon="search" unelevated @click="searchClicked()" />
        </div>

        <q-dialog v-model="expanded" position="top" dir="rtl">
            <q-card>
                <q-card-section class="bg-purple text-white">
                    <div class="text-h5">אפשרויות חיפוש</div>
                </q-card-section>

                <q-card-section class="row bg-green text-white">
                    <q-btn label="[ ] הכל" @click="unset('all')" />
                    <q-btn label="[x] הכל" @click="set('all')" />
                    <q-btn label="[ ] שדות" @click="unset('fields')" />
                    <q-btn label="[x] שדות" @click="set('fields')" />
                    <q-btn label="[ ] ישויות" @click="unset('entities')" />
                    <q-btn label="[x] ישויות" @click="set('entities')" />
                </q-card-section>

                <q-card-section class="row items-center no-wrap">
                    <div class="q-pa-lg">
                        <q-option-group
                            v-model="group"
                            :options="options"
                            color="yellow"
                            type="toggle"
                        />
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-card>
</template>
<script>
    export default {
        props: [],
        data () {
            return {
                search: '',
                expanded: false,
                group: [ 'useName', 'useLabel', 'useTitle', 'useKeywords', 'useAliases', 'useText', 'useDocuments', 'useExtDocuments', 'useLocations', 'usePersons'],
                options: [
                    // {
                    //     label: 'חיפוש מילה שלמה',
                    //     value: 'wholeWord'
                    // },
                    {
                        label: 'התעלם מסוגריים מרובעים',
                        value: 'ignoreSquare'
                    },
                    {
                        label: 'חפש בשדה שם',
                        value: 'useName'
                    },
                    {
                        label: 'חפש בשדה תווית',
                        value: 'useLabel'
                    },
                    {
                        label: 'חפש בשדה כותרת',
                        value: 'useTitle'
                    },
                    {
                        label: 'חפש בשדה מילות מפתח',
                        value: 'useKeywords'
                    },
                    {
                        label: 'חפש בשדה שמות נרדפים',
                        value: 'useAliases'
                    },
                    {
                        label: 'חפש בשדה טקסט',
                        value: 'useText'
                    },
                    {
                        label: 'חפש בתעודות בר כוכבא',
                        value: 'useDocuments'
                    },
                    {
                        label: 'חפש בתעודות חיצוניות',
                        value: 'useExtDocuments'
                    },
                    {
                        label: 'חפש במיקומים',
                        value: 'useLocations'
                    },
                    {
                        label: 'חפש בדמויות',
                        value: 'usePersons'
                    }
                ]
            }
        },
        methods: {
            searchClicked: function() {
                this.$emit("search-options", { query: this.search, options: this.group } );
            },
            set: function(what) {
                if (what == 'all')
                {
                    this.group = [ 'ignoreSquare', 'useName', 'useLabel', 'useTitle', 'useKeywords', 'useAliases', 'useText', 'useDocuments', 'useExtDocuments', 'useLocations', 'usePersons' ];
                } else if (what == 'fields') {
                    [ 'useName', 'useLabel', 'useTitle', 'useKeywords', 'useAliases', 'useText' ].forEach(i =>{
                        if (!this.group.includes(i)) this.group.push(i);
                    });
                } else if (what == 'entities') {
                    [ 'useDocuments', 'useExtDocuments', 'useLocations', 'usePersons' ].forEach(i =>{
                        if (!this.group.includes(i)) this.group.push(i);
                    });
                }
            },
            unset: function(what) {
                if (what == 'all') {
                    this.group = [];
                    return;
                }
                
                this.group = this.group.filter(i => {
                    if (what == 'fields' && ![ 'useName', 'useLabel', 'useTitle', 'useKeywords', 'useAliases', 'useText' ].includes(i)) {
                        return true;
                    } else if (what == 'entities' && ![ 'useDocuments', 'useExtDocuments', 'useLocations', 'usePersons' ].includes(i)) {
                        return true;
                    }
                    return false;
                });
            }
        }
    }
</script>