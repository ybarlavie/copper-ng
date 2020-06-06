<template>
  <div class="q-pa-md">
    <q-table
      title="תוצאת חיפוש"
      :data="data"
      :columns="columns"
      row-key="_id"
      :visible-columns="visibleColumns"
    >
      <template v-slot:top="props">
        <div class="col-2 q-table__title">תוצאות חיפוש</div>

        <q-space />

        <div v-if="$q.screen.gt.xs" class="col">
          <q-toggle v-model="visibleColumns" val="calories" label="Calories" />
          <q-toggle v-model="visibleColumns" val="fat" label="Fat" />
          <q-toggle v-model="visibleColumns" val="carbs" label="Carbs" />
          <q-toggle v-model="visibleColumns" val="protein" label="Protein" />
          <q-toggle v-model="visibleColumns" val="sodium" label="Sodium" />
          <q-toggle v-model="visibleColumns" val="calcium" label="Calcium" />
          <q-toggle v-model="visibleColumns" val="iron" label="Iron" />
        </div>
        <q-select
          v-else
          v-model="visibleColumns"
          multiple
          borderless
          dense
          options-dense
          :display-value="$q.lang.table.columns"
          emit-value
          map-options
          :options="columns"
          option-value="name"
          style="min-width: 150px"
        />

        <q-btn
          flat round dense
          :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          @click="props.toggleFullscreen"
          class="q-ml-md"
        />
      </template>

    </q-table>
  </div>
</template>