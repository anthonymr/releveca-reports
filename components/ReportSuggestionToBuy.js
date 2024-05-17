const ReportSuggestionToBuy = {
    template: `
      <div>
        <v-data-table
          :items="computedItems"
          :height="tableHeight"
          :items-per-page="-1"
          :sort-by="sortBy"
          fixed-header
          mobile-breakpoint="xs"
          density="compact"
        >
          <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
            <tr>
              <td colspan="9" style="height:22px" class="bg-white"></td>
              <td
                colspan="3"
                style="height:22px"
                class="text-center font-weight-medium bg-grey-lighten-2"
              >
                Última compra
              </td>
              <td colspan="4" style="height:22px" class="bg-white"></td>
            </tr>
            <tr>
              <template v-for="(column, key) in columns" :key="column.key">
                <td class="bg-grey-lighten-3">
                  <div class="d-flex align-center justify-between">
                    <span
                      class="cursor-pointer text-caption font-weight-bold mt-2 d-flex justify-center align-center"
                      @click="sort(toggleSort, column)"
                    >
                      {{ column.title }}
                      <v-icon v-if="isSorted(column)" size="16" :icon="getSortIcon(column)"></v-icon>
                    </span>
                  </div>
                  <div class="mt-2">
                    <select v-if="column.key === 'Sugerencia'" class="table-input mb-2" @change="filters[column.key] = $event.target.value">
                      <option value="">Todos</option>
                      <option value="¡comprar!">¡comprar!</option>
                      <option value="comprar">comprar</option>
                      <option value="¡sobre existencia!">¡sobre existencia!</option>
                      <option value="no comprar">no comprar</option>
                    </select>
                    <select v-else-if="column.key === 'Sublínea'" class="table-input mb-2" @change="filters[column.key] = $event.target.value">
                      <option value="">Todos</option>
                      <option v-for="subline in differentSublines" :value="subline">{{ subline }}</option>
                    </select>
                    <input
                        v-else
                        class="table-input mb-2"
                        @keyup.enter="filters[column.key] = $event.target.value"
                    />
                  </div>
                </td>
              </template>
            </tr>
          </template>
  
          <template v-slot:item="{ item }">
            <tr>
                <td class="text-caption">{{ item['Artículo'] }}</td>
                <td class="text-caption">{{ item['Descripción'] }}</td>
                <td class="text-caption">{{ item['OEM'] }}</td>
                <td class="text-caption">{{ item['Sublínea'] }}</td>
                <td class="text-caption">{{ item['Vendido'] }}</td>
                <td class="text-caption">{{ item['Stock'] }}</td>
                <td class="text-caption">{{ item['Apartado'] }}</td>
                <td class="text-caption">{{ item['En espera'] }}</td>
                <td class="text-caption">{{ item['Proveedor'] }}</td>
                <td class="bg-grey-lighten-4 text-caption">{{ item['Fecha'] }}</td>
                <td class="bg-grey-lighten-4 text-caption">{{ item['Costo'] }}</td>
                <td class="bg-grey-lighten-4 text-caption">{{ item['Cantidad'] }}</td>
                <td class="text-caption">{{ item['Vendido por mes'] }}</td>
                <td class="text-caption">{{ item['Meses de stock'] }}</td>
                <td class="text-caption">
                    <v-chip
                        size="small"
                        density="compact"
                        variant="flat"
                        :color="orderSuggestionColor(item['Sugerencia'])"
                        :text="item['Sugerencia']"
                    />
                </td>
                <td class="text-caption">
                    <input type="number" class="table-input mb-2" v-model="toBuy[item['Artículo']]" />
                </td>
            </tr>
          </template>

            <template v-slot:footer.prepend>
                <report-table-menu
                    :items="computedItems"
                    :currentReport="currentReport"
                    :to-buy="toBuy"
                />
            </template>
        </v-data-table>
      </div>
    `,
  
    props: {
      items: {
        type: Array,
        default: () => []
      },

      currentReport: {
        type: Object,
        default: () => {}
      },
    },
  
    data() {
      return {
        filters: {
          'Artículo': '',
          'Descripción': '',
          'OEM': '',
          'Sublínea': '',
          'Vendido': '',
          'Stock': '',
          'Apartado': '',
          'En espera': '',
          'Proveedor': '',
          'Fecha': '',
          'Costo': '',
          'Cantidad': '',
          'Vendido por mes': '',
          'Meses de stock': '',
          'Sugerencia': '',
        },

        sortBy: [{ key: 'Sublínea', type: 'asc' }],
  
        screenHeightPx: 0,

        toBuy: {},
      }
    },
  
    mounted() {
      this.onScreenResize();
      window.addEventListener('resize', this.onScreenResize);
    },
  
    beforeUnmount() {
      window.removeEventListener('resize', this.onScreenResize);
    },
  
    methods: {
      sort(toggleSort, column) {
        toggleSort(column);
      },

      onScreenResize() {
        this.screenHeightPx = window.innerHeight;
      },
  
      parseCurrency(value) {
        if(!value) return '';
        return `$${parseFloat(value).toFixed(2)}`;
      },
  
      parseDate(value) {
        if(!value) return '';
        return value.split(' ')[0];
      },
  
      parseQuantity(value) {
        if(!value) return '';
        return parseFloat(value).toFixed(2);
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

      orderSugesstion(monthInStock) {
        if ( monthInStock < this.currentReport.minStock ) return '¡comprar!';
        if ( monthInStock == this.currentReport.minStock ) return 'comprar';
        if ( monthInStock > this.currentReport.minStock + 12 ) return '¡sobre existencia!';
        return 'no comprar';
      },
  
      orderSuggestionColor(orderSuggestion) {
        if (orderSuggestion == '¡comprar!') return 'red';
        if (orderSuggestion == 'comprar') return 'orange';
        if (orderSuggestion == '¡sobre existencia!') return 'primary';
        return 'green';
      },
    },
  
    computed: {
      differentSublines() {
        return [...new Set(this.items.map(item => item.sub_line))];
      },

      tableHeight() {
        return `${this.screenHeightPx - 130}px`;
      },
  
      computedItems() {
        const mappedItems = this.items.map(item => {
          const salesPerMonth = this.salesPerMonth(item.total);
          let monthInStock = this.monthInStock(item.stock, item.total, item.stock_comprometido, item.stock_esperando);
          const suggestion = this.orderSugesstion(monthInStock);

          if(isNaN(monthInStock)) monthInStock = 0;
          if(monthInStock < 0) monthInStock = 0;
          if(monthInStock == Infinity) monthInStock = 0;

          return {
            'Artículo': item.item,
            'Descripción': item.description,
            'OEM': item.ref,
            'Sublínea': item.sub_line,
            'Vendido': this.parseQuantity(item.total),
            'Stock': this.parseQuantity(item.stock),
            'Apartado': this.parseQuantity(item.stock_comprometido),
            'En espera': this.parseQuantity(item.stock_esperando),
            'Proveedor': item.provider_description,
            'Fecha': this.parseDate(item.last_cost_date),
            'Costo': this.parseCurrency(item.last_cost),
            'Cantidad': this.parseQuantity(item.last_purchase),
            'Vendido por mes': salesPerMonth.toFixed(2),
            'Meses de stock': monthInStock.toFixed(2),
            'Sugerencia': suggestion,
            'Comprar': '',
          };
        });
  
        return mappedItems.filter(item => {
          return Object.keys(this.filters).every(key => {
            const filterValue = this.filters[key].toLowerCase();
            if (filterValue === '') return true;
            if (key === 'Sugerencia') {
              return item[key].toLowerCase() === filterValue;
            }
            return item[key].toString().toLowerCase().includes(filterValue);
          });
        });
      },

      currentDate() {
        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        return `${date.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      },

      durationBetweenDates() {
        if(!this.currentReport?.from) return { months: 0, days: 0 }
        let date_from = new Date(this.currentReport?.from);
        let date_to = new Date(this.currentDate);
        let diff = date_to.getTime() - date_from.getTime();
        let months = diff / (1000 * 3600 * 24 * 30);
        
        return {
          months: Math.floor(months),
          days: Math.floor((months - Math.floor(months)) * 30)
        }
      },
    }
  };