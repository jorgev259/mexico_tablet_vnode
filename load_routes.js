module.exports = function (app, io) {
  app.use(require('./routes/acceso')(io))
  app.use(require('./routes/extractora')(io))
  app.use(require('./routes/tunel')(io))
  return app
}
