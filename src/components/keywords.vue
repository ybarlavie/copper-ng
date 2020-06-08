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
                    :class="editable ? '' : 'cursor-pointer'" />
            </div>

            <q-input v-if="editable"
                style="max-width: 200px; font-size: 19px;"
                square
                filled
                dense
                v-model="editText" 
                error-message = "כבר קיים או מכיל רווח"
                :error="!isValid">
                <template v-slot:prepend>
                    <q-icon v-if="canSave" name="check" @click="update()" class="cursor-pointer">
                        <q-tooltip content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                            שמירה
                        </q-tooltip>
                    </q-icon>
                    <q-icon v-if="canCancel" name="cancel" @click="editText = editedMember = ''" class="cursor-pointer">
                        <q-tooltip content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                            ביטול
                        </q-tooltip>
                    </q-icon>
                </template>
                <template v-slot:append>
                    <q-icon name="close" @click="editText = ''" class="cursor-pointer">
                        <q-tooltip content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                            ניקוי
                        </q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </q-field>
</template>
<script>
export default {
    props: ['value', 'editable', 'color', 'hint', 'parentId'],
    data() {
        return {
            editText: '',
            editedMember: ''
        }
    },

    computed: {
        isValid () {
            return this._isValid(this.editText);
        },
        canSave () {
            return this.editText != this.editedMember;
        },
        canCancel () {
            return this.editText != this.editedMember || this.editedMember !== '';
        }
    },

    methods: {
        updateKeywords() {
            this.$emit('input', {
                // month: +this.$refs.monthPicker.value,
                // year: +this.$refs.yearPicker.value
            });
        },

        _isValid(w) {
            return (w.indexOf(' ')<0) && !this.value.includes(w);
        },

        update() {
            if (this.editedMember !== '') {
                // this is updating an existing member
                var i = this.value.indexOf(this.editedMember);
                if (i>=0) {
                    // we have the edited member !
                    if (this.editText === '') {
                        // this is deletion
                        this.value.splice(i,1);
                        this.editText = this.editedMember = '';
                    } else if (this.editText !== '' && this._isValid(this.editText)) {
                        // this is a valid update
                        this.value[i] = this.editText;
                        this.editText = this.editedMember = '';
                    }
                }
            } else if (this.editText !== '' && this._isValid(this.editText)) {
                // this is a new member
                this.value.push(this.editText);
                this.editText = this.editedMember = '';
            }
        },

        onWordClick(query) {
            if (this.editable) {
                this.editText = this.editedMember = query;
            } else {
                this.$router.push({ name: 'resultGrid', params: { exclude: this.parentId, query: query } });
            }
        },
    }
}
</script>