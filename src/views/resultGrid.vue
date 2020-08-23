<template>
    <DocsGrid :query="query" :exclude="exclude" />
</template>

<script>
import DocsGrid from '../components/docsGrid'

export default {
    components: {
        DocsGrid
    },
    props: ['query', 'exclude'],
    data () {
        return {}
    }
}
</script>