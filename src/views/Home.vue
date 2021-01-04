<template>
    <Graph :filter="gFilter" :mapObj="mObj" />
</template>
<script>
import Graph from '../components/Graph.vue'

export default {
    name: 'home',
    components: {
        Graph
    },

    props: ['graphFilter', 'mapObj'],

    data: () => ({
        error: '',
    }),

    mounted() {
    },

    methods: {
    },

    computed: {
        gFilter() { return this.graphFilter || null; },
        mObj() { return this.mapObj || null; }
    }
}
</script>
<style scoped>
    body {
        font: 10pt sans;
    }

    #message {
        color: darkred;
        max-width: 600px;
        font-size: 16px;
        cursor: pointer;
        text-decoration: underline;
    }
</style>
