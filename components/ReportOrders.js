const ReportOrders = {
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
              <td class="text-caption">{{ item['Almacén'] }}</td>
              <td class="text-caption">{{ item['Cantidad'] }}</td>
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
          'Almacén': '',
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
        return `${this.screenHeightPx - 130}px`;
      },
  
      computedItems() {
        const mappedItems = this.items.map(item => {
          return {
            'Artículo': item.item,
            'Descripción': item.description,
            'Almacén': item.store,
            'Cantidad': this.parseQuantity(item.total),
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