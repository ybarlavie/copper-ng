<template>
        <q-field rounded outlined :hint="hint" :readonly="editable ? false : true" >
            <div class="q-pa-md q-gutter-md">
                <q-badge v-for="kw in value" 
                    :key="kw"
                    :label="kw"
                    :color="color" 
                    @click="onSearchClick(kw)"
                    outline 
                    style="font-size: 19px;"
                    :class="editable ? '' : 'cursor-pointer'" />
            </div>

            <q-input v-if="editable"
                style="max-width: 200px; font-size: 19px;"
                square
                filled
                dense
                v-model="newKeyword" 
                error-message = "כבר קיים או מכיל רווח"
                :error="!isValid">
                <template v-slot:prepend>
                    <q-icon name="add" @click="tryAdd()" class="cursor-pointer" />
                </template>
                <template v-slot:append>
                    <q-icon name="close" @click="newKeyword = ''" class="cursor-pointer" />
                </template>
            </q-input>
        </q-field>
</template>
<script>
export default {
    props: ['value', 'editable', 'color', 'hint', 'parentId'],
    data() {
        return {
            newKeyword: ''
        }
    },

    computed: {
        isValid () {
            return (this.newKeyword.indexOf(' ')<0) && !this.value.includes(this.newKeyword);
        }
    },

    methods: {
        updateKeywords() {
            this.$emit('input', {
                // month: +this.$refs.monthPicker.value,
                // year: +this.$refs.yearPicker.value
            });
        },

        tryAdd() {
            if (this.isValid) {
                this.value.push(this.newKeyword);
                this.newKeyword = '';
            }
        },

        onSearchClick(query) {
            if (!this.editable) {
                this.$router.push({ name: 'resultGrid', params: { exclude: this.parentId, query: query } });
            }
        },
    }
}
</script>