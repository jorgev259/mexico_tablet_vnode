function Table (props) {
  return <table className='table table-striped'>
    <thead>
      <tr>
        {props.columns.map(column => {
          return <th scope='col' key={column}>{column}</th>
        })}
      </tr>
    </thead>

    <tbody>
      {
        props.rows.map(row => {
          var key = tipo === 'registro' ? keys.map(k => row[k]).join('_') : ['Fecha'].concat(keys).map(k => row[k]).join('_')
          return <tr key={key}>
            {
              props.columns.map(entry => {
                return <td key={`${key}_${entry}`}>{row[entry]}</td>
              })
            }
          </tr>
        })
      }
    </tbody>
  </table>
}
