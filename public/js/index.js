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

$('#addUser').submit(function (event) {
  let serialData = {}

  $('#addUser').serializeArray().forEach(e => {
    serialData[e.name] = e.value
  })

  axios.post('/login', serialData).then(function (response) {
    toastr['success']('Ingreso correcto!')
    setTimeout(function () {
      const urlParams = new URLSearchParams(window.location.search)
      window.location.replace(baseURL + '/ingreso')
    }, toastr.options.timeOut)
  })
    .catch(function (error) {
      console.log(error.response)
      toastr['error'](error.response.data || 'Error de servidor')
    })
  event.preventDefault()
})
