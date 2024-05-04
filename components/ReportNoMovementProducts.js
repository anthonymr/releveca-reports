const ReportNoMovementProducts = {
    template: `
      <div>
        <v-data-table
          :items="computedItems"
          :height="tableHeight"
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
            </tr>
            <tr>
              <template v-for="(column, key) in columns" :key="column.key">
                <td class="bg-grey-lighten-3">
                  <div class="d-flex align-center justify-between">
                    <span
                      class="cursor-pointer text-caption font-weight-bold mt-2 d-flex justify-center align-center"
                      @click="() => toggleSort(column)"
                    >
                      {{ column.title }}
                      <v-icon v-if="isSorted(column)" size="16" :icon="getSortIcon(column)"></v-icon>
                    </span>
                  </div>
                  <div class="mt-2">
                    <input
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
            </tr>
          </template>
          <template v-slot:footer.prepend>
            <report-table-menu
                :items="computedItems"
                :currentReport="currentReport"
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
          'Cantidad': ''
        },
  
        screenHeightPx: 0,
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
      }
    },
  
    computed: {
      tableHeight() {
        return `${this.screenHeightPx - 180}px`;
      },
  
      computedItems() {
        const mappedItems = this.items.map(item => {
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
          };
        });
  
        return mappedItems.filter(item => {
          return Object.keys(this.filters).every(key => {
            const filterValue = this.filters[key].toLowerCase();
            if (filterValue === '') {
          return true; // Don't filter if the value is empty
            }
            return item[key].toString().toLowerCase().includes(filterValue);
          });
        });
      }
    }
  };