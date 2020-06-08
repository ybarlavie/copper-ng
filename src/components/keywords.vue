<template>
    <q-field rounded outlined :hint="hint" :readonly="editable ? false : true" >
        <div class="q-pa-md q-gutter-md">
            <q-badge v-for="kw in value" 
                :key="kw"
                :label="kw"
                :color="color" 
                @click="onSearchClick(kw)"
                outline 
                style="font-size: 19px;" />
        </div>
    </q-field>
</template>
<script>
export default {
    props: ['value', 'editable', 'color', 'hint', 'parentId'],
    data() {
        return {
        }
    },
    methods: {
        updateKeywords() {
            this.$emit('input', {
                // month: +this.$refs.monthPicker.value,
                // year: +this.$refs.yearPicker.value
            });
        },

        onSearchClick(query) {
            this.$router.push({ name: 'resultGrid', params: { exclude: this.parentId, query: query } });
        },
    }
}
</script>