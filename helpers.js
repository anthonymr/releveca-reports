const path = 'http://localhost:8081';
//const path = 'http://192.168.0.162:8080';

function isDateRangeValid(date_from, date_to){
  if (date_from == '' || date_to == '') {
    alert('Debe seleccionar un rango de fechas');
    return false;
  }

  if (date_from > date_to) {
    alert('La fecha de inicio debe ser menor o igual a la fecha de fin');
    return false;
  }

  return true;
}

function getRoute(route) {
  return `${path}${route}`;
}