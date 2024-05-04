const ReportMenu = {
    template: `
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn
                    color="grey"
                    v-bind="props"
                    flat
                    prepend-icon="mdi-menu"
                >
                    Menu de reportes
                </v-btn>
            </template>
            <v-list>
                <v-list-item
                    v-for="report in reports"
                    :key="report"
                    @click="$emit('report-selected', report)"
                >
                    <v-list-item-title>
                        {{ report }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    `,

    emits: ['report-selected'],
  
    data() {
        return {
            reports: [
                'Productos vendidos',
                'Productos sin movimiento',
                'Sugerencia de compra',
                'Rango de notas de entrega'
            ]
        }
    },
  
    methods: {
    }
  };