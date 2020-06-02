<template>
  <q-layout>
    <q-header elevated class="glossy">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
        />

        <q-toolbar-title>
          ארכיון בר-בוכבא
        </q-toolbar-title>

        <div>גרסה v0.12.1</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      side="left"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
    >
      <q-list>
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
      leftDrawerOpen: false
    }
  }
}
</script>

<style>
</style>
