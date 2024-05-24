const ReportConfiguration = {
    template: `
        <div class="pa-3">
            <v-select
                :items="['LYC', 'RELEVECA']"
                variant="outlined"
                density="compact"
                label="Empresa"
                class="mt-1"
                v-model="selectedCompany"
            />

            <v-select
                v-show="selectedCompany"
                :items="reports"
                variant="outlined"
                density="compact"
                label="Reporte"
                class="mt-1"
                v-model="selectedReport"
            />

            <span v-if="!isPurchaseSuggestions && canShowForm">
                <v-label>Seleccione un rango</v-label>
                <v-date-picker
                    v-model="range"
                    hide-header
                    landscape
                    show-adjacent-months
                    multiple="range"
                    view-mode="month"
                />
            </span>

            <span v-else-if="canShowForm">
                <v-label>Evaluar desde</v-label>
                <div class="d-flex ga-2">
                    <v-select
                        class="w-50"
                        v-model="simpleMonth"
                        variant="outlined"
                        density="compact"
                        :items="months"
                        item-value="value"
                        item-title="text"
                    />

                    <v-select
                        class="w-50"
                        v-model="simpleYear"
                        variant="outlined"
                        density="compact"
                        :items="years"
                    />
                </div>

                <v-label class="mt-2">Meses en llegar el pedido</v-label>
                <v-text-field
                    v-model="monthToArrive"
                    type="number"
                    class="mt-2"
                    density="compact"
                    variant="outlined"
                    hide-details
                />

                <v-label class="mt-2">Stock mínimo</v-label>
                <v-text-field
                    v-model="minStock"
                    type="number"
                    class="mt-2"
                    density="compact"
                    variant="outlined"
                    hide-details
                />
            </span>

            <v-btn
                v-if="canShowForm"
                class="mt-6 w-100"
                color="primary"
                text="Generar Reporte"
                flat
                @click="generateReport"
            />

            <div v-for="error in errors" :key="error" class="text-red text-caption">{{ error }}</div>
        </div>
    `,
  
    data() {
        return {
            selectedCompany: null,
            selectedReport: null,

            range: [],

            // last month
            simpleMonth: (new Date()).getMonth() + 1,
            simpleYear: (new Date()).getFullYear(),

            monthToArrive: 5,
            minStock: 6,

            errors: [],

            reports: [
                'Productos vendidos',
                'Productos sin movimiento',
                'Sugerencia de compra',
                'Rango de notas de entrega'
            ]
        }
    },

    emits: ['generate-report'],

    methods: {
        generateReport() {
            if(!this.validateForm()) return;
            
            let report = {
                corporation: this.selectedCompany,
                report: this.selectedReport,
                from: this.from,
                to: this.to,
            };

            if(this.isPurchaseSuggestions) {
                report = {
                    ...report,
                    from: this.evaluateFrom + '-01',
                    to: this.currentDate,
                    monthToArrive: this.monthToArrive,
                    minStock: this.minStock,
                }
            }

            this.$emit('generate-report', report);
        },

        validateForm() {
            this.errors = [];

            if(!this.selectedCompany){
                this.errors.push('Debe seleccionar una empresa');
            }

            if(!this.selectedReport){
                this.errors.push('Debe seleccionar un reporte');
            }

            if(!this.isPurchaseSuggestions && !this.isNotesRange){
                if(!this.from || !this.to){
                    this.errors.push('Debe seleccionar un rango de fechas');
                }
    
                if(this.from > this.to){
                    const aux = this.from;
                    this.from = this.to;
                    this.to = aux;
                }
            }

            if(this.isPurchaseSuggestions){
                if(!this.evaluateFrom){
                    this.errors.push('Seleccione un mes de evaluación');
                }
    
                if(!this.monthToArrive){
                    this.errors.push('Indique cuantos meses tardará en llegar el pedido');
                }
    
                if(!this.minStock){
                    this.errors.push('Seleccione un stock deseado mínimo');
                }

                if(this.durationBetweenDates.months <= 0){
                    this.errors.push('Indique un rango de fechas válido');
                }
            }

            if(this.isNotesRange) {
                if(!this.from || !this.to){
                    this.errors.push('Seleccione un rango de IDs');
                }

                if(this.from > this.to){
                    const aux = this.from;
                    this.from = this.to;
                    this.to = aux;
                }
            }

            return !this.errors.length;
        },
    },

    computed: {
        months() {
            return Array.from({length: 12}, (_, i) => ({ value: i + 1, text: new Date(0, i).toLocaleString('es-ES', { month: 'long' }) }));
        },

        years() {
            return Array.from({length: 5}, (_, i) => (new Date().getFullYear() - i).toString());
        },

        evaluateFrom() {
            if(!this.simpleMonth || !this.simpleYear) return null;

            const year = this.simpleYear;
            const month = this.simpleMonth.toString().padStart(2, '0');
            return `${year}-${month}`;
        },

        from() {
            if(!this.range.length) return null;

            const date = new Date(this.range[0]);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        to() {
            if(this.range.length < 2) return null;

            const date = new Date(this.range.at(-1));
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        inputFieldType() {
            return this.isNotesRange ? 'number' : 'date';
        },

        canShowForm() {
            return this.selectedCompany && this.selectedReport;
        },

        isPurchaseSuggestions() {
            return this.selectedReport === 'Sugerencia de compra';
        },

        isNotesRange() {
            return this.selectedReport === 'Rango de notas de entrega';
        },

        durationBetweenDates() {
            let date_from = new Date(this.evaluateFrom);
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
    }
  
  };