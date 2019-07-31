/* global toastr, $, axios, moment, ReactDOM, React, classNames, io */

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

function refresh () {
  axios({
    method: 'get',
    url: `/extractora/${$('#turno').val()}/${moment($('#fecha').val()).valueOf()}`
  }).then(res => {
    let { data } = res
    ReactDOM.render(
      Table(data),
      document.getElementById('rows')
    )
    toastr['success']('Registros Actualizados!')
  }).catch(function (error) {
    console.log(error)
    toastr['error']('Error al recuperar registros')
  })
}

$('.inputChange').change(refresh)

function Table (props) {
  let cols = ['lavadora', 'suciedad', 'responsable', 'supervisor', 'grado', 'prenda', 'hospital', 'reproceso', 'total', 'lavados', 'observaciones']
  return (
    <React.Fragment>
      {props.map(entry => {
        return <tr key={entry._id}>
          {
            cols.map(col =>
              <td key={col} className={classNames('text-left', { bold: col === 'hospital' })}>
                <input data-id={entry._id} type='text' name={col} defaultValue={entry[col] || ''} className='form-control editableInfo' required='required' onBlur={save} />
              </td>
            )
          }
        </tr>
      })}
    </React.Fragment>
  )
}

function save (ev) {
  let { id } = ev.target.dataset
  let { name, value } = ev.target
  if (!isNaN(value)) value = parseInt(value)

  axios.post('/extractora/modificar', { id: id, name: name, value: value }).then(function (response) {
    toastr['success']('Registros Actualizados!')
  })
    .catch(function (error) {
      console.log(error)
      toastr['error']('Error al actualizar registros')
    })
}

const socket = io('localhost:3005')
socket.on('extractora', function (msg) {
  console.log('refresh')
  refresh()
})
