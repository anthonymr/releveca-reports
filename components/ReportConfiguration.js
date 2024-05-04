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
                <v-label>Desde</v-label>
                <input class="date-input" :type="inputFieldType" v-model="from">

                <v-label class="mt-2">Hasta</v-label>
                <input class="date-input" :type="inputFieldType" v-model="to">
            </span>

            <span v-else-if="canShowForm">
                <v-label>Evaluar desde</v-label>
                <input class="date-input" type="month" v-model="evaluateFrom">

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

            from: null,
            to: null,

            evaluateFrom: null,
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