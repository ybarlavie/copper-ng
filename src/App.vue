<template>
    <q-layout >
        <q-header elevated class="glossy">
            <q-toolbar dir="rtl">
                <q-btn flat dense round @click="leftDrawerOpen = !leftDrawerOpen" aria-label="Menu" icon="menu" />

                <q-toolbar-title>
                    ארכיון בר-בוכבא
                    <div style="font-size: 12px;">גרסה v3.2.07</div>
                </q-toolbar-title>

                <div v-if="this.role != 'social_arch'" class="q-pl-md q-gutter-sm row no-wrap items-center">
                    <q-btn color="primary" icon="share" @click="onSocialArch" >
                        <q-tooltip content-class="bg-accent">ארכיאולוגיה קהילתית</q-tooltip>
                    </q-btn>
                    <SearchParams @search-options="graphClicked($event)" icon="device_hub" placeHolder="סינון גרף" />
                    <SearchParams @search-options="searchClicked($event)" />
                </div>
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
                <q-item>
                    <q-btn-dropdown v-if="this.role != 'social_arch'" split push color="primary" :label="'הוספת ' + addItemType" @click="onMainClick">
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
                </q-item>
                <q-item-label header>קישורים חיצוניים</q-item-label>
            </q-list>
        </q-drawer>

        <q-page-container dir="rtl">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script>
import SearchParams from './components/searchParams'

export default {
    name: 'LayoutDefault',

    components: {
        SearchParams
    },

    beforeMount() {
    },

    mounted() {
        if (window.tokenData) {
            this.role = window.tokenData.role || "social_arch";
            this.email = window.tokenData.email || null;
        }

        this.$root.$on('login-complete', this.loginComplete);
    },

    beforeDestroy() {
        this.$root.$off('login-complete', this.loginComplete);
    },

    data() {
        return {
            componentKey: 0,
            role: 'social_arch',
            email: null,
            leftDrawerOpen: false,
            addItemType: 'ישות',
            query: ''
        }
    },

    computed: {
        isLoggedIn() {
            return window.__isLoggenIn__;
        }
    },

    methods: {
        loginComplete(loginResult) {
            this.role = window.tokenData.role;
            this.email = window.tokenData.email;
            this.componentKey += 1;
        },

        logoutClicked() {
            window.tokenData = {};
            window.localStorage.setItem(window.JWT_COOKIE, "");

            this.$router.push({
                name: 'Login'
            });
        },

        graphClicked(opts) {
            this.$router.push({ name: 'Blank' });

            var that = this;
            var p = { graphFilter: opts };
            if (opts.options.indexOf('useMap') >= 0) {
                p.mapObj = 1;
            }

            this.$nextTick().then(function () {
                that.$router.push({
                    name: 'Graph',
                    params: p
                });
            });
        },

        searchClicked(opts) {
            this.$router.push({ name: 'Blank' });

            var that = this;
            this.$nextTick().then(function () {
                that.$router.push({
                    name: 'resultGrid',
                    params: {
                        exclude: '1',
                        query: opts.query,
                        filterOptions: opts.options
                    }
                });
            });
        },

        onSocialArch() {
            this.$router.push({ name: 'Blank' });

            var that = this;
            this.$nextTick().then(function () {
                that.$router.push({
                    name: 'SocialArch',
                    params: {}
                });
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
