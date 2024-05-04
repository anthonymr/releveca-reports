const ReportTableMenu = {
    template: `
        <div>
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn
                        variant="tonal"
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        class="mx-6"
                    />
                </template>
                <v-list>
                    <v-list-item v-for="item in menuItems" @click="item.action" class="d-flex">
                        <v-icon>{{item.icon}}</v-icon> {{item.title}}
                    </v-list-item>
                </v-list>
            </v-menu>
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

        toBuy: {
            type: Object,
            default: () => {}
        }
    },
  
    data() {
        return {

        }
    },

    methods: {
        exportExcel(toBuy = false) {
            if(!this.currentReport) return

            let itemsWithToBuy = this.items

            if(this.currentReport.report === 'Sugerencia de compra') {
                itemsWithToBuy = this.items.map(item => {
                    return { ...item, 'Comprar': this.toBuy[item['Artículo']] || '' }
                })
                if(toBuy) itemsWithToBuy = itemsWithToBuy.filter(item => item['Comprar'] !== '' && item['Comprar'] !== '0')
            }

            const filename = `${this.currentReport.report} ${this.currentReport.from} - ${this.currentReport.to}.xlsx`
            const ws = XLSX.utils.json_to_sheet(itemsWithToBuy);
            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, ws, this.currentReport.report);
            XLSX.writeFile(wb, filename);
        },
        
        export() {
            this.exportExcel();
        },

        exportToBuy() {
            this.exportExcel(true);
        }
    },

    computed: {
        menuItems() {
            const options = [
                { title: 'Exportar', icon: 'mdi-file-export', action: this.export },
            ]

            if(this.currentReport?.report === 'Sugerencia de compra') {
                options.push({ title: 'Exportar (solo comprar)', icon: 'mdi-file-document-edit', action: this.exportToBuy })
            }
            
            return options
        }
    }
  };