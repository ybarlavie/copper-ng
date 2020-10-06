<template>
    <DocsGrid :query="query" :filterOptions="filterOptions" :exclude="exclude" />
</template>

<script>
import DocsGrid from '../components/docsGrid'

export default {
    components: {
        DocsGrid
    },
    props: ['query', 'filterOptions', 'exclude'],
    data () {
        return {}
    }
}
</script>