<template>
    <Graph />
</template>
<script>
import Graph from '../components/Graph.vue'

export default {
    name: 'home',
    components: {
        Graph
    },

    data: () => ({
        error: '',
    }),
    mounted() {
    },
    methods: {
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
