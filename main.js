const app = Vue.createApp({
  data() {
    return {
      currentReport: null,
      drawer: false,
      tableItems: [],
      loadingData: false,






      date_from: '',
      date_to: '',
      queryType: '',
      transactions: [],
      orders: [],
      id_from: '',
      id_to: '',
      onlyToBuy: false,

      current_search: '',
      sorting_by: 'total',
      sorting_direction: 'asc',

      item_filter: '',
      description_filter: '',
      total_filter: '',
      stock_filter: '',
      stock_commited_filter: '',
      stock_to_arrive_filter: '',
      provider_filter: '',
      sales_per_month_filter: '',
      months_in_stock_filter: '',
      order_suggestion_filter: '',
      bill_id_filter: '',
      qty_filter: '',
      last_cost_filter: '',
      last_cost_date_filter: '',
      sub_line_filter: '',
      ref_filter: '',
      store_filter: '',

      corporation: '',
      route: 'http://localhost:8081',
      //route: 'http://192.168.0.162:8080',

      order_duration: 5,
      order_desired_stock: 6, 
    }
  },

  methods: {
    generateReport(report) {
      this.currentReport = report;
      this.drawer = false;

      if(this.currentReport.report == 'Productos vendidos') this.getSoldProducts();
      if(this.currentReport.report == 'Productos sin movimiento') this.getNoMovementProducts();
      if(this.currentReport.report == 'Sugerencia de compra') this.getSuggestionToBuy();
      if(this.currentReport.report == 'Rango de notas de entrega') this.getOrders();
    },

    async doQuery(path) {
      try {
        const response = await axios.get(this.getRoute(path), { params: this.currentReport })
        return JSON.parse(response.data);
      } catch (error) {
        console.error(error);
        return [];
      }
    },

    async getSoldProducts() {
      this.loadingData = true;
      this.tableItems = await this.doQuery('/');
      this.loadingData = false;
    },

    async getNoMovementProducts() {
      this.loadingData = true;
      this.tableItems = await this.doQuery('/no-sales-items');
      this.loadingData = false;
    },

    async getSuggestionToBuy() {
      this.loadingData = true;
      const suggestionToBuy = await this.doQuery('/');
      const noSalesItems = await this.doQuery('/no-sales-items');

      noSalesItems.forEach(item => {
        if(suggestionToBuy.findIndex(transaction => transaction.item == item.item) == -1){
          suggestionToBuy.push({
            ...item,
            amount_to_buy: '',
          });
        }
      });

      this.tableItems = suggestionToBuy;
      this.loadingData = false;
    },

    async getOrders() {
      this.loadingData = true;
      this.tableItems = await this.doQuery('/per-id-range');
      this.loadingData = false;
    },







    getasdasdData() {
      switch (this.queryType) {
        case '1': // Productos vendidos
          axios.get(this.getRoute('/'), { params: { from: this.date_from, to: this.date_to, corporation: this.corporation } })
          .then(response => {
            this.current_search = `Movimientos entre ${this.date_from} y ${this.date_to}`;
            this.transactions = JSON.parse(response.data);
            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        break;
          case '2': // Productos sin movimiento
          axios.get(this.getRoute('/no-sales-items'), { params: { from: this.date_from, to: this.date_to, corporation: this.corporation } })
          .then(response => {
            this.current_search = `Movimientos entre ${this.date_from} y ${this.date_to}`;
            this.transactions = JSON.parse(response.data);
            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        break;
        case '3': // Sugerencia de compra
        axios.get(this.getRoute('/'), { params: { from: this.date_from + '-01', to: this.currentDate, corporation: this.corporation } })
        .then(response => {
          this.current_search = `Sugerencia de compra evaluando desde ${this.date_from}`;
          this.transactions = JSON.parse(response.data);
          this.transactions = this.transactions.map(item => {
            return {
              ...item,
              amount_to_buy: '',
            }
          });

          axios.get(this.getRoute('/no-sales-items'), { params: { from: this.date_from + '-01', to: this.currentDate, corporation: this.corporation } })
          .then(response => {
            let noSaleTransactions = JSON.parse(response.data);

            // add to transactions the items that have not been sold
            noSaleTransactions.forEach(item => {
              if(this.transactions.findIndex(transaction => transaction.item == item.item) == -1){
                this.transactions.push({
                  ...item,
                  amount_to_buy: '',
                });
              }
            });

            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
        break;
        case '4': // Movimientos por rango de IDs
        axios.get(this.getRoute('/per-id-range'), { params: { from: this.id_from, to: this.id_to, corporation: this.corporation } })
        .then(response => {
          this.current_search = `Movimientos entre ${this.id_from} y ${this.id_to}`;
          this.transactions = JSON.parse(response.data);
          this.sorting_by = 'item';
          this.sortTransactionsBy(this.sorting_by);
        })
      break;
      }
    },


























    transactionPerItem(item) {
      return this.transactions.filter(transaction => transaction.item == item)[0];
    },

    salesPerMonth(sales) {
      s = isNaN(sales) ? 0 : parseFloat(sales);
      return parseFloat(s) / this.durationBetweenDates.months;
    },

    monthInStock(stock, sales, commited, to_arrive) {
      s = isNaN(stock) ? 0 : parseFloat(stock);
      c = isNaN(commited) ? 0 : parseFloat(commited);
      a = isNaN(to_arrive) ? 0: parseFloat(to_arrive);
      return (s - c + a) / this.salesPerMonth(sales);
    },

    orderSugesstion(stock, sales, commited, to_arrive) {
      let monthInStock = Math.floor(this.monthInStock(stock, sales, commited, to_arrive));
      if ( monthInStock < this.order_desired_stock ) return '¡comprar!';
      if ( monthInStock == this.order_desired_stock ) return 'comprar';
      if ( monthInStock > this.order_desired_stock + 12 ) return '¡sobre existencia!';
      return 'no comprar';
    },

    orderSuggestionColor(orderSuggestion) {
      if (orderSuggestion == '¡comprar!') return 'badge-danger';
      if (orderSuggestion == 'comprar') return 'badge-warning';
      if (orderSuggestion == '¡sobre existencia!') return 'badge-info';
      return 'badge-success';
    },

    setDesiredStock() {
      this.order_desired_stock = this.order_duration + 1;
    },

    getRoute(resource) {
      return this.route + resource;
    },

    setSortingParameters(field) {
      if (this.sorting_by == field) {
        this.sorting_direction = this.sorting_direction == 'asc' ? 'desc' : 'asc';
      } else {
        this.sorting_by = field;
        this.sorting_direction = 'asc';
      }
    },

    sortTransactionsBy(field) {
      this.setSortingParameters(field);

      this.transactions = this.transactions.sort((a, b) => {
        if(field === 'sales_in_month') {
          if (this.sorting_direction == 'asc') {
            if (this.salesPerMonth(a.total) < this.salesPerMonth(b.total)) return -1;
            if (this.salesPerMonth(a.total) > this.salesPerMonth(b.total)) return 1;
            return 0;
          } else {
            if (this.salesPerMonth(a.total) < this.salesPerMonth(b.total)) return 1;
            if (this.salesPerMonth(a.total) > this.salesPerMonth(b.total)) return -1;
            return 0;
          }
        }

        if(field === 'months_in_stock') {
          if (this.sorting_direction == 'asc') {
            if (this.monthInStock(a.stock, a.total, a.stock_commited, a.stock_to_arrive) < this.monthInStock(b.stock, b.total, b.stock_commited, b.stock_to_arrive)) return -1;
            if (this.monthInStock(a.stock, a.total, a.stock_commited, a.stock_to_arrive) > this.monthInStock(b.stock, b.total, b.stock_commited, b.stock_to_arrive)) return 1;
            return 0;
          } else {
            if (this.monthInStock(a.stock, a.total, a.stock_commited, a.stock_to_arrive) < this.monthInStock(b.stock, b.total, b.stock_commited, b.stock_to_arrive)) return 1;
            if (this.monthInStock(a.stock, a.total, a.stock_commited, a.stock_to_arrive) > this.monthInStock(b.stock, b.total, b.stock_commited, b.stock_to_arrive)) return -1;
            return 0;
          }
        }

        if(field === 'order_suggestion') {
          if (this.sorting_direction == 'asc') {
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) != '¡comprar!') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) != '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡comprar!') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡comprar!') return 0;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'no comprar') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'no comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'comprar') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'comprar') return 0;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'no comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡sobre existencia!') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡sobre existencia!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'no comprar') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡sobre existencia!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡sobre existencia!') return 0;
            return 0;
          } else {
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) != '¡comprar!') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) != '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡comprar!') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡comprar!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡comprar!') return 0;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'no comprar') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'no comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'comprar') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'comprar') return 0;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == 'no comprar' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡sobre existencia!') return 1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡sobre existencia!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == 'no comprar') return -1;
            if (this.orderSugesstion(a.stock, a.total, a.stock_commited, a.stock_to_arrive) == '¡sobre existencia!' && this.orderSugesstion(b.stock, b.total, b.stock_commited, b.stock_to_arrive) == '¡sobre existencia!') return 0;
            return 0;
          }
        }

        if(field === 'amount_to_buy') {
          if (this.sorting_direction == 'asc') {
            if (this.transactionPerItem(a.item).amount_to_buy > this.transactionPerItem(b.item).amount_to_buy) return -1;
          } else {
            if (this.transactionPerItem(a.item).amount_to_buy < this.transactionPerItem(b.item).amount_to_buy) return -1;
          }
        }


        if (!isNaN(a[field])) {
          if (this.sorting_direction == 'asc') {
            if (parseFloat(a[field]) < parseFloat(b[field])) return -1;
            if (parseFloat(a[field]) > parseFloat(b[field])) return 1;
            return 0;
          } else {
            if (parseFloat(a[field]) < parseFloat(b[field])) return 1;
            if (parseFloat(a[field]) > parseFloat(b[field])) return -1;
            return 0;
          }
        }

        if(this.sorting_direction == 'desc'){
          if (a[field] < b[field]) return 1;
          if (a[field] > b[field]) return -1;
          return 0;
        }else{
          if (a[field] < b[field]) return -1;
          if (a[field] > b[field]) return 1;
          return 0;
        }
      });
    },
    
    isDateRangeValid() {
      if ((this.date_from == '' || this.date_to == '') && this.queryType != '3') {
        alert('Debe seleccionar un rango de fechas');
        return false;
      }

      if (this.date_from > this.date_to && this.queryType != '3') {
        alert('La fecha de inicio debe ser menor o igual a la fecha de fin');
        return false;
      }

      return true;
    },

    resetFields() {
      this.transactions = [];
      this.current_search = '';
      this.sorting_by = 'total';
      this.sorting_direction = 'asc';
      this.item_filter = '';
      this.description_filter = '';
      this.total_filter = '';
      this.stock_filter = '';
      this.stock_commited_filter = '';
      this.stock_to_arrive_filter = '';
      this.provider_filter = '';
      this.sales_per_month_filter = '';
      this.months_in_stock_filter = '';
      this.order_suggestion_filter = '';
    },

    getData() {
      if(['1', '2', '3'].includes(this.queryType)){
        if (!this.isDateRangeValid()) return;
      }

      if (this.corporation == '') {
        alert('Debe seleccionar una corporación');
        return;
      }

      if(this.queryType == ''){
        alert('Debe seleccionar un tipo de reporte');
        return;
      }

      if(this.queryType == '3'){
        if(this.order_duration == ''){
          alert('Por favor, indique cuanto tiempo durará el pedido');
          return;
        }
        if(this.order_desired_stock == ''){
          alert('Por favor, indique cuanto tiempo de stock debe haber hasta que llegue el pedido');
          return;
        }
        if(this.durationBetweenDates.months <= 0){
          alert('Por favor, indique un rango de fechas válido');
          return;
        }
      }

      if(this.queryType == '4') {
        if(this.id_from == ''){
          alert('Por favor, indique el ID inicial');
          return;
        }
        if(this.id_to == ''){
          alert('Por favor, indique el ID final');
          return;
        }
        if(this.id_from > this.id_to){
          alert('Por favor, indique un rango de IDs válido');
          return;
        }
      }

      this.resetFields();

      switch (this.queryType) {
        case '1': // Productos vendidos
          axios.get(this.getRoute('/'), { params: { from: this.date_from, to: this.date_to, corporation: this.corporation } })
          .then(response => {
            this.current_search = `Movimientos entre ${this.date_from} y ${this.date_to}`;
            this.transactions = JSON.parse(response.data);
            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        break;
          case '2': // Productos sin movimiento
          axios.get(this.getRoute('/no-sales-items'), { params: { from: this.date_from, to: this.date_to, corporation: this.corporation } })
          .then(response => {
            this.current_search = `Movimientos entre ${this.date_from} y ${this.date_to}`;
            this.transactions = JSON.parse(response.data);
            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        break;
        case '3': // Sugerencia de compra
        axios.get(this.getRoute('/'), { params: { from: this.date_from + '-01', to: this.currentDate, corporation: this.corporation } })
        .then(response => {
          this.current_search = `Sugerencia de compra evaluando desde ${this.date_from}`;
          this.transactions = JSON.parse(response.data);
          this.transactions = this.transactions.map(item => {
            return {
              ...item,
              amount_to_buy: '',
            }
          });

          axios.get(this.getRoute('/no-sales-items'), { params: { from: this.date_from + '-01', to: this.currentDate, corporation: this.corporation } })
          .then(response => {
            let noSaleTransactions = JSON.parse(response.data);

            // add to transactions the items that have not been sold
            noSaleTransactions.forEach(item => {
              if(this.transactions.findIndex(transaction => transaction.item == item.item) == -1){
                this.transactions.push({
                  ...item,
                  amount_to_buy: '',
                });
              }
            });

            this.sortTransactionsBy(this.sorting_by);
          })
          .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
        break;
        case '4': // Movimientos por rango de IDs
        axios.get(this.getRoute('/per-id-range'), { params: { from: this.id_from, to: this.id_to, corporation: this.corporation } })
        .then(response => {
          this.current_search = `Movimientos entre ${this.id_from} y ${this.id_to}`;
          this.transactions = JSON.parse(response.data);
          this.sorting_by = 'item';
          this.sortTransactionsBy(this.sorting_by);
        })
      break;
      }
    },

    ExportData() {
      let transactions = this.normalicedTrasactions;

      if(this.queryType == '3' && this.onlyToBuy){
        transactions = this.normalicedTrasactions.filter(item => item['Cantidad a comprar'] != '');
      }

      let filename = this.current_search.replaceAll(' ', '_') + '.xlsx';
      let ws = XLSX.utils.json_to_sheet(transactions);
      let wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, ws, "People");
      XLSX.writeFile(wb,filename);
    }
  },

  computed: {
    durationBetweenDates() {
      let date_from = new Date(this.date_from);
      let date_to = new Date(this.currentDate);
      let diff = date_to.getTime() - date_from.getTime();
      let months = diff / (1000 * 3600 * 24 * 30);
      
      return {
        months: Math.floor(months),
        days: Math.floor((months - Math.floor(months)) * 30)
      }
    },

    currentDate() {
      let date = new Date();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      return `${date.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    },

    filteredTransactions() {
      let uniqueTransactions = [];
      this.transactions.forEach(item => {
        let index = uniqueTransactions.findIndex(transaction => transaction.item == item.item);
        if(index == -1){
          uniqueTransactions.push(item);
        }else{
          if(uniqueTransactions[index].last_purchase_date < item.last_purchase_date){
            uniqueTransactions[index] = item;
          }
        }
      });

      return uniqueTransactions
      .filter(item => {
        if (this.item_filter != '' && !item.item.toLowerCase().includes(this.item_filter.toLowerCase())) return false;
        if (this.description_filter != '' && !item.description.toLowerCase().includes(this.description_filter.toLowerCase())) return false;
        if (this.total_filter != '' && !item.total.toLowerCase().includes(this.total_filter.toLowerCase())) return false;
        if (this.stock_filter != '' && !item.stock.toLowerCase().includes(this.stock_filter.toLowerCase())) return false;
        if (this.stock_commited_filter != '' && !item.stock_comprometido.toLowerCase().includes(this.stock_commited_filter.toLowerCase())) return false;
        if (this.stock_to_arrive_filter != '' && !item.stock_esperando.toLowerCase().includes(this.stock_to_arrive_filter.toLowerCase())) return false;
        if (this.provider_filter != '' && !item.provider_description.toLowerCase().includes(this.provider_filter.toLowerCase())) return false;
        if (this.bill_id_filter != '' && !item.bill.toString().includes(this.bill_id_filter.toLowerCase())) return false;
        if (this.qty_filter != '' && !item.total.toString().includes(this.qty_filter.toLowerCase())) return false;
        if (this.last_cost_filter != '' && !item.last_cost.toString().includes(this.last_cost_filter.toLowerCase())) return false;
        if (this.last_cost_date_filter != '' && !item.last_cost_date.toString().includes(this.last_cost_date_filter.toLowerCase())) return false;
        if (this.sub_line_filter != '' && !item.sub_line.toLowerCase().includes(this.sub_line_filter.toLowerCase())) return false;
        if (this.ref_filter != '' && !item.ref.toLowerCase().includes(this.ref_filter.toLowerCase())) return false;
        if (this.store_filter != '' && !item.store.toLowerCase().includes(this.store_filter.toLowerCase())) return false;

        if(this.sales_per_month_filter != ''){
          if(!this.salesPerMonth(item.total, this.durationBetweenDates.months).toFixed(2).includes(this.sales_per_month_filter)) return false;
        }

        if(this.months_in_stock_filter != ''){
          if(!this.monthInStock(item.stock, item.total).toFixed(2).includes(this.months_in_stock_filter)) return false;
        }

        if(this.order_suggestion_filter != ''){
          if(!(this.orderSugesstion(item.stock, item.total, parseFloat(item.stock_comprometido).toFixed(2), parseFloat(item.stock_esperando).toFixed(2)) === this.order_suggestion_filter)) return false;
        }

        return true;
      })
      .map(item => {
        return {
          ...item,
          total: parseFloat(item.total).toFixed(2),
          stock: parseFloat(item.stock).toFixed(2),
          stock_commited: parseFloat(item.stock_comprometido).toFixed(2),
          stock_to_arrive: parseFloat(item.stock_esperando).toFixed(2),
          provider: item.provider_description,
          last_cost: parseFloat(item.last_cost).toFixed(2),
          last_cost_date: item.last_cost_date?.split(' ')[0],
          last_cost_qty: (parseFloat(item.last_purchase) || 0).toFixed(2),
          last_cost_date2: item.last_purchase_date
        }
      })
    },

    normalicedTrasactions() {
      return this.filteredTransactions.map(item => {
        if(this.onlyToBuy) {
          return {
            "Artículo": item.item,
            "Descripción": item.description,
            "OEM": item.ref,
            "Cantidad a comprar": this.transactionPerItem(item.item).amount_to_buy
          }
        }

        const finalItem = {
          "Artículo": item.item,
          "Descripción": item.description,
          "OEM": item.ref,
          "Sublínea": item.sub_line,
          "Vendido": item.total,
        }

        if(this.queryType != '4'){
          finalItem["En Stock"] = item.stock;
          finalItem["Comprometido"] = item.stock_commited;
          finalItem["Esperando"] = item.stock_to_arrive;
          finalItem["Proveedor"] = item.provider;
          finalItem["Último costo"] = item.last_cost;
          finalItem["Fecha de último costo"] = item.last_cost_date;
          finalItem["Cantidad de última compra"] = item.last_cost_qty;
        }

        if(this.queryType == '4'){
          finalItem["Almacém"] = item.store;
        }

        if(this.queryType == '3'){
          finalItem["Meses en stock"] = this.monthInStock(item.stock, item.total);
          finalItem["Ventas por mes"] = this.salesPerMonth(item.total, this.durationBetweenDates.months);
          finalItem["Sugerencia de compra"] = this.orderSugesstion(item.stock, item.total, item.stock_commited, item.stock_to_arrive);
          finalItem["Cantidad a comprar"] = this.transactionPerItem(item.item).amount_to_buy;
        }

        return finalItem;
      });
    },

    dateInputType() {
      return this.queryType === '3' ? 'month' : 'date';
    }
  }
})

const { createVuetify } = Vuetify;

const vuetify = createVuetify();

app.use(vuetify);

app.component('report-menu', ReportMenu);
app.component('report-configuration', ReportConfiguration);
app.component('report-sold-products', ReportSoldProducts);
app.component('report-no-movement-products', ReportNoMovementProducts);
app.component('report-suggestion-to-buy', ReportSuggestionToBuy);
app.component('report-orders', ReportOrders);
app.component('report-table-menu', ReportTableMenu);

app.mount('#app');