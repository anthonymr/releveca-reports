const app = Vue.createApp({
  data() {
    return {
      currentReport: null,
      drawer: false,
      tableItems: [],
      loadingData: false,
      // route: 'http://localhost:8081',
      // //route: 'http://192.168.0.162:8080',
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

      console.log({suggestionToBuy});

      console.log({suggestionToBuy: suggestionToBuy.filter(item => item.item == 'ENFB-0005')});
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

    getRoute(resource) {
      return this.computedRoute + resource;
    },
  },

  computed: {
    computedRoute() {
      let currentRoute = window.location.href;
      currentRoute = currentRoute.split('//')[1];
      currentRoute = currentRoute.split(':')[0];

      if(currentRoute == 'localhost' || currentRoute == '/C') return 'http://localhost:8081';

      return `http://${currentRoute}:8080`;
    },
    currentReportComponent() {
      if(!this.currentReport?.report) return null;
      if(this.currentReport.report == 'Productos vendidos') return 'report-sold-products';
      if(this.currentReport.report == 'Productos sin movimiento') return 'report-no-movement-products';
      if(this.currentReport.report == 'Sugerencia de compra') return 'report-suggestion-to-buy';
      if(this.currentReport.report == 'Rango de notas de entrega') return 'report-orders';
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