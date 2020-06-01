<template>
    <div>
        <div class="list-unstyled" v-for="imgobj in imglist" v-bind:key="imgobj.label">
            <div style="display: flex; flex-direction: column;">
                <label>{{imgobj.label}}</label>
                <img v-if="imgobj.url" class="mr-3" :src="imgobj.url" :alt="imgobj.label">
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: ['images'],

    data() {
        return {
            imglist: this.images
        }
    }
}
</script>
<style>
    img {
        max-width: 600px;
        height: auto;
    }
</style>