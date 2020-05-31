<template>
    <div :key="componentKey" class="card">
      <h1>{{document.title}} - {{document.doc_id}}</h1>
      <h2>מזהה בארכיב בר כוכבא: {{document.arch_id}}</h2>
      <label>חומר: {{document.material}}</label>
      <textarea rows="20" v-model="document.text"></textarea>
      <label>תגית: {{document.label}}</label>
      <label>תאריך: {{document.date}}</label>
      <label>רמת אותנטיות: {{document.authenticity}}</label>
      <label>תמונות:</label>
      <div class="list-unstyled" v-for="imgobj in document.images" v-bind:key="imgobj.label">
        <img v-if="imgobj.url" class="mr-3" :src="imgobj.url" :alt="imgobj.label">
        <label>{{imgobj.label}}</label>
      </div>
    </div>
</template>
<script>
let apiURL = window.location.origin;
if (!apiURL.endsWith('/')) apiURL += '/';
apiURL += 'api/db/documents';

export default {
    props: ['docId'],

    data() {
        return {
            componentKey: 0,
            document: {}
        }
    },

    mounted() {
        this.fetchData();
    },

    methods: {
        fetchData() {
            this.document = null;
            let docQ = {qv:"doc_id",qe:this.docId};
            console.log("fetching document " + JSON.stringify(docQ));
            let that = this;
            $.ajax({
                type: "GET",
                url: apiURL + "?q=" + encodeURIComponent(JSON.stringify(docQ)),
                crossdomain: true,
                success: function (result) {
                    if (result.length > 0) {
                        that.document = result[0];
                    }
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    console.log("failed fetching document " + that.docId);
                    that.componentKey += 1;
                }
            });
        },
    },
}
</script>
 
<style>
.card {
    direction: rtl;
    display: flex;
    flex-direction: column;
}
img {
  max-width: 600px;
  height: auto;
}
</style>