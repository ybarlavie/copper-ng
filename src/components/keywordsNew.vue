<template>
    <q-select dir="rtl" rounded outlined use-input use-chips multiple 
        v-model="model"
        input-debounce="0"
        :options-dense="true"
        :readonly="editable ? false : true"
        :options="filterOptions"
        new-value-mode="add-unique"
        @filter="filterFn"
        @input="submitModel"
        hint="מילות מפתח" />
</template>
<script>
export default {
    props: ['value', 'editable', 'parentId'],
    data() {
        return {
            filterOptions: this.parentId ?
                window.store.keywords.flatMap(si => this.parentId.match(si.itemsRegEx) ? [si.kw] : [])
                : 
                [],
            model: this.value ? JSON.parse(JSON.stringify(this.value)) : []
        }
    },

    methods: {
        submitModel(val) {
            this.$emit("update-keywords", val);
        },
        filterFn (val, update) {
            update(() => {
                if (val === '') {
                    this.filterOptions = window.store.keywords.flatMap(si => this.parentId.match(si.itemsRegEx) ? [si.kw] : []);
                } else {
                    const needle = val.toLowerCase()
                    this.filterOptions = window.store.keywords.flatMap(si => 
                        this.parentId.match(si.itemsRegEx) 
                        &&
                        si.kw.toLowerCase().indexOf(needle) > -1
                        ? 
                        [si.kw] 
                        : 
                        []);
                }
            })
        },
    }
}
</script>