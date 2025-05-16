<template>
  <div>
    <h1>Tes Vue dengan LogRaven</h1>
    <p>Ini adalah tes sederhana untuk Vue 3</p>
    <button @click="testClick">Klik Saya</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    testClick() {
      alert('Tombol diklik');
    }
  }
}
</script> 