/* global axios,$,toastr */
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
  'timeOut': '0',
  'extendedTimeOut': '0',
  'showEasing': 'swing',
  'hideEasing': 'linear',
  'showMethod': 'fadeIn',
  'hideMethod': 'fadeOut'
}

$('#addRutina').submit(function (event) {
  toastr.clear()
  let serialData = {tareas: []}

  $('#addRutina').serializeArray().forEach(e => {
    if (e.name.startsWith('tarea')) serialData.tareas.push(e.value)
    else serialData[e.name] = e.value
  })

  axios.post('/rutina', serialData).then(function (response) {
    toastr['success']('Ingreso correcto!')
  }).catch(function (error) {
    console.log(error.response)
    toastr['error'](error.response.data || 'Error de servidor')
  })
  event.preventDefault()
})

let labels = ['dia', 'semana', 'mes']

function myFunction (element) {
  $('#calendario').empty()
  let val = element.value
  for (var i = 0; i < val; i++) {
    let html = $(`<label for="${labels[i]}" class="col-md-2" id="label${labels[i]}">${labels[i]}:</label>
    <div class="col-md-2">
        <input type="number" name="${labels[i]}" class="form-control" id="${labels[i]}"
            />
    </div>`)

    html.each((i, e) => {
      $('#calendario')[0].append(e)
    })
  }
}
myFunction({value: 1})
