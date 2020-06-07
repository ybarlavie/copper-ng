<template>
  <q-layout>
    <q-header elevated class="glossy">
      <q-toolbar dir="rtl">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu" />

        <q-toolbar-title>
          ארכיון בר-בוכבא
          <div style="font-size: 12px;" >גרסה v0.12.1</div>
        </q-toolbar-title>

        <div class="q-pl-md q-gutter-sm row no-wrap items-center">
          <q-btn color="light-green" icon="device_hub" label="גרף" style="font-size: 15px;" to="/" />
        </div>

        <div class="GPLAY__toolbar-input-container row no-wrap">
          <q-input dense outlined square v-model="search" placeholder="חיפוש" class="bg-white col" />
          <q-btn class="GPLAY__toolbar-input-btn" color="primary" icon="search" unelevated @click="searchClicked()" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      side="right"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
    >
      <q-list dir="rtl">
        <q-item-label header>קישורים חשובים</q-item-label>
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
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'LayoutDefault',

  components: {
    HelloWorld
  },

  data () {
    return {
      leftDrawerOpen: false,
      search: ''
    }
  },
  methods: {
    searchClicked() {
      this.$router.push({ name: 'Blank' });
      this.$router.push({ name: 'resultGrid', params: { exclude: '1', query: this.search } });
    }
  }
}
</script>

<style>
</style>
