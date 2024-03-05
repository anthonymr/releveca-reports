const ProductosVendidos = {
  template: `
    <div>
        <div class="form-group row col-sm-8">
          <label for="from" class="col-sm-2 col-form-label text-center">
            Desde
          </label>
          <div class="col-sm-2">
            <input class="form-control form-control-sm" type="date" id="from" v-model="date_from">
          </div> 
          <label for="to" class="col-sm-1 col-form-label text-center">
            Hasta
          </label>
          <div class="col-sm-2">
            <input class="form-control form-control-sm" type="date" id="to" v-model="date_to">
          </div> 
          <div class="col-sm-4">
            <button class="btn btn-primary btn-sm mr-2" @click.prevent="getData()">Buscar</button>
            <button class="btn btn-secondary btn-sm" @click.prevent="ExportData()" v-if="transactions.length && current_search">Exportar excel</button>
          </div>
        </div>
    </div>
  `,

  props: {
    corporation: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      date_from: '',
      date_to: '',
      current_search: false,
      transactions: [],
      sorting_by: 'date'
    }
  },

  methods: {
    resetFields() {},
    sortTransactionsBy() {},

    getData() {
      if (!isDateRangeValid(this.date_from, this.date_to)) return;

      if (this.corporation == '') {
        alert('Debe seleccionar una corporación');
        return;
      }

      this.resetFields();

      axios.get(getRoute('/'), { params: { from: this.date_from, to: this.date_to, corporation: this.corporation } })
      .then(response => {
        this.current_search = `Movimientos entre ${this.date_from} y ${this.date_to}`;
        this.transactions = JSON.parse(response.data);
        this.sortTransactionsBy(this.sorting_by);
      })
      .catch(error => console.error(error));
    },

    exportData() {
    }
  }
};