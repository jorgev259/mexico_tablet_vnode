/* global $,location,toastr,axios */
toastr.options = {
  'closeButton': true,
  'debug': false,
  'newestOnTop': false,
  'progressBar': false,
  'positionClass': 'toast-top-right',
  'preventDuplicates': true,
  'onclick': null,
  'showDuration': '300',
  'hideDuration': '1000',
  'timeOut': '5000',
  'extendedTimeOut': '1000',
  'showEasing': 'swing',
  'hideEasing': 'linear',
  'showMethod': 'fadeIn',
  'hideMethod': 'fadeOut'
}

let numberRutina = 1
function addRutina () { // eslint-disable-line
  numberRutina++
  let html = $(`<div class="form-group row">
    <label for="tarea${numberRutina}" class="col-sm-2 col-form-label">
        ${numberRutina}.) Descripción
    </label>
    <div class="col-sm-10">
        <input type="text" class="form-control" name="tarea${numberRutina}" id="tarea${numberRutina}" />
    </div>
</div>`)
  html.each((i, e) => {
    $('#tareas')[0].append(e)
  })
}

$('#rutinaForm').submit(function (event) {
  let serialData = {dias: [], tareas: []}
  $('.lockScreen').show()

  $('#rutinaForm').serializeArray().forEach(e => {
    // serialData[e.name] = e.value
    if (e.name.startsWith('day')) {
      serialData.dias.push(e.value)
    } else if (e.name.startsWith('tarea')) {
      serialData.tareas.push(e.value)
    } else {
      serialData[e.name] = e.value
    }
  })

  axios.post('/registro', serialData).then(function (response) {
    setTimeout(function () {
      location.reload(true)
    }, toastr.options.timeOut)
    toastr['success']('Rutina agregada!')
  }).catch(function (error) {
    console.log(error)
    toastr['error']('Error al agregar rutina')
  }).finally(function () {
    $('.lockScreen').hide()
  })
  event.preventDefault()
})

function save (rutina, tarea, action) { // eslint-disable-line
  $('.lockScreen').show()
  axios.post('/saveCheck', {
    rutina: rutina,
    tarea: tarea,
    action: action
  }).then(function (response) {
    setTimeout(function () {
      location.reload(true)
    }, toastr.options.timeOut)
    toastr['success']('Rutina agregada!')
  }).catch(function (error) {
    console.log(error)
    toastr['error']('Error al agregar rutina')
  }).finally(function () {
    $('.lockScreen').hide()
  })
}
