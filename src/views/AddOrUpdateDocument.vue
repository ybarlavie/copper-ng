<template>
    <div>
      <form @submit.prevent="addDDocument" class="mb-3">
        <div v-if="error" class="alert alert-dismissible alert-warning">
          <button type="button" class="close" data-dismiss="alert">&times;</button>
          <h4 class="alert-heading">Error!</h4>
          <p class="mb-0">{{error}}</p>
        </div>
        <div class="form-group">
          <label for="doc_id">doc_id</label>
          <input
            v-model="document.doc_id"
            type="text"
            class="form-control"
            id="doc_id" required>
        </div>
        <div class="form-group">
          <label for="arch_id">arch_id</label>
          <input
            v-model="document.arch_id"
            type="text"
            class="form-control"
            id="arch_id" required>
        </div>
        <div class="form-group">
          <label for="text">Text</label>
          <textarea
            v-model="document.text"
            type="text"
            class="form-control"
            rows="10"
            id="text">
        </div>
        <div class="form-group">
          <label for="label">Label</label>
          <input
            v-model="document.label"
            type="text"
            class="form-control"
            id="label">
        </div>
        <div class="form-group">
          <label for="title">Title</label>
          <input
            v-model="document.title"
            type="text"
            class="form-control"
            id="title">
        </div>
        <div class="form-group">
          <label for="imageURL">Image URL</label>
          <input
            v-model="document.images[0].url"
            type="url"
            class="form-control"
            id="imageURL"
            placeholder="Enter URL to an image">
        </div>
        <button type="submit" class="btn btn-primary">Add Document</button>
      </form>
    </div>
</template>
<script>
</script>
<style scoped>
</style>
