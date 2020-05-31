<template>
    <div :key="componentKey" class="card">
      <h1>תעודה: "{{document.title}}" - מזהה: {{document.doc_id}}</h1>
      <h2>מזהה בארכיב בר כוכבא: "{{document.arch_id}}"</h2>
      <h2>חומר: {{document.material}}</h2>
      <h2>תגית: {{document.label}}</h2>
      <h2>תאריך: {{document.date}}</h2>
      <h2>רמת אותנטיות: {{document.authenticity}}</h2>
      <h2>טקסט:</h2>
      <textarea rows="20" v-model="document.text" style="font-size:14pt;"></textarea>
      <h2>תמונות:</h2>
      <div class="list-unstyled" v-for="imgobj in document.images" v-bind:key="imgobj.label">
          <div style="display: flex; flex-direction: column;">
              <label>{{imgobj.label}}</label>
              <img v-if="imgobj.url" class="mr-3" :src="imgobj.url" :alt="imgobj.label">
          </div>
      </div>
    </div>
</template>
<script>
let apiURL = window.location.origin + window.location.pathname;
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