<template>
    <q-field rounded outlined :hint="hint" :readonly="editable ? false : true" >
        <div class="q-pa-md q-gutter-md">
            <q-badge v-for="kw in value" 
                :key="kw"
                :label="kw"
                :color="color"
                @click="onWordClick(kw)"
                outline 
                style="font-size: 19px;"
                :class="editable ? '' : 'cursor-pointer'"
            >
            </q-badge>
            <q-badge v-if="editable" 
                label="חדש" color="purple" filled style="font-size: 19px;" 
                @click="onWordClick('')"
            />
        </div>
        <q-popup-edit v-model="editedMember" :validate="val => _isValid(val)" @save="onSave">
            <template v-slot="{ initialValue, value, emitValue, validate, set, cancel }" >
                <q-input
                    autofocus
                    dense
                    :value="editedMember"
                    @input="emitValue"
                    input-style="text-align: right;"
                >
                    <template v-slot:after>
                        <q-btn flat dense color="negative" icon="delete" @click.stop="onClear(initialValue, set)"/>
                        <q-btn flat dense color="negative" icon="cancel" @click.stop="cancel" />
                        <q-btn flat dense color="positive" icon="check_circle" @click.stop="set" :disable="validate(value) === false || initialValue === value" />
                    </template>
                </q-input>
            </template>
        </q-popup-edit>
    </q-field>
</template>
<script>
export default {
    props: ['value', 'editable', 'color', 'hint', 'parentId'],
    data() {
        return {
            editedMember: ''
        }
    },

    methods: {
        _isValid(w) {
            if (!this.value) return true;
            return !this.value.includes(w);
        },

        onSave(newVal, initialValue) {
            this.update(newVal, initialValue);
        },

        onClear(initialValue, next) {
            this.update('', initialValue);
            next.apply(null);
        },

        update(newVal, initialValue) {
            if (initialValue != '') {
                // this is updating an existing member
                var i = this.value.indexOf(initialValue);
                if (i>=0) {
                    // we have the edited member !
                    if (newVal === '') {
                        // this is deletion
                        this.value.splice(i,1);
                        this.editedMember = '';
                    } else if (newVal !== '' && this._isValid(newVal)) {
                        // this is a valid update
                        this.value[i] = newVal;
                        this.editedMember = '';
                    }
                }
            } else if (newVal.trim() !== '' && this._isValid(newVal)) {
                // this is a new member
                this.value.push(newVal.trim());
                this.editedMember = '';
            }
        },

        onWordClick(query) {
            if (this.editable) {
                this.editedMember = query;
            } else {
                this.$router.push({ name: 'resultGrid', params: { exclude: this.parentId, query: query } });
            }
        },
    }
}
</script>