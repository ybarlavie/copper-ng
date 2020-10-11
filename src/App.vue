<template>
    <q-layout>
        <q-header elevated class="glossy">
            <q-toolbar dir="rtl">
                <q-btn flat dense round @click="leftDrawerOpen = !leftDrawerOpen" aria-label="Menu" icon="menu" />

                <q-toolbar-title>
                    ארכיון בר-בוכבא
                    <div style="font-size: 12px;">גרסה v1.76.183</div>
                </q-toolbar-title>

                <q-btn-dropdown split push color="primary" :label="'הוספת ' + addItemType" @click="onMainClick">
                    <q-list dir="rtl">
                        <q-item clickable v-close-popup @click="addItemType = 'תעודת בר כוכבא'">
                            <q-item-section>
                                <q-item-label>תעודת בר כוכבא</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="addItemType = 'תעודה חיצונית'">
                            <q-item-section>
                                <q-item-label>תעודה חיצונית</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="addItemType = 'דמות'">
                            <q-item-section>
                                <q-item-label>דמות</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="addItemType = 'מיקום'">
                            <q-item-section>
                                <q-item-label>מיקום</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>

                <div class="q-pl-md q-gutter-sm row no-wrap items-center">
                    <q-btn color="light-green" icon="device_hub" label="גרף" style="font-size: 15px;" to="/" />
                </div>

                <SearchParams @search-options="searchClicked($event)" />
            </q-toolbar>
        </q-header>

        <q-drawer side="right" v-model="leftDrawerOpen" bordered content-class="bg-grey-2">
            <q-list dir="rtl">
                <q-item-label header>משתמש</q-item-label>
                <q-item clickable @click="logoutClicked">
                    <q-item-section avatar>
                        <q-icon name="exit_to_app" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>התנתקות</q-item-label>
                    </q-item-section>
                </q-item>

                <q-item-label header>קישורים חיצוניים</q-item-label>
                <q-item clickable tag="a" target="_blank" href="http://blcloud.ddns.net:8081/db/copper-db">
                    <q-item-section avatar>
                        <q-icon name="school" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>בסיס הנתונים</q-item-label>
                        <q-item-label caption>ז ה י ר ו ת ! ! !</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-drawer>

        <q-page-container dir="rtl">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script>
import queryMongoAsync from './clientMongo'
import SearchParams from './components/searchParams'

export default {
    name: 'LayoutDefault',

    components: {
        SearchParams
    },

    beforeMount() {
        // {
        //     qv: 'ref_id',
        //     qe: '[A-Z]+\\d*_[A-Z]+\\d*_\\d+',
        //     prj: {
        //         'text': 0,
        //         'images': 0
        //     }
        // }
        queryMongoAsync(this, 'ref_types')
        .then(result => {
            window.store.ref_types = result;
            window.store.ref_types.forEach(t => {
                t.toRegEx = new RegExp(t.toRegEx, 'g');
                t.fromRegEx = new RegExp(t.fromRegEx, 'g');
            });
        });

        queryMongoAsync(this, 'keywords')
        .then(result => {
            window.store.keywords = result;
            window.store.keywords.forEach(t => {
                t.itemsRegEx = new RegExp(t.itemsRegEx, 'g');
            });
        });
    },

    data() {
        return {
            leftDrawerOpen: false,
            addItemType: 'ישות',
            query: ''
        }
    },
    methods: {
        logoutClicked() {
            window.tokenData = {};
            window.localStorage.setItem(window.JWT_COOKIE, "");

            this.$router.push({
                name: 'Login'
            });
        },
        searchClicked(opts) {
            this.$router.push({ name: 'Blank' });

            this.$router.push({
                name: 'resultGrid',
                params: {
                    exclude: '1',
                    query: opts.query,
                    filterOptions: opts.options
                }
            });

        },
        onMainClick(evt) {
            switch (this.addItemType) {
                case 'תעודת בר כוכבא':
                    this.$router.push({
                        name: 'bcDocument',
                        params: {
                            itemId: null,
                            state: 'ADD',
                            collName: 'documents'
                        }
                    });
                    break;
                case 'תעודה חיצונית':
                    this.$router.push({
                        name: 'extDocument',
                        params: {
                            itemId: null,
                            state: 'ADD',
                            collName: 'ext_documents'
                        }
                    });
                    break;
                case 'דמות':
                    this.$router.push({
                        name: 'Person',
                        params: {
                            itemId: null,
                            state: 'ADD',
                            collName: 'persons'
                        }
                    });
                    break;
                case 'מיקום':
                    this.$router.push({
                        name: 'Location',
                        params: {
                            itemId: null,
                            state: 'ADD',
                            collName: 'locations'
                        }
                    });
                    break;
                default:
                    alert('יש לבחור סוג ישות להוספה');
            }
        }
    }
}
</script>

<style>
</style>
