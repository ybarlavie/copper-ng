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
                        label: 'התעלם מסוגריים מרובעות',
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
            }
        }
    }
</script>